/** Rapports sur une période : chiffre d'affaires, panier moyen, marge, meilleurs produits (logique pure). */
import { roundMoney, type Currency } from "./fx";
import { shiftDay } from "./cashday";
import type { Sale } from "./sales";
import type { PaymentMethod } from "./cart";
import { addDay, daysFromSales, emptyDay, type DayTotals } from "./dayStats";

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
  return reportFromDays(daysFromSales(sales), period, currency, costs);
}

/**
 * Même résumé à partir des résumés par jour. Avec `uid`, seulement les ventes de cet employé
 * (chiffre d'affaires et nombre de ventes : de quoi tracer son graphique, pas plus).
 */
export function reportFromDays(days: DayTotals[], period: Period, currency: Currency, costs?: Map<string, number>, uid?: string): Report {
  const total = emptyDay(period.start);
  const byDay = new Map(period.days.map((d) => [d, { day: d, revenue: 0, count: 0 }]));
  for (const d of days) {
    if (d.day < period.start || d.day > period.end) continue;
    const mine = uid ? { ...emptyDay(d.day), revenue: d.members[uid]?.r ?? 0, count: d.members[uid]?.c ?? 0 } : d;
    addDay(total, mine);
    const slot = byDay.get(d.day);
    if (slot) {
      slot.revenue += mine.revenue;
      slot.count += mine.count;
    }
  }

  const r = (n: number) => roundMoney(n, currency);
  const qty = (n: number) => Math.round(n * 1000) / 1000;
  let cost = 0;
  let costedRevenue = 0;
  for (const [id, p] of Object.entries(total.products)) {
    const unitCost = costs?.get(id);
    if (unitCost != null) {
      cost += unitCost * p.q;
      costedRevenue += p.r;
    }
  }
  const revenue = total.revenue;
  const count = Math.round(total.count);
  const hasCosts = !!costs && costedRevenue > 0;
  return {
    revenue: r(revenue),
    salesCount: count,
    averageBasket: count ? r(revenue / count) : 0,
    discounts: r(total.discounts),
    costOfGoods: hasCosts ? r(cost) : undefined,
    margin: hasCosts ? r(costedRevenue - cost) : undefined,
    costCoverage: revenue > 0 ? Math.min(1, costedRevenue / revenue) : 0,
    byDay: [...byDay.values()].map((d) => ({ ...d, revenue: r(d.revenue), count: Math.round(d.count) })),
    topProducts: Object.entries(total.products)
      .map(([productId, p]) => ({ productId, name: p.n, revenue: r(p.r), quantity: qty(p.q) }))
      // Une vente annulée laisse ses articles à zéro dans le résumé du jour : on ne les montre pas.
      .filter((p) => p.quantity > 0 || p.revenue > 0)
      .sort((a, b) => b.revenue - a.revenue),
    payment: { cash: r(total.cash), mobileMoney: r(total.mobileMoney) },
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
