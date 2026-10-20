import { describe, expect, it } from "vitest";
import {
  addToCart,
  computePayment,
  computeTotals,
  dayKey,
  lineKey,
  stockByProduct,
  stockUnits,
  setQuantity,
  suggestedBills,
  ticketNumber,
  type CartLine,
} from "./cart";

const riz: Omit<CartLine, "quantity"> = { productId: "riz", name: "Riz", unit: "u", unitPrice: 700 };
const sucre: Omit<CartLine, "quantity"> = { productId: "sucre", name: "Sucre", unit: "kg", unitPrice: 650 };

describe("panier", () => {
  it("ajoute puis cumule un même produit", () => {
    let lines = addToCart([], riz);
    lines = addToCart(lines, riz, 2);
    expect(lines).toEqual([{ ...riz, quantity: 3 }]);
  });

  it("retire la ligne à zéro", () => {
    const lines = addToCart([], riz, 2);
    expect(setQuantity(lines, "riz", 0)).toEqual([]);
  });

  it("arrondit les quantités selon l'unité", () => {
    expect(addToCart([], riz, 1.6)[0].quantity).toBe(2);
    expect(addToCart([], sucre, 0.3333)[0].quantity).toBe(0.333);
  });

  it("calcule sous-total, remise et nombre d'articles", () => {
    const lines = [
      { ...riz, quantity: 3 },
      { ...sucre, quantity: 1.5 },
    ];
    // 2100 + 975 = 3075, remise 10 % = 307,5 → 308 FC
    expect(computeTotals(lines, 10, "CDF")).toEqual({ subtotal: 3075, discount: 308, total: 2767, itemCount: 4 });
  });

  it("borne la remise entre 0 et 100 %", () => {
    const lines = [{ ...riz, quantity: 1 }];
    expect(computeTotals(lines, 150, "CDF").total).toBe(0);
    expect(computeTotals(lines, -5, "CDF").total).toBe(700);
  });
});

describe("encaissement", () => {
  it("rend la monnaie en FC", () => {
    expect(computePayment(2767, "CDF", { USD: 2850, EUR: 3100 }, { method: "especes", payCurrency: "CDF", received: 5000 })).toEqual({
      due: 2767,
      change: 2233,
      missing: 0,
      ok: true,
      rates: null,
    });
  });

  it("signale ce qui manque", () => {
    const r = computePayment(2767, "CDF", { USD: 2850, EUR: 3100 }, { method: "especes", payCurrency: "CDF", received: 2000 });
    expect(r).toMatchObject({ ok: false, missing: 767, change: 0 });
  });

  it("convertit quand le client paie en dollars", () => {
    // 14 250 FC au taux 2 850 = 5 $
    const r = computePayment(14250, "CDF", { USD: 2850, EUR: 3100 }, { method: "especes", payCurrency: "USD", received: 10 });
    expect(r).toEqual({ due: 5, change: 5, missing: 0, ok: true, rates: { USD: 2850, EUR: 3100 } });
  });

  it("convertit des prix en dollars payés en francs", () => {
    const r = computePayment(4.5, "USD", { USD: 2850, EUR: 3100 }, { method: "especes", payCurrency: "CDF", received: 13000 });
    expect(r).toMatchObject({ due: 12825, change: 175, rates: { USD: 2850, EUR: 3100 } });
  });

  it("exige un taux pour convertir", () => {
    expect(computePayment(1000, "CDF", { USD: 0, EUR: 0 }, { method: "especes", payCurrency: "USD", received: 5 })).toHaveProperty("error");
    expect(computePayment(1000, "CDF", { USD: 2850, EUR: 0 }, { method: "especes", payCurrency: "EUR", received: 5 })).toHaveProperty("error");
  });

  it("encaisse en euros avec la monnaie rendue en euros", () => {
    // 31 000 FC au taux de 3 100 FC pour 1 € = 10 €
    const r = computePayment(31000, "CDF", { USD: 2850, EUR: 3100 }, { method: "especes", payCurrency: "EUR", received: 20 });
    expect(r).toEqual({ due: 10, change: 10, missing: 0, ok: true, rates: { USD: 2850, EUR: 3100 } });
  });

  it("considère le mobile money comme payé", () => {
    expect(computePayment(2767, "CDF", { USD: 2850, EUR: 3100 }, { method: "mobile_money", payCurrency: "CDF", received: 0 })).toMatchObject({
      ok: true,
      change: 0,
    });
  });
});

describe("aides", () => {
  it("propose des billets qui couvrent le montant", () => {
    expect(suggestedBills(2767, "CDF")).toEqual([3000, 5000, 10000, 20000]);
    expect(suggestedBills(4.2, "USD")).toEqual([5, 10, 20, 50]);
    expect(suggestedBills(7.5, "EUR")).toEqual([10, 20, 50, 100]);
  });

  it("forme un numéro de ticket court", () => {
    expect(ticketNumber("aZ3kq9Xm4p")).toBe("Q9XM-4P");
  });

  it("donne le jour local", () => {
    expect(dayKey(new Date(2026, 0, 5, 23, 59).getTime())).toBe("2026-01-05");
  });
});

describe("emballages dans le panier", () => {
  const bouteille: Omit<CartLine, "quantity"> = { productId: "coca", name: "Coca", unit: "u", unitPrice: 1000 };
  const paquet: Omit<CartLine, "quantity"> = { ...bouteille, unitPrice: 22000, packId: "pq", packName: "Paquet", packUnits: 24 };

  it("la bouteille et le paquet sont deux lignes, le stock est compté à l'unité", () => {
    let lines = addToCart([], bouteille, 3);
    lines = addToCart(lines, paquet);
    lines = addToCart(lines, paquet);
    expect(lines).toHaveLength(2);
    expect(lines.map(lineKey)).toEqual(["coca", "coca:pq"]);
    expect(stockUnits(lines[1])).toBe(48);
    expect(stockByProduct(lines).get("coca")).toBe(51);
    expect(computeTotals(lines, 0, "CDF")).toMatchObject({ total: 3000 + 44000, itemCount: 5 });
  });

  it("change la quantité d'une seule ligne", () => {
    const lines = setQuantity(addToCart(addToCart([], bouteille), paquet), "coca:pq", 0);
    expect(lines).toEqual([{ ...bouteille, quantity: 1 }]);
  });
});
