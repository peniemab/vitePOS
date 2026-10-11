/**
 * Ventes, sous `boutiques/{id}/sales/{id}`, et panier de la caisse.
 *
 * Une vente s'enregistre en une seule écriture groupée (fonctionne hors ligne) :
 * la vente, un mouvement « vente » couvrant toutes les lignes, et `increment(-quantité)`
 * sur chaque produit. L'annulation fait l'inverse avec un mouvement « annulation ».
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { collection, doc, increment, onSnapshot, serverTimestamp, writeBatch, type DocumentData } from "firebase/firestore";
import { notifications } from "@mantine/notifications";
import { getDb } from "./firebase";
import { errorMessage } from "./errors";
import { track } from "./sync";
import { useReady } from "./session";
import type { Actor } from "./products";
import { addToCart, clampPercent, computeTotals, dayKey, lineTotal, setQuantity, type CartLine, type PaymentInput, type PaymentResult, type Totals } from "../lib/cart";
import { isCurrency, type Currency } from "../lib/fx";
import { isUnit, type Product } from "../lib/products";
import type { Sale, SaleLine, SalePayment } from "../lib/sales";

const salesCol = (b: string) => collection(getDb(), "boutiques", b, "sales");
const productsCol = (b: string) => collection(getDb(), "boutiques", b, "products");
const movementsCol = (b: string) => collection(getDb(), "boutiques", b, "stockMovements");

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
    })),
    subtotal: num(d.subtotal),
    discountPercent: num(d.discountPercent),
    discount: num(d.discount),
    total: num(d.total),
    currency: isCurrency(d.currency) ? d.currency : "CDF",
    payment: {
      method: p.method === "mobile_money" ? "mobile_money" : "especes",
      currency: isCurrency(p.currency) ? p.currency : "CDF",
      rate: num(p.rate),
      due: num(p.due),
      received: num(p.received),
      change: num(p.change),
    },
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
): string {
  const db = getDb();
  const batch = writeBatch(db);
  const saleRef = doc(salesCol(actor.boutiqueId));
  const movementRef = doc(movementsCol(actor.boutiqueId));
  const totals = computeTotals(cart, discountPercent, currency);
  const lines: SaleLine[] = cart.map((l) => ({ ...l, lineTotal: lineTotal(l, currency) }));
  const payment: SalePayment = {
    method: input.method,
    currency: input.payCurrency,
    rate: result.rateUsed,
    due: result.due,
    received: input.method === "especes" ? input.received : result.due,
    change: result.change,
  };
  const now = Date.now();

  batch.set(movementRef, {
    type: "vente",
    productIds: lines.map((l) => l.productId),
    deltas: Object.fromEntries(lines.map((l) => [l.productId, -l.quantity])),
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
    status: "validee",
    movementId: movementRef.id,
    dayKey: dayKey(now),
    createdAt: serverTimestamp(),
    clientAtMs: now,
  });
  for (const l of lines) {
    batch.update(doc(productsCol(actor.boutiqueId), l.productId), {
      stock: increment(-l.quantity),
      lastMovementId: movementRef.id,
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
  batch.set(movementRef, {
    type: "annulation",
    productIds: sale.lines.map((l) => l.productId),
    deltas: Object.fromEntries(sale.lines.map((l) => [l.productId, l.quantity])),
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
  for (const l of sale.lines) {
    batch.update(doc(productsCol(actor.boutiqueId), l.productId), {
      stock: increment(l.quantity),
      lastMovementId: movementRef.id,
      updatedAt: serverTimestamp(),
      updatedBy: actor.uid,
    });
  }
  track(batch.commit(), (e) =>
    notifications.show({ color: "red", title: "Annulation refusée par le serveur", message: errorMessage(e), autoClose: false }),
  );
}

/* ---------- Panier (gardé sur l'appareil : il survit à un rechargement de la page) ---------- */

interface Cart {
  lines: CartLine[];
  discountPercent: number;
  totals: Totals;
  add: (product: Product, qty?: number) => void;
  setQty: (productId: string, qty: number) => void;
  setDiscountPercent: (p: number) => void;
  clear: () => void;
}

const CartContext = createContext<Cart | null>(null);

interface Stored {
  lines: CartLine[];
  discountPercent: number;
}

function load(key: string): Stored {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const v = JSON.parse(raw) as Stored;
      if (Array.isArray(v.lines)) return { lines: v.lines, discountPercent: clampPercent(Number(v.discountPercent)) };
    }
  } catch {
    // Stockage indisponible (navigation privée…) : panier vide.
  }
  return { lines: [], discountPercent: 0 };
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

  const add = useCallback((p: Product, qty = 1) => {
    setState((s) => ({
      ...s,
      lines: addToCart(s.lines, { productId: p.id, name: p.name, unit: p.unit, unitPrice: p.sellPrice }, qty),
    }));
  }, []);
  const setQty = useCallback((productId: string, qty: number) => {
    setState((s) => ({ ...s, lines: setQuantity(s.lines, productId, qty) }));
  }, []);
  const setDiscountPercent = useCallback((p: number) => setState((s) => ({ ...s, discountPercent: clampPercent(p) })), []);
  const clear = useCallback(() => setState({ lines: [], discountPercent: 0 }), []);

  const value = useMemo<Cart>(
    () => ({
      ...state,
      totals: computeTotals(state.lines, state.discountPercent, boutique.currency),
      add,
      setQty,
      setDiscountPercent,
      clear,
    }),
    [state, boutique.currency, add, setQty, setDiscountPercent, clear],
  );
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): Cart {
  const c = useContext(CartContext);
  if (!c) throw new Error("useCart en dehors de CartProvider");
  return c;
}
