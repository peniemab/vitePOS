import { describe, expect, it } from "vitest";
import {
  addToCart,
  computePayment,
  computeTotals,
  dayKey,
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
    expect(computePayment(2767, "CDF", 2850, { method: "especes", payCurrency: "CDF", received: 5000 })).toEqual({
      due: 2767,
      change: 2233,
      missing: 0,
      ok: true,
      rateUsed: 0,
    });
  });

  it("signale ce qui manque", () => {
    const r = computePayment(2767, "CDF", 2850, { method: "especes", payCurrency: "CDF", received: 2000 });
    expect(r).toMatchObject({ ok: false, missing: 767, change: 0 });
  });

  it("convertit quand le client paie en dollars", () => {
    // 14 250 FC au taux 2 850 = 5 $
    const r = computePayment(14250, "CDF", 2850, { method: "especes", payCurrency: "USD", received: 10 });
    expect(r).toEqual({ due: 5, change: 5, missing: 0, ok: true, rateUsed: 2850 });
  });

  it("convertit des prix en dollars payés en francs", () => {
    const r = computePayment(4.5, "USD", 2850, { method: "especes", payCurrency: "CDF", received: 13000 });
    expect(r).toMatchObject({ due: 12825, change: 175, rateUsed: 2850 });
  });

  it("exige un taux pour convertir", () => {
    expect(computePayment(1000, "CDF", 0, { method: "especes", payCurrency: "USD", received: 5 })).toHaveProperty("error");
  });

  it("considère le mobile money comme payé", () => {
    expect(computePayment(2767, "CDF", 2850, { method: "mobile_money", payCurrency: "CDF", received: 0 })).toMatchObject({
      ok: true,
      change: 0,
    });
  });
});

describe("aides", () => {
  it("propose des billets qui couvrent le montant", () => {
    expect(suggestedBills(2767, "CDF")).toEqual([3000, 5000, 10000, 20000]);
    expect(suggestedBills(4.2, "USD")).toEqual([5, 10, 20, 50]);
  });

  it("forme un numéro de ticket court", () => {
    expect(ticketNumber("aZ3kq9Xm4p")).toBe("Q9XM-4P");
  });

  it("donne le jour local", () => {
    expect(dayKey(new Date(2026, 0, 5, 23, 59).getTime())).toBe("2026-01-05");
  });
});
