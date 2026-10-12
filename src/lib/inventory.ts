/** Inventaire : écarts entre le stock compté et le stock enregistré (logique pure). */
import { roundQuantity, type Unit } from "./products";

export interface CountLine {
  productId: string;
  name: string;
  unit: Unit;
  /** Stock enregistré au moment où l'article a été compté. */
  theoretical: number;
  counted: number;
}

export interface InventoryGap {
  productId: string;
  name: string;
  unit: Unit;
  delta: number;
  /** Valeur de l'écart au prix de vente (négative = perte). */
  value: number;
}

/**
 * Écarts à appliquer : compté − enregistré au moment du comptage. Appliqués par increment,
 * ils restent justes même si des ventes ont eu lieu entre le comptage et la validation.
 */
export function inventoryGaps(lines: CountLine[], sellPrices: Map<string, number>): InventoryGap[] {
  return lines
    .map((l) => {
      const delta = roundQuantity(l.counted - l.theoretical, l.unit);
      return { productId: l.productId, name: l.name, unit: l.unit, delta, value: delta * (sellPrices.get(l.productId) ?? 0) };
    })
    .filter((g) => g.delta !== 0)
    .sort((a, b) => a.value - b.value);
}

export function gapTotals(gaps: InventoryGap[]): { missingValue: number; surplusValue: number; lines: number } {
  let missingValue = 0;
  let surplusValue = 0;
  for (const g of gaps) {
    if (g.value < 0) missingValue += -g.value;
    else surplusValue += g.value;
  }
  return { missingValue, surplusValue, lines: gaps.length };
}
