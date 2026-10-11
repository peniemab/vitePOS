/** Devises RDC : franc congolais (CDF) et dollar (USD). Le taux = combien de FC pour 1 USD. */

export type Currency = "CDF" | "USD";

export const CURRENCIES: Record<Currency, { label: string; symbol: string; decimals: number }> = {
  CDF: { label: "Franc congolais", symbol: "FC", decimals: 0 },
  USD: { label: "Dollar américain", symbol: "$", decimals: 2 },
};

export function isCurrency(v: unknown): v is Currency {
  return v === "CDF" || v === "USD";
}

export function hasValidUsdRate(rate?: number | null): rate is number {
  return typeof rate === "number" && Number.isFinite(rate) && rate > 0;
}

/** Arrondi selon la devise : FC sans décimales, USD au centime. */
export function roundMoney(n: number, currency: Currency): number {
  const f = 10 ** CURRENCIES[currency].decimals;
  return Math.round((n + Number.EPSILON) * f) / f;
}

export function cdfToUsd(cdf: number, rate: number): number {
  return hasValidUsdRate(rate) ? roundMoney(cdf / rate, "USD") : 0;
}

export function usdToCdf(usd: number, rate: number): number {
  return hasValidUsdRate(rate) ? roundMoney(usd * rate, "CDF") : 0;
}

/** Convertit un montant d'une devise vers une autre au taux du jour. */
export function convert(amount: number, from: Currency, to: Currency, rate: number): number {
  if (from === to) return roundMoney(amount, to);
  return from === "USD" ? usdToCdf(amount, rate) : cdfToUsd(amount, rate);
}

/** « 12 500 FC », « 4,50 $ » : espace pour les milliers, virgule décimale. */
export function formatMoney(n: number, currency: Currency): string {
  const { decimals, symbol } = CURRENCIES[currency];
  const s = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
    .format(roundMoney(n, currency))
    .replace(/[  ]/g, " ");
  return `${s} ${symbol}`;
}

export const USD_BILLS = [1, 5, 10, 20, 50, 100];
export const CDF_BILLS = [500, 1000, 5000, 10000, 20000, 50000];
