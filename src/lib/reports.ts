/** Rapports sur une période : chiffre d'affaires, panier moyen, marge, meilleurs produits (logique pure). */
import { roundMoney, type Currency } from "./fx";
import { shiftDay } from "./cashday";
import type { Sale } from "./sales";
import { stockUnits, type PaymentMethod } from "./cart";

export type PeriodKind = "jour" | "semaine" | "mois";

export interface Period {
  kind: PeriodKind;
  start: string;
  end: string;
  /** Chaque jour de la période, dans l'ordre. */
  days: string[];
}

function parse(day: string): Date {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** La période qui contient `day` : le jour, la semaine (lundi → dimanche) ou le mois. */
export function periodOf(kind: PeriodKind, day: string): Period {
  let start = day;
  let end = day;
  if (kind === "semaine") {
    const dow = (parse(day).getDay() + 6) % 7; // lundi = 0
    start = shiftDay(day, -dow);
    end = shiftDay(start, 6);
  } else if (kind === "mois") {
    start = `${day.slice(0, 8)}01`;
    const d = parse(start);
    end = shiftDay(start, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate() - 1);
  }
  const days: string[] = [];
  for (let d = start; d <= end; d = shiftDay(d, 1)) days.push(d);
  return { kind, start, end, days };
}

/** Les `n` derniers jours jusqu'à `day` compris (graphique de l'accueil). */
export function lastDays(day: string, n: number): Period {
  const days: string[] = [];
  for (let i = n - 1; i >= 0; i--) days.push(shiftDay(day, -i));
  return { kind: n <= 7 ? "semaine" : "mois", start: days[0], end: day, days };
}

/** Période précédente ou suivante de même nature. */
export function shiftPeriod(p: Period, delta: -1 | 1): Period {
  if (p.kind === "mois") return periodOf("mois", delta < 0 ? shiftDay(p.start, -1) : shiftDay(p.end, 1));
  return periodOf(p.kind, shiftDay(p.start, delta * p.days.length));
}

export interface ProductStat {
  productId: string;
  name: string;
  quantity: number;
  revenue: number;
}

export interface Report {
  revenue: number;
  salesCount: number;
  averageBasket: number;
  discounts: number;
  /** Coût d'achat des articles vendus, au prix d'achat actuel ; `undefined` sans prix d'achat. */
  costOfGoods?: number;
  margin?: number;
  /** Part du chiffre d'affaires dont le prix d'achat est connu (0 à 1). */
  costCoverage: number;
  byDay: { day: string; revenue: number; count: number }[];
  topProducts: ProductStat[];
  payment: { cash: number; mobileMoney: number };
}

/**
 * Résume les ventes validées d'une période. Les remises globales sont réparties sur les lignes
 * au prorata, pour que la somme des produits égale le chiffre d'affaires.
 */
export function buildReport(sales: Sale[], period: Period, currency: Currency, costs?: Map<string, number>): Report {
  const valid = sales.filter((s) => s.status === "validee" && s.dayKey >= period.start && s.dayKey <= period.end);
  const byDay = new Map(period.days.map((d) => [d, { day: d, revenue: 0, count: 0 }]));
  const products = new Map<string, ProductStat>();
  let revenue = 0;
  let discounts = 0;
  let cash = 0;
  let mobileMoney = 0;
  let cost = 0;
  let costedRevenue = 0;

  for (const s of valid) {
    revenue += s.total;
    discounts += s.discount;
    if (s.payment.method === "especes") cash += s.total;
    else mobileMoney += s.total;
    const d = byDay.get(s.dayKey);
    if (d) {
      d.revenue += s.total;
      d.count++;
    }
    const ratio = s.subtotal > 0 ? s.total / s.subtotal : 0;
    for (const l of s.lines) {
      const lineRevenue = l.lineTotal * ratio;
      const p = products.get(l.productId) ?? { productId: l.productId, name: l.name, quantity: 0, revenue: 0 };
      // Quantités et coûts toujours à l'unité : un paquet de 24 compte pour 24.
      p.quantity += stockUnits(l);
      p.revenue += lineRevenue;
      products.set(l.productId, p);
      const unitCost = costs?.get(l.productId);
      if (unitCost != null) {
        cost += unitCost * stockUnits(l);
        costedRevenue += lineRevenue;
      }
    }
  }

  const r = (n: number) => roundMoney(n, currency);
  const hasCosts = !!costs && costedRevenue > 0;
  return {
    revenue: r(revenue),
    salesCount: valid.length,
    averageBasket: valid.length ? r(revenue / valid.length) : 0,
    discounts: r(discounts),
    costOfGoods: hasCosts ? r(cost) : undefined,
    margin: hasCosts ? r(costedRevenue - cost) : undefined,
    costCoverage: revenue > 0 ? Math.min(1, costedRevenue / revenue) : 0,
    byDay: [...byDay.values()].map((d) => ({ ...d, revenue: r(d.revenue) })),
    topProducts: [...products.values()]
      .map((p) => ({ ...p, revenue: r(p.revenue), quantity: Math.round(p.quantity * 1000) / 1000 }))
      .sort((a, b) => b.revenue - a.revenue),
    payment: { cash: r(cash), mobileMoney: r(mobileMoney) },
  };
}

/** Variation en % entre deux valeurs, arrondie ; `undefined` si la référence est nulle. */
export function changePercent(current: number, previous: number): number | undefined {
  if (!previous) return undefined;
  return Math.round(((current - previous) / previous) * 100);
}

/** Montant court pour les graphiques : 780 000 → « 780 k », 1 250 000 → « 1,3 M », 22 → « 22 ». */
export function compactAmount(n: number): string {
  const abs = Math.abs(n);
  const fmt = (v: number, d: number) => v.toLocaleString("fr-FR", { maximumFractionDigits: d }).replace(/[\u202f\u00a0]/g, " ");
  if (abs >= 1_000_000) return `${fmt(n / 1_000_000, 1)} M`;
  if (abs >= 1000) return `${fmt(Math.round(n / 1000), 0)} k`;
  return fmt(n, 2);
}

export interface PaymentSlice {
  method: PaymentMethod;
  /** Devise dans laquelle le client a payé. */
  currency: Currency;
  /** Montant encaissé dans cette devise. */
  amount: number;
  /** Valeur dans la devise des prix, pour comparer les parts entre elles. */
  value: number;
}

/** Ventes validées réparties par moyen de paiement et devise payée, de la plus grosse part à la plus petite. */
export function paymentBreakdown(sales: Pick<Sale, "status" | "total" | "payment">[]): PaymentSlice[] {
  const out = new Map<string, PaymentSlice>();
  for (const s of sales) {
    if (s.status !== "validee") continue;
    const key = `${s.payment.method}-${s.payment.currency}`;
    const slice = out.get(key) ?? { method: s.payment.method, currency: s.payment.currency, amount: 0, value: 0 };
    slice.amount = roundMoney(slice.amount + s.payment.due, s.payment.currency);
    slice.value += s.total;
    out.set(key, slice);
  }
  return [...out.values()].sort((a, b) => b.value - a.value);
}
