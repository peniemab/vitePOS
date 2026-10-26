/**
 * Ventes, sous `boutiques/{id}/sales/{id}`, et panier de la caisse.
 *
 * Une vente s'enregistre en une seule écriture groupée (fonctionne hors ligne) :
 * la vente, un mouvement « vente » couvrant toutes les lignes, et `increment(-quantité)`
 * sur chaque produit. L'annulation fait l'inverse avec un mouvement « annulation ».
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { collection, doc, increment, limit, onSnapshot, orderBy, query, serverTimestamp, where, writeBatch, type DocumentData } from "firebase/firestore";
import { notifications } from "@mantine/notifications";
import { getDb } from "./firebase";
import { countSale } from "./monthStats";
import { markReturned, markSold } from "./serials";
import { warrantyUntil } from "../lib/serials";
import { monthOf } from "../lib/monthStats";
import { errorMessage } from "./errors";
import { track } from "./sync";
import { useReady } from "./session";
import type { Actor } from "./products";
import { addToCart, clampPercent, computeTotals, dayKey, lineTotal, setQuantity, stockByProduct, type CartLine, type PaymentInput, type PaymentResult, type Totals } from "../lib/cart";
import { isCurrency, type Currency } from "../lib/fx";
import { isUnit, type Pack, type Product } from "../lib/products";
import type { Sale, SaleLine, SalePayment } from "../lib/sales";

const salesCol = (b: string) => collection(getDb(), "boutiques", b, "sales");
const productsCol = (b: string) => collection(getDb(), "boutiques", b, "products");
const movementsCol = (b: string) => collection(getDb(), "boutiques", b, "stockMovements");
const clientsCol = (b: string) => collection(getDb(), "boutiques", b, "clients");

function ms(v: unknown): number {
  return v && typeof v === "object" && "toMillis" in v ? (v as { toMillis(): number }).toMillis() : 0;
}

function num(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

function toSale(id: string, d: DocumentData, synced: boolean): Sale {
  const p = (d.payment ?? {}) as Record<string, unknown>;
  const createdAtMs = ms(d.createdAt) || num(d.clientAtMs);
  return {
    id,
    uid: String(d.uid ?? ""),
    memberName: String(d.memberName ?? ""),
    lines: (Array.isArray(d.lines) ? d.lines : []).map((l: Record<string, unknown>) => ({
      productId: String(l.productId ?? ""),
      name: String(l.name ?? ""),
      unit: isUnit(l.unit) ? l.unit : "u",
      unitPrice: num(l.unitPrice),
      quantity: num(l.quantity),
      lineTotal: num(l.lineTotal),
      ...(l.packId ? { packId: String(l.packId), packName: String(l.packName ?? ""), packUnits: num(l.packUnits) || 1 } : {}),
      ...(l.serial ? { serial: String(l.serial), warrantyUntil: String(l.warrantyUntil ?? "") } : {}),
    })),
    subtotal: num(d.subtotal),
    discountPercent: num(d.discountPercent),
    discount: num(d.discount),
    total: num(d.total),
    currency: isCurrency(d.currency) ? d.currency : "CDF",
    payment: {
      method: p.method === "mobile_money" ? "mobile_money" : "especes",
      currency: isCurrency(p.currency) ? p.currency : "CDF",
      // Les anciennes ventes ne gardaient que le taux du dollar.
      rates: p.rates && typeof p.rates === "object"
        ? { USD: num((p.rates as Record<string, unknown>).USD), EUR: num((p.rates as Record<string, unknown>).EUR) }
        : num(p.rate) > 0
          ? { USD: num(p.rate), EUR: 0 }
          : null,
      due: num(p.due),
      received: num(p.received),
      change: num(p.change),
    },
    clientId: String(d.clientId ?? ""),
    clientName: String(d.clientName ?? ""),
    inStats: d.inStats === true,
    status: d.status === "annulee" ? "annulee" : "validee",
    cancelReason: String(d.cancelReason ?? ""),
    cancelledByName: String(d.cancelledByName ?? ""),
    createdAtMs,
    dayKey: String(d.dayKey ?? (createdAtMs ? dayKey(createdAtMs) : "")),
    synced,
  };
}

export function watchSale(boutiqueId: string, saleId: string, cb: (sale: Sale | null) => void, onError: (e: unknown) => void) {
  return onSnapshot(
    doc(salesCol(boutiqueId), saleId),
    { includeMetadataChanges: true },
    (s) => cb(s.exists() ? toSale(s.id, s.data(), !s.metadata.hasPendingWrites) : null),
    onError,
  );
}

/** Les ventes d'une journée, les plus récentes d'abord. */
export function watchSalesOfDay(boutiqueId: string, day: string, cb: (sales: Sale[]) => void, onError: (e: unknown) => void) {
  return onSnapshot(
    query(salesCol(boutiqueId), where("dayKey", "==", day)),
    { includeMetadataChanges: true },
    (s) => cb(s.docs.map((d) => toSale(d.id, d.data(), !d.metadata.hasPendingWrites)).sort((a, b) => b.createdAtMs - a.createdAtMs)),
    onError,
  );
}

/** Les ventes d'une période (jours « AAAA-MM-JJ » inclus). */
export function watchSalesBetween(boutiqueId: string, start: string, end: string, cb: (sales: Sale[]) => void, onError: (e: unknown) => void) {
  return onSnapshot(
    query(salesCol(boutiqueId), where("dayKey", ">=", start), where("dayKey", "<=", end)),
    (s) => cb(s.docs.map((d) => toSale(d.id, d.data(), !d.metadata.hasPendingWrites))),
    onError,
  );
}

/** Les 50 derniers achats d'un client. */
export function watchClientSales(boutiqueId: string, clientId: string, cb: (sales: Sale[]) => void, onError: (e: unknown) => void) {
  return onSnapshot(
    query(salesCol(boutiqueId), where("clientId", "==", clientId), orderBy("createdAt", "desc"), limit(50)),
    (s) => cb(s.docs.map((d) => toSale(d.id, d.data(), !d.metadata.hasPendingWrites))),
    onError,
  );
}

function onWriteError(e: unknown) {
  notifications.show({
    color: "red",
    title: "Vente refusée par le serveur",
    message: `${errorMessage(e)} Vérifiez le stock et l'historique des ventes.`,
    autoClose: false,
  });
}

/** Enregistre la vente et sort le stock. Renvoie l'identifiant de la vente (tout de suite, même hors ligne). */
export function createSale(
  actor: Actor,
  currency: Currency,
  cart: CartLine[],
  discountPercent: number,
  input: PaymentInput,
  result: PaymentResult,
  client?: { id: string; name: string },
): string {
  const db = getDb();
  const batch = writeBatch(db);
  const now = Date.now();
  const saleRef = doc(salesCol(actor.boutiqueId));
  const movementRef = doc(movementsCol(actor.boutiqueId));
  const totals = computeTotals(cart, discountPercent, currency);
  // Firestore refuse les champs `undefined` : les champs d'emballage ne sont écrits que pour un emballage.
  const lines: SaleLine[] = cart.map((l) => ({
    productId: l.productId,
    name: l.name,
    unit: l.unit,
    unitPrice: l.unitPrice,
    quantity: l.quantity,
    lineTotal: lineTotal(l, currency),
    ...(l.packId ? { packId: l.packId, packName: l.packName ?? "", packUnits: l.packUnits ?? 1 } : {}),
    ...(l.serial ? { serial: l.serial, warrantyUntil: warrantyUntil(dayKey(now), l.warrantyMonths ?? 0) } : {}),
  }));
  // Stock retiré à l'unité, un seul total par produit (bouteilles et paquets additionnés).
  const out = stockByProduct(lines);
  const payment: SalePayment = {
    method: input.method,
    currency: input.payCurrency,
    rates: result.rates,
    due: result.due,
    received: input.method === "especes" ? input.received : result.due,
    change: result.change,
  };

  batch.set(movementRef, {
    type: "vente",
    productIds: [...out.keys()],
    deltas: Object.fromEntries([...out].map(([id, q]) => [id, -q])),
    names: Object.fromEntries(lines.map((l) => [l.productId, l.name])),
    reason: "",
    refId: saleRef.id,
    uid: actor.uid,
    memberName: actor.memberName,
    createdAt: serverTimestamp(),
    clientAtMs: now,
  });
  batch.set(saleRef, {
    uid: actor.uid,
    memberName: actor.memberName,
    lines,
    subtotal: totals.subtotal,
    discountPercent: clampPercent(discountPercent),
    discount: totals.discount,
    total: totals.total,
    currency,
    payment,
    clientId: client?.id ?? "",
    clientName: client?.name ?? "",
    inStats: true,
    status: "validee",
    movementId: movementRef.id,
    dayKey: dayKey(now),
    createdAt: serverTimestamp(),
    clientAtMs: now,
  });
  for (const [productId, q] of out) {
    batch.update(doc(productsCol(actor.boutiqueId), productId), {
      stock: increment(-q),
      lastMovementId: movementRef.id,
      updatedAt: serverTimestamp(),
      updatedBy: actor.uid,
    });
  }
  countSale(batch, actor.boutiqueId, monthOf(dayKey(now)), currency, totals.total, 1);
  for (const l of lines) if (l.serial) markSold(batch, actor, l.serial, saleRef.id, dayKey(now), l.warrantyUntil ?? "");
  if (client) {
    batch.update(doc(clientsCol(actor.boutiqueId), client.id), {
      purchaseCount: increment(1),
      totalSpent: increment(totals.total),
      lastPurchaseAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      updatedBy: actor.uid,
    });
  }
  track(batch.commit(), onWriteError);
  return saleRef.id;
}

/** Annule une vente du jour et remet les articles en stock. */
export function cancelSale(actor: Actor, sale: Sale, reason: string): void {
  const batch = writeBatch(getDb());
  const movementRef = doc(movementsCol(actor.boutiqueId));
  const back = stockByProduct(sale.lines);
  batch.set(movementRef, {
    type: "annulation",
    productIds: [...back.keys()],
    deltas: Object.fromEntries(back),
    names: Object.fromEntries(sale.lines.map((l) => [l.productId, l.name])),
    reason: reason.trim().slice(0, 200),
    refId: sale.id,
    uid: actor.uid,
    memberName: actor.memberName,
    createdAt: serverTimestamp(),
    clientAtMs: Date.now(),
  });
  batch.update(doc(salesCol(actor.boutiqueId), sale.id), {
    status: "annulee",
    cancelReason: reason.trim().slice(0, 200),
    cancelledBy: actor.uid,
    cancelledByName: actor.memberName,
    cancelledAt: serverTimestamp(),
    cancelMovementId: movementRef.id,
  });
  for (const [productId, q] of back) {
    batch.update(doc(productsCol(actor.boutiqueId), productId), {
      stock: increment(q),
      lastMovementId: movementRef.id,
      updatedAt: serverTimestamp(),
      updatedBy: actor.uid,
    });
  }
  // Une vente faite avant les compteurs mensuels n'y figure pas : rien à retirer.
  if (sale.inStats) countSale(batch, actor.boutiqueId, monthOf(sale.dayKey), sale.currency, sale.total, -1);
  for (const l of sale.lines) if (l.serial) markReturned(batch, actor, l.serial);
  if (sale.clientId) {
    batch.update(doc(clientsCol(actor.boutiqueId), sale.clientId), {
      purchaseCount: increment(-1),
      totalSpent: increment(-sale.total),
      updatedAt: serverTimestamp(),
      updatedBy: actor.uid,
    });
  }
  track(batch.commit(), (e) =>
    notifications.show({ color: "red", title: "Annulation refusée par le serveur", message: errorMessage(e), autoClose: false }),
  );
}

/* ---------- Panier (gardé sur l'appareil : il survit à un rechargement de la page) ---------- */

interface CartClient {
  id: string;
  name: string;
}

interface Cart {
  lines: CartLine[];
  discountPercent: number;
  client: CartClient | null;
  setClient: (c: CartClient | null) => void;
  totals: Totals;
  /** Ajoute le produit à l'unité, ou un de ses emballages (`pack`). */
  add: (product: Product, qty?: number, pack?: Pack | null, serial?: string) => void;
  /** `key` : `lineKey(ligne)`. */
  setQty: (key: string, qty: number) => void;
  setDiscountPercent: (p: number) => void;
  clear: () => void;
}

const CartContext = createContext<Cart | null>(null);

interface Stored {
  lines: CartLine[];
  discountPercent: number;
  client: CartClient | null;
}

function load(key: string): Stored {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const v = JSON.parse(raw) as Stored;
      if (Array.isArray(v.lines))
        return { lines: v.lines, discountPercent: clampPercent(Number(v.discountPercent)), client: v.client?.id ? v.client : null };
    }
  } catch {
    // Stockage indisponible (navigation privée…) : panier vide.
  }
  return { lines: [], discountPercent: 0, client: null };
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { boutique } = useReady();
  const key = `vitepos.cart.${boutique.id}`;
  const [state, setState] = useState<Stored>(() => load(key));

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // Sans stockage, le panier vit seulement en mémoire.
    }
  }, [key, state]);

  const add = useCallback((p: Product, qty = 1, pack?: Pack | null, serial?: string) => {
    const line = pack
      ? { productId: p.id, name: p.name, unit: p.unit, unitPrice: pack.price, packId: pack.id, packName: pack.name, packUnits: pack.units }
      : serial
        ? { productId: p.id, name: p.name, unit: p.unit, unitPrice: p.sellPrice, serial, warrantyMonths: p.warrantyMonths }
        : { productId: p.id, name: p.name, unit: p.unit, unitPrice: p.sellPrice };
    setState((s) => ({ ...s, lines: addToCart(s.lines, line, qty) }));
  }, []);
  const setQty = useCallback((key: string, qty: number) => {
    setState((s) => ({ ...s, lines: setQuantity(s.lines, key, qty) }));
  }, []);
  const setDiscountPercent = useCallback((p: number) => setState((s) => ({ ...s, discountPercent: clampPercent(p) })), []);
  const setClient = useCallback((client: CartClient | null) => setState((s) => ({ ...s, client })), []);
  const clear = useCallback(() => setState({ lines: [], discountPercent: 0, client: null }), []);

  const value = useMemo<Cart>(
    () => ({
      ...state,
      totals: computeTotals(state.lines, state.discountPercent, boutique.currency),
      add,
      setQty,
      setDiscountPercent,
      setClient,
      clear,
    }),
    [state, boutique.currency, add, setQty, setDiscountPercent, setClient, clear],
  );
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): Cart {
  const c = useContext(CartContext);
  if (!c) throw new Error("useCart en dehors de CartProvider");
  return c;
}
