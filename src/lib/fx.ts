/** Helpers devise RDC : Franc congolais (CDF) + Dollar (USD) */

/** Taux = combien de FC pour 1 USD (ex. 2850) */
export function cdfToUsd(cdf: number, rateCdfPerUsd: number): number {
  if (!rateCdfPerUsd || rateCdfPerUsd <= 0) return 0
  return cdf / rateCdfPerUsd
}

export function usdToCdf(usd: number, rateCdfPerUsd: number): number {
  if (!rateCdfPerUsd || rateCdfPerUsd <= 0) return 0
  return usd * rateCdfPerUsd
}

/** Arrondi FC (souvent sans décimales) */
export function roundCdf(n: number) {
  return Math.round(n)
}

/** Arrondi USD à 2 décimales */
export function roundUsd(n: number) {
  return Math.round(n * 100) / 100
}

export function hasValidUsdRate(rate?: number | null) {
  return typeof rate === 'number' && rate > 0
}

export const USD_BILLS = [1, 5, 10, 20, 50, 100]
export const CDF_BILLS = [500, 1000, 5000, 10000, 20000, 50000]
