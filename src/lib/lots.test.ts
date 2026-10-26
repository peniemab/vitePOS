import { describe, expect, it } from "vitest";
import { daysBetween, expiringLots, expiryLabel, isDay, lotsLeft, type Lot } from "./lots";

const lot = (id: string, quantity: number, expiry: string, receivedAtMs: number): Lot => ({ id, productId: "lait", quantity, expiry, receivedAtMs });

describe("lots et péremption", () => {
  const lots = [lot("a", 24, "2026-11-01", 1), lot("b", 24, "2026-12-15", 2), lot("c", 12, "2027-02-01", 3)];

  it("attribue le stock aux arrivages les plus récents (les anciens partent d'abord)", () => {
    expect(lotsLeft(lots, 30).map((l) => [l.id, l.left])).toEqual([
      ["b", 18],
      ["c", 12],
    ]);
    expect(lotsLeft(lots, 100).map((l) => l.left)).toEqual([24, 24, 12]);
    expect(lotsLeft(lots, 0)).toEqual([]);
  });

  it("compte les jours, même en changeant de mois", () => {
    expect(daysBetween("2026-10-17", "2026-11-01")).toBe(15);
    expect(daysBetween("2026-10-17", "2026-10-10")).toBe(-7);
  });

  it("liste les lots encore en rayon qui expirent bientôt, les plus urgents d'abord", () => {
    const products = [{ id: "lait", name: "Lait", stock: 60, tracksExpiry: true, archived: false }];
    const r = expiringLots(products, lots, "2026-10-17");
    expect(r.map((l) => [l.id, l.daysLeft, l.left])).toEqual([["a", 15, 24]]);
    // Produit non suivi ou archivé : rien.
    expect(expiringLots([{ ...products[0], tracksExpiry: false }], lots, "2026-10-17")).toEqual([]);
  });

  it("valide une date et la décrit", () => {
    expect(isDay("2026-11-01")).toBe(true);
    expect(isDay("01/11/2026")).toBe(false);
    expect(expiryLabel(-3)).toBe("Périmé depuis 3 j");
    expect(expiryLabel(0)).toBe("Périme aujourd'hui");
    expect(expiryLabel(12)).toBe("Dans 12 j");
  });
});
