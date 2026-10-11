/** Panier et encaissement : totaux, remise, conversion FC/USD, rendu monnaie (logique pure). */
import { convert, hasValidUsdRate, roundMoney, type Currency } from "./fx";
import { roundQuantity, type Unit } from "./products";

export interface CartLine {
  productId: string;
  name: string;
  unit: Unit;
  unitPrice: number;
  quantity: number;
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
    itemCount: lines.reduce((n, l) => n + (l.unit === "u" ? l.quantity : 1), 0),
  };
}

/** Ajoute un produit au panier, ou augmente sa quantité s'il y est déjà. */
export function addToCart(lines: CartLine[], product: Omit<CartLine, "quantity">, qty = 1): CartLine[] {
  const existing = lines.find((l) => l.productId === product.productId);
  if (existing) return setQuantity(lines, product.productId, existing.quantity + qty);
  return [...lines, { ...product, quantity: roundQuantity(qty, product.unit) }];
}

/** Change une quantité ; à zéro (ou moins) la ligne disparaît. */
export function setQuantity(lines: CartLine[], productId: string, qty: number): CartLine[] {
  return lines
    .map((l) => (l.productId === productId ? { ...l, quantity: roundQuantity(qty, l.unit) } : l))
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
  /** Taux appliqué (FC pour 1 $) si une conversion a eu lieu, sinon 0. */
  rateUsed: number;
}

/**
 * Calcule ce que le client doit dans la devise où il paie, et le rendu.
 * Le mobile money est toujours considéré comme payé au centime près.
 */
export function computePayment(total: number, priceCurrency: Currency, rate: number, p: PaymentInput): PaymentResult | { error: string } {
  const converted = p.payCurrency !== priceCurrency;
  if (converted && !hasValidUsdRate(rate)) return { error: "Fixez d'abord le taux du dollar dans les paramètres." };
  const due = convert(total, priceCurrency, p.payCurrency, rate);
  const rateUsed = converted ? rate : 0;
  if (p.method === "mobile_money") return { due, change: 0, missing: 0, ok: true, rateUsed };
  const received = roundMoney(Math.max(0, p.received), p.payCurrency);
  const diff = roundMoney(received - due, p.payCurrency);
  return {
    due,
    change: Math.max(0, diff),
    missing: Math.max(0, -diff),
    ok: diff >= 0,
    rateUsed,
  };
}

/** Billets proposés pour aller vite : ceux qui couvrent le montant dû, du plus petit au plus grand. */
export function suggestedBills(due: number, currency: Currency): number[] {
  const bills = currency === "USD" ? [1, 5, 10, 20, 50, 100] : [500, 1000, 5000, 10000, 20000, 50000];
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
