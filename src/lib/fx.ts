/**
 * Devises : franc congolais (CDF), dollar (USD) et euro (EUR).
 * Les taux du jour disent combien de FC valent 1 $ et 1 € ; toute conversion passe par le franc.
 */

export type Currency = "CDF" | "USD" | "EUR";

export const CURRENCY_LIST: Currency[] = ["CDF", "USD", "EUR"];

export const CURRENCIES: Record<Currency, { label: string; short: string; symbol: string; decimals: number }> = {
  CDF: { label: "Franc congolais", short: "Francs", symbol: "FC", decimals: 0 },
  USD: { label: "Dollar américain", short: "Dollars", symbol: "$", decimals: 2 },
  EUR: { label: "Euro", short: "Euros", symbol: "€", decimals: 2 },
};

/** Taux du jour : combien de FC pour 1 $ et pour 1 € (0 = pas encore saisi). */
export interface Rates {
  USD: number;
  EUR: number;
}

/** Montant dans chaque devise (argent du tiroir, dépenses, écarts…). */
export type MoneyByCurrency = Record<Currency, number>;

export function zeroMoney(): MoneyByCurrency {
  return { CDF: 0, USD: 0, EUR: 0 };
}

export function isCurrency(v: unknown): v is Currency {
  return v === "CDF" || v === "USD" || v === "EUR";
}

export function isValidRate(rate?: number | null): rate is number {
  return typeof rate === "number" && Number.isFinite(rate) && rate > 0;
}

/** Le taux nécessaire pour cette devise est-il connu ? (le franc n'en a pas besoin) */
export function hasRate(rates: Rates, c: Currency): boolean {
  return c === "CDF" || isValidRate(rates[c]);
}

/** Arrondi selon la devise : FC sans décimales, $ et € au centime. */
export function roundMoney(n: number, currency: Currency): number {
  const f = 10 ** CURRENCIES[currency].decimals;
  return Math.round((n + Number.EPSILON) * f) / f;
}

/**
 * Convertit un montant au taux du jour, en passant par le franc.
 * Renvoie 0 si un taux nécessaire manque (à vérifier avec `hasRate` avant d'encaisser).
 */
export function convert(amount: number, from: Currency, to: Currency, rates: Rates): number {
  if (from === to) return roundMoney(amount, to);
  if (!hasRate(rates, from) || !hasRate(rates, to)) return 0;
  const cdf = from === "CDF" ? amount : amount * rates[from];
  return roundMoney(to === "CDF" ? cdf : cdf / rates[to], to);
}

/** « 12 500 FC », « 4,50 $ », « 3,20 € » : espace pour les milliers, virgule décimale. */
export function formatMoney(n: number, currency: Currency): string {
  const { decimals, symbol } = CURRENCIES[currency];
  const s = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
    .format(roundMoney(n, currency))
    .replace(/[  ]/g, " ");
  return `${s} ${symbol}`;
}

/** « 12 500 FC + 5,00 $ », seulement les devises non nulles ; « — » si tout est à zéro. */
export function formatMoneyByCurrency(m: MoneyByCurrency): string {
  const parts = CURRENCY_LIST.filter((c) => m[c]).map((c) => formatMoney(m[c], c));
  return parts.join(" + ") || "—";
}

/** Billets courants, pour les boutons « montant reçu » de la caisse. */
export const BILLS: Record<Currency, number[]> = {
  CDF: [500, 1000, 5000, 10000, 20000, 50000],
  USD: [1, 5, 10, 20, 50, 100],
  EUR: [5, 10, 20, 50, 100],
};
