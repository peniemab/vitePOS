/** Panier et encaissement : totaux, remise, conversion FC/USD, rendu monnaie (logique pure). */
import { BILLS, convert, CURRENCIES, hasRate, roundMoney, type Currency, type Rates } from "./fx";
import { roundQuantity, type Unit } from "./products";

export interface CartLine {
  productId: string;
  name: string;
  unit: Unit;
  /** Prix d'une unité vendue : la bouteille, ou le paquet entier si la ligne est un emballage. */
  unitPrice: number;
  /** Nombre vendu : bouteilles, ou paquets si la ligne est un emballage. */
  quantity: number;
  /** Emballage vendu (« Paquet ») ; absent pour la vente à l'unité. */
  packId?: string;
  packName?: string;
  /** Unités du produit dans l'emballage (24) ; absent pour la vente à l'unité. */
  packUnits?: number;
  /** Numéro de série ou IMEI de l'appareil vendu (une ligne par appareil, quantité 1). */
  serial?: string;
  /** Garantie de l'appareil, en mois. */
  warrantyMonths?: number;
}

/** Une même bouteille peut être dans le panier à l'unité et en paquet : deux lignes distinctes. */
export function lineKey(l: Pick<CartLine, "productId" | "packId" | "serial">): string {
  if (l.serial) return `${l.productId}#${l.serial}`;
  return l.packId ? `${l.productId}:${l.packId}` : l.productId;
}

/** Ce que la ligne retire du stock, toujours à l'unité (2 paquets de 24 → 48). */
export function stockUnits(l: Pick<CartLine, "quantity" | "packUnits" | "unit">): number {
  return roundQuantity(l.quantity * (l.packUnits && l.packUnits > 0 ? l.packUnits : 1), l.unit);
}

/** Stock à retirer par produit pour tout le panier (unités et emballages additionnés). */
export function stockByProduct(lines: Pick<CartLine, "productId" | "quantity" | "packUnits" | "unit">[]): Map<string, number> {
  const out = new Map<string, number>();
  for (const l of lines) out.set(l.productId, roundQuantity((out.get(l.productId) ?? 0) + stockUnits(l), l.unit));
  return out;
}

export interface Totals {
  subtotal: number;
  discount: number;
  total: number;
  /** Nombre d'articles (les produits au poids comptent pour un). */
  itemCount: number;
}

export function lineTotal(line: CartLine, currency: Currency): number {
  return roundMoney(line.unitPrice * line.quantity, currency);
}

export function clampPercent(p: number): number {
  return Number.isFinite(p) ? Math.min(100, Math.max(0, p)) : 0;
}

export function computeTotals(lines: CartLine[], discountPercent: number, currency: Currency): Totals {
  const subtotal = roundMoney(
    lines.reduce((s, l) => s + lineTotal(l, currency), 0),
    currency,
  );
  const discount = roundMoney((subtotal * clampPercent(discountPercent)) / 100, currency);
  return {
    subtotal,
    discount,
    total: Math.max(0, roundMoney(subtotal - discount, currency)),
    itemCount: lines.reduce((n, l) => n + (l.unit === "u" || l.packId ? l.quantity : 1), 0),
  };
}

/** Ajoute un produit (ou un de ses emballages) au panier, ou augmente sa quantité s'il y est déjà. */
export function addToCart(lines: CartLine[], product: Omit<CartLine, "quantity">, qty = 1): CartLine[] {
  const key = lineKey(product);
  const existing = lines.find((l) => lineKey(l) === key);
  // Un appareil (IMEI) ne se vend qu'une fois : déjà dans le panier, rien ne change.
  if (existing && product.serial) return lines;
  if (existing) return setQuantity(lines, key, existing.quantity + qty);
  if (product.serial) return [...lines, { ...product, quantity: 1 }];
  return [...lines, { ...product, quantity: roundQuantity(qty, product.packId ? "u" : product.unit) }];
}

/** Change une quantité (ligne désignée par `lineKey`) ; à zéro (ou moins) la ligne disparaît. */
export function setQuantity(lines: CartLine[], key: string, qty: number): CartLine[] {
  return lines
    .map((l) => (lineKey(l) === key ? { ...l, quantity: l.serial ? Math.min(1, Math.trunc(qty)) : roundQuantity(qty, l.packId ? "u" : l.unit) } : l))
    .filter((l) => l.quantity > 0);
}

/* ---------- Encaissement ---------- */

export type PaymentMethod = "especes" | "mobile_money";

export interface PaymentInput {
  method: PaymentMethod;
  /** Devise dans laquelle le client paie. */
  payCurrency: Currency;
  /** Montant remis par le client, dans la devise de paiement (espèces seulement). */
  received: number;
}

export interface PaymentResult {
  /** Montant dû dans la devise de paiement. */
  due: number;
  change: number;
  missing: number;
  ok: boolean;
  /** Taux du jour appliqués si le client a payé dans une autre devise que celle des prix, sinon `null`. */
  rates: Rates | null;
}

/**
 * Calcule ce que le client doit dans la devise où il paie, et le rendu.
 * Le mobile money est toujours considéré comme payé au centime près.
 */
export function computePayment(total: number, priceCurrency: Currency, rates: Rates, p: PaymentInput): PaymentResult | { error: string } {
  const converted = p.payCurrency !== priceCurrency;
  for (const c of [priceCurrency, p.payCurrency]) {
    if (converted && !hasRate(rates, c))
      return { error: `Le taux du jour (${CURRENCIES[c].label.toLowerCase()}) n'est pas encore fixé. Le propriétaire le saisit dans les paramètres.` };
  }
  const due = convert(total, priceCurrency, p.payCurrency, rates);
  const used = converted ? { USD: rates.USD, EUR: rates.EUR } : null;
  if (p.method === "mobile_money") return { due, change: 0, missing: 0, ok: true, rates: used };
  const received = roundMoney(Math.max(0, p.received), p.payCurrency);
  const diff = roundMoney(received - due, p.payCurrency);
  return {
    due,
    change: Math.max(0, diff),
    missing: Math.max(0, -diff),
    ok: diff >= 0,
    rates: used,
  };
}

/** Billets proposés pour aller vite : ceux qui couvrent le montant dû, du plus petit au plus grand. */
export function suggestedBills(due: number, currency: Currency): number[] {
  const bills = BILLS[currency];
  const out = new Set<number>();
  for (const b of bills) {
    const rounded = Math.ceil(due / b) * b;
    if (rounded >= due && rounded > 0) out.add(rounded);
  }
  return [...out].sort((a, b) => a - b).slice(0, 4);
}

/** Numéro de ticket court, lisible au téléphone (« 7KQ2-M4 »), tiré de l'identifiant. */
export function ticketNumber(id: string): string {
  const s = id.replace(/[^a-zA-Z0-9]/g, "").slice(-6).toUpperCase();
  return `${s.slice(0, 4)}-${s.slice(4)}`;
}

/** Jour local « AAAA-MM-JJ », pour regrouper les ventes par journée. */
export function dayKey(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
