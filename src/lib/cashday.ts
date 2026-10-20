/** Dépenses et journée de caisse : résumé du jour, argent attendu, écart à la clôture (logique pure). */
import { CURRENCY_LIST, formatMoneyByCurrency, roundMoney, zeroMoney, type Currency, type MoneyByCurrency } from "./fx";
import type { Sale } from "./sales";

export type ExpenseCategory = "transport" | "fournitures" | "loyer" | "communication" | "salaires" | "autres";

export const EXPENSE_CATEGORIES: Record<ExpenseCategory, string> = {
  transport: "Transport",
  fournitures: "Fournitures",
  loyer: "Loyer",
  communication: "Communication (unités)",
  salaires: "Salaires",
  autres: "Autres",
};

export function isExpenseCategory(v: unknown): v is ExpenseCategory {
  return typeof v === "string" && v in EXPENSE_CATEGORIES;
}

export interface Expense {
  id: string;
  amount: number;
  currency: Currency;
  category: ExpenseCategory;
  description: string;
  /** Payée avec l'argent de la caisse (sinon : par le patron, hors caisse). */
  fromTill: boolean;
  status: "validee" | "annulee";
  memberName: string;
  dayKey: string;
  createdAtMs: number;
}

/** Un montant par devise (FC, $, €). */
export type Money2 = MoneyByCurrency;

const zero = (): Money2 => zeroMoney();

export interface DaySummary {
  salesCount: number;
  cancelledCount: number;
  /** Chiffre d'affaires dans la devise des prix de la boutique. */
  revenue: number;
  discounts: number;
  /** Espèces encaissées par devise (montant dû, la monnaie rendue est déjà déduite). */
  cash: Money2;
  /** Mobile money, dans la devise où il a été payé. */
  mobileMoney: Money2;
  /** Dépenses payées avec l'argent de la caisse. */
  tillExpenses: Money2;
  /** Toutes les dépenses du jour (caisse et hors caisse). */
  allExpenses: Money2;
  /** Ventes par vendeur, dans la devise des prix. */
  bySeller: { name: string; count: number; revenue: number }[];
}

export function summarizeDay(sales: Sale[], expenses: Expense[], priceCurrency: Currency): DaySummary {
  const s: DaySummary = {
    salesCount: 0,
    cancelledCount: 0,
    revenue: 0,
    discounts: 0,
    cash: zero(),
    mobileMoney: zero(),
    tillExpenses: zero(),
    allExpenses: zero(),
    bySeller: [],
  };
  const sellers = new Map<string, { name: string; count: number; revenue: number }>();

  for (const sale of sales) {
    if (sale.status === "annulee") {
      s.cancelledCount++;
      continue;
    }
    s.salesCount++;
    s.revenue += sale.total;
    s.discounts += sale.discount;
    const p = sale.payment;
    if (p.method === "especes") s.cash[p.currency] += p.due;
    else s.mobileMoney[p.currency] += p.due;
    const seller = sellers.get(sale.uid) ?? { name: sale.memberName, count: 0, revenue: 0 };
    seller.count++;
    seller.revenue += sale.total;
    sellers.set(sale.uid, seller);
  }
  for (const e of expenses) {
    if (e.status === "annulee") continue;
    s.allExpenses[e.currency] += e.amount;
    if (e.fromTill) s.tillExpenses[e.currency] += e.amount;
  }

  const round = (m: Money2): Money2 => perCurrency((c) => roundMoney(m[c], c));
  s.revenue = roundMoney(s.revenue, priceCurrency);
  s.discounts = roundMoney(s.discounts, priceCurrency);
  s.cash = round(s.cash);
  s.mobileMoney = round(s.mobileMoney);
  s.tillExpenses = round(s.tillExpenses);
  s.allExpenses = round(s.allExpenses);
  s.bySeller = [...sellers.values()]
    .map((v) => ({ ...v, revenue: roundMoney(v.revenue, priceCurrency) }))
    .sort((a, b) => b.revenue - a.revenue);
  return s;
}

function perCurrency(f: (c: Currency) => number): Money2 {
  const m = zeroMoney();
  for (const c of CURRENCY_LIST) m[c] = f(c);
  return m;
}

/** Argent qui devrait être dans le tiroir : fond de caisse + espèces encaissées − dépenses payées en caisse. */
export function expectedCash(summary: DaySummary, openingFloat: Money2): Money2 {
  return perCurrency((c) => roundMoney((openingFloat[c] ?? 0) + summary.cash[c] - summary.tillExpenses[c], c));
}

/** Écart compté − attendu : positif = surplus, négatif = manquant. */
export function variance(counted: Money2, expected: Money2): Money2 {
  return perCurrency((c) => roundMoney((counted[c] ?? 0) - (expected[c] ?? 0), c));
}

/** « 12 500 FC + 5,00 $ », seulement les devises non nulles ; « — » si tout est à zéro. */
export const formatMoney2 = formatMoneyByCurrency;

/** Décale un jour « AAAA-MM-JJ » de `delta` jours. */
export function shiftDay(day: string, delta: number): string {
  const [y, m, d] = day.split("-").map(Number);
  const date = new Date(y, m - 1, d + delta);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** « samedi 11 octobre 2026 ». */
export function formatDay(day: string): string {
  const [y, m, d] = day.split("-").map(Number);
  return new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date(y, m - 1, d));
}
