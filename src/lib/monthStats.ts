/**
 * Compteurs mensuels (logique pure) : ventes et dépenses de chaque mois, tenues à jour à chaque vente,
 * annulation et dépense, pour le graphique « Ventes et dépenses, six derniers mois » des rapports.
 * Les montants sont gardés par devise ; on les convertit au taux du jour seulement pour l'affichage.
 */
import { convert, CURRENCY_LIST, hasRate, roundMoney, zeroMoney, type Currency, type MoneyByCurrency, type Rates } from "./fx";

export interface MonthTotals {
  /** « AAAA-MM ». */
  key: string;
  /** Mois abrégé : « oct. ». */
  label: string;
  sales: MoneyByCurrency;
  saleCount: number;
  expenses: MoneyByCurrency;
}

/** Mois d'un jour « AAAA-MM-JJ ». */
export function monthOf(day: string): string {
  return day.slice(0, 7);
}

/** Les `n` derniers mois jusqu'au mois de `today` compris, du plus ancien au plus récent. */
export function lastMonths(today: string, n = 6): { key: string; label: string }[] {
  const y = Number(today.slice(0, 4));
  const m = Number(today.slice(5, 7)) - 1;
  const fmt = new Intl.DateTimeFormat("fr-FR", { month: "short" });
  const out: { key: string; label: string }[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(y, m - i, 1);
    out.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, label: fmt.format(d) });
  }
  return out;
}

/** Lit un compteur tel qu'enregistré (champs absents ou abîmés = 0). */
export function readMoney(v: unknown): MoneyByCurrency {
  const out = zeroMoney();
  if (v && typeof v === "object") {
    for (const c of CURRENCY_LIST) {
      const n = (v as Record<string, unknown>)[c];
      if (typeof n === "number" && Number.isFinite(n)) out[c] = n;
    }
  }
  return out;
}

/**
 * Total dans la devise principale, au taux du jour. Une devise sans taux connu est laissée de côté :
 * `missing` la signale pour l'afficher.
 */
export function toMain(m: MoneyByCurrency, main: Currency, rates: Rates): { total: number; missing: Currency[] } {
  let total = 0;
  const missing: Currency[] = [];
  for (const c of CURRENCY_LIST) {
    if (!m[c]) continue;
    if (c !== main && (!hasRate(rates, c) || !hasRate(rates, main))) {
      missing.push(c);
      continue;
    }
    total += c === main ? m[c] : convert(m[c], c, main, rates);
  }
  return { total: roundMoney(total, main), missing };
}
