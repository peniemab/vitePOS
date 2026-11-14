/**
 * Résumés par jour (logique pure) : ce que les rapports et le graphique de l'accueil ont besoin de savoir
 * d'une journée, sans relire chaque vente. Une vente validée y ajoute sa part, son annulation la retire.
 * Les montants suivent les mêmes règles que `buildReport` : remise globale répartie sur les lignes au prorata,
 * quantités à l'unité (un paquet de 24 compte pour 24).
 */
import { ACOMPTE_ID } from "./deposits";
import { stockUnits } from "./cart";
import type { Sale } from "./sales";

export interface DayProduct {
  /** Nom de l'article au moment de la vente. */
  n: string;
  /** Quantité vendue, à l'unité. */
  q: number;
  /** Chiffre d'affaires, remise comprise. */
  r: number;
}

export interface DayTotals {
  /** « AAAA-MM-JJ ». */
  day: string;
  revenue: number;
  count: number;
  discounts: number;
  cash: number;
  mobileMoney: number;
  products: Record<string, DayProduct>;
  /** Chiffre d'affaires (`r`) et nombre de ventes (`c`) de chaque employé, pour l'accueil d'un vendeur. */
  members: Record<string, { r: number; c: number }>;
}

export function emptyDay(day: string): DayTotals {
  return { day, revenue: 0, count: 0, discounts: 0, cash: 0, mobileMoney: 0, products: {}, members: {} };
}

/** Part d'une vente dans le résumé de son jour (qu'elle soit validée ou non : c'est à l'appelant de choisir). */
export function saleShare(s: Pick<Sale, "uid" | "dayKey" | "lines" | "subtotal" | "total" | "discount" | "payment">): DayTotals {
  const d = emptyDay(s.dayKey);
  d.revenue = s.total;
  d.count = 1;
  d.discounts = s.discount;
  if (s.payment.method === "especes") d.cash = s.total;
  else d.mobileMoney = s.total;
  d.members[s.uid] = { r: s.total, c: 1 };
  const ratio = s.subtotal > 0 ? s.total / s.subtotal : 0;
  for (const l of s.lines) {
    // Avances de dépôts : un seul article, sans le numéro du dépôt ; la reprise au retrait (ligne négative) l'annule.
    const p = d.products[l.productId] ?? { n: l.productId === ACOMPTE_ID ? "Avances sur dépôts" : l.name, q: 0, r: 0 };
    p.q += l.lineTotal < 0 ? -stockUnits(l) : stockUnits(l);
    p.r += l.lineTotal * ratio;
    d.products[l.productId] = p;
  }
  return d;
}

/** Ajoute `b` à `a` (modifie `a`). */
export function addDay(a: DayTotals, b: DayTotals): DayTotals {
  a.revenue += b.revenue;
  a.count += b.count;
  a.discounts += b.discounts;
  a.cash += b.cash;
  a.mobileMoney += b.mobileMoney;
  for (const [id, p] of Object.entries(b.products)) {
    const cur = a.products[id] ?? { n: p.n, q: 0, r: 0 };
    cur.q += p.q;
    cur.r += p.r;
    a.products[id] = cur;
  }
  for (const [uid, m] of Object.entries(b.members)) {
    const cur = a.members[uid] ?? { r: 0, c: 0 };
    cur.r += m.r;
    cur.c += m.c;
    a.members[uid] = cur;
  }
  return a;
}

/** Résumés jour par jour des ventes validées (pour les jours d'avant les résumés enregistrés). */
export function daysFromSales(sales: Sale[]): DayTotals[] {
  const out = new Map<string, DayTotals>();
  for (const s of sales) {
    if (s.status !== "validee") continue;
    addDay(out.get(s.dayKey) ?? out.set(s.dayKey, emptyDay(s.dayKey)).get(s.dayKey)!, saleShare(s));
  }
  return [...out.values()];
}

function num(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

function obj(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : {};
}

/** Lit un résumé tel qu'enregistré (champs absents ou abîmés = 0). */
export function readDay(day: string, data: unknown): DayTotals {
  const d = obj(data);
  const out = emptyDay(day);
  out.revenue = num(d.revenue);
  out.count = num(d.count);
  out.discounts = num(d.discounts);
  out.cash = num(d.cash);
  out.mobileMoney = num(d.mobileMoney);
  for (const [id, v] of Object.entries(obj(d.products))) {
    const p = obj(v);
    out.products[id] = { n: String(p.n ?? ""), q: num(p.q), r: num(p.r) };
  }
  for (const [uid, v] of Object.entries(obj(d.members))) {
    const m = obj(v);
    out.members[uid] = { r: num(m.r), c: num(m.c) };
  }
  return out;
}
