import { describe, expect, it } from "vitest";
import {
  collectCategories,
  findByBarcode,
  matchProduct,
  needsRestock,
  roundQuantity,
  signedDelta,
  sortForCheckout,
  stockLevel,
  validateProduct,
  type ProductInput,
} from "./products";

const base: ProductInput = {
  name: "Riz 1kg",
  category: "Alimentation",
  sellPrice: 700,
  unit: "u",
  alertThreshold: 5,
  barcode: "",
  favorite: false,
};

describe("mouvements", () => {
  it("donne le bon signe selon le type", () => {
    expect(signedDelta("reappro", -10, "u")).toBe(10);
    expect(signedDelta("casse", 3, "u")).toBe(-3);
    expect(signedDelta("don", -2, "u")).toBe(-2);
    expect(signedDelta("correction", -4, "u")).toBe(-4);
    expect(signedDelta("correction", 4, "u")).toBe(4);
  });

  it("arrondit les pièces à l'unité et le vrac au millième", () => {
    expect(roundQuantity(2.6, "u")).toBe(3);
    expect(roundQuantity(1.23456, "kg")).toBe(1.235);
    expect(signedDelta("reappro", 0.5, "L")).toBe(0.5);
  });
});

describe("alertes de stock", () => {
  it("distingue rupture, stock bas et normal", () => {
    expect(stockLevel({ stock: 0, alertThreshold: 5 })).toBe("empty");
    expect(stockLevel({ stock: -2, alertThreshold: 5 })).toBe("empty");
    expect(stockLevel({ stock: 5, alertThreshold: 5 })).toBe("low");
    expect(stockLevel({ stock: 6, alertThreshold: 5 })).toBe("ok");
  });

  it("ignore les produits archivés", () => {
    expect(needsRestock({ stock: 0, alertThreshold: 5, archived: true })).toBe(false);
    expect(needsRestock({ stock: 0, alertThreshold: 5, archived: false })).toBe(true);
  });
});

describe("recherche", () => {
  const p = { name: "Lait concentré", category: "Épicerie", barcode: "6001234" };

  it("ignore accents et majuscules, cherche tous les mots", () => {
    expect(matchProduct(p, "lait concentre")).toBe(true);
    expect(matchProduct(p, "EPICERIE lait")).toBe(true);
    expect(matchProduct(p, "6001")).toBe(true);
    expect(matchProduct(p, "lait sucre")).toBe(false);
    expect(matchProduct(p, "  ")).toBe(true);
  });

  it("trouve un code-barres exact, hors archives", () => {
    const list = [
      { id: "a", barcode: "123", archived: true },
      { id: "b", barcode: "123", archived: false },
    ];
    expect(findByBarcode(list, " 123 ")?.id).toBe("b");
    expect(findByBarcode(list, "12")).toBeUndefined();
  });

  it("liste les catégories actives triées", () => {
    expect(
      collectCategories([
        { category: "Boissons", archived: false },
        { category: "Alimentation", archived: false },
        { category: "Vieux", archived: true },
        { category: "Boissons", archived: false },
      ]),
    ).toEqual(["Alimentation", "Boissons"]);
  });

  it("met les favoris devant et les ruptures à la fin à la caisse", () => {
    const sorted = sortForCheckout([
      { name: "B", favorite: false, stock: 0 },
      { name: "C", favorite: false, stock: 3 },
      { name: "A", favorite: true, stock: 1 },
    ]);
    expect(sorted.map((p) => p.name)).toEqual(["A", "C", "B"]);
  });
});

describe("validation", () => {
  it("nettoie la fiche", () => {
    const r = validateProduct({ ...base, name: "  Riz  ", category: " ", barcode: " 123 " });
    expect(r).toEqual({ value: { ...base, name: "Riz", category: "Divers", barcode: "123" } });
  });

  it("refuse un nom vide ou un prix négatif", () => {
    expect(validateProduct({ ...base, name: " " })).toHaveProperty("error");
    expect(validateProduct({ ...base, sellPrice: -1 })).toHaveProperty("error");
    expect(validateProduct({ ...base, sellPrice: Number.NaN })).toHaveProperty("error");
  });
});
