import { describe, expect, it } from "vitest";
import { buildReport, changePercent, periodOf, shiftPeriod } from "./reports";
import { gapTotals, inventoryGaps } from "./inventory";
import type { Sale } from "./sales";

function sale(over: Partial<Sale>): Sale {
  return {
    id: "s",
    uid: "u",
    memberName: "Mado",
    lines: [],
    subtotal: 0,
    discountPercent: 0,
    discount: 0,
    total: 0,
    currency: "CDF",
    payment: { method: "especes", currency: "CDF", rates: null, due: 0, received: 0, change: 0 },
    clientId: "",
    clientName: "",
    status: "validee",
    cancelReason: "",
    cancelledByName: "",
    createdAtMs: 0,
    dayKey: "2026-10-12",
    synced: true,
    ...over,
  };
}

describe("périodes", () => {
  it("donne la semaine du lundi au dimanche", () => {
    // 12 octobre 2026 = lundi
    const w = periodOf("semaine", "2026-10-15");
    expect([w.start, w.end, w.days.length]).toEqual(["2026-10-12", "2026-10-18", 7]);
  });

  it("donne le mois entier, février compris", () => {
    const m = periodOf("mois", "2026-02-14");
    expect([m.start, m.end, m.days.length]).toEqual(["2026-02-01", "2026-02-28", 28]);
  });

  it("passe à la période voisine", () => {
    expect(shiftPeriod(periodOf("mois", "2026-01-31"), 1).start).toBe("2026-02-01");
    expect(shiftPeriod(periodOf("semaine", "2026-10-12"), -1).start).toBe("2026-10-05");
    expect(shiftPeriod(periodOf("jour", "2026-10-12"), -1).start).toBe("2026-10-11");
  });
});

describe("rapport", () => {
  const sales = [
    sale({
      lines: [
        { productId: "riz", name: "Riz", unit: "u", unitPrice: 700, quantity: 2, lineTotal: 1400 },
        { productId: "sel", name: "Sel", unit: "u", unitPrice: 300, quantity: 2, lineTotal: 600 },
      ],
      subtotal: 2000,
      discount: 200,
      total: 1800,
    }),
    sale({
      lines: [{ productId: "riz", name: "Riz", unit: "u", unitPrice: 700, quantity: 1, lineTotal: 700 }],
      subtotal: 700,
      total: 700,
      dayKey: "2026-10-13",
      payment: { method: "mobile_money", currency: "CDF", rates: null, due: 700, received: 700, change: 0 },
    }),
    sale({ total: 99999, subtotal: 99999, status: "annulee" }),
    sale({ total: 5000, subtotal: 5000, dayKey: "2026-09-30" }),
  ];
  const period = periodOf("semaine", "2026-10-12");
  const r = buildReport(sales, period, "CDF", new Map([["riz", 500]]));

  it("ne compte que les ventes validées de la période", () => {
    expect(r.salesCount).toBe(2);
    expect(r.revenue).toBe(2500);
    expect(r.averageBasket).toBe(1250);
    expect(r.payment).toEqual({ cash: 1800, mobileMoney: 700 });
  });

  it("répartit la remise sur les produits", () => {
    // Riz : 1400 × 0,9 + 700 = 1960 ; Sel : 600 × 0,9 = 540
    expect(r.topProducts).toEqual([
      { productId: "riz", name: "Riz", quantity: 3, revenue: 1960 },
      { productId: "sel", name: "Sel", quantity: 2, revenue: 540 },
    ]);
  });

  it("calcule la marge sur les produits dont le prix d'achat est connu", () => {
    expect(r.costOfGoods).toBe(1500);
    expect(r.margin).toBe(460);
    expect(r.costCoverage).toBeCloseTo(0.784, 3);
  });

  it("remplit tous les jours de la période", () => {
    expect(r.byDay).toHaveLength(7);
    expect(r.byDay[1]).toEqual({ day: "2026-10-13", revenue: 700, count: 1 });
  });

  it("calcule une variation", () => {
    expect(changePercent(1200, 1000)).toBe(20);
    expect(changePercent(5, 0)).toBeUndefined();
  });
});

describe("inventaire", () => {
  it("calcule les écarts et leur valeur", () => {
    const gaps = inventoryGaps(
      [
        { productId: "riz", name: "Riz", unit: "u", theoretical: 40, counted: 37 },
        { productId: "sel", name: "Sel", unit: "u", theoretical: 10, counted: 10 },
        { productId: "huile", name: "Huile", unit: "L", theoretical: 5, counted: 5.5 },
      ],
      new Map([
        ["riz", 700],
        ["huile", 1500],
      ]),
    );
    expect(gaps).toEqual([
      { productId: "riz", name: "Riz", unit: "u", delta: -3, value: -2100 },
      { productId: "huile", name: "Huile", unit: "L", delta: 0.5, value: 750 },
    ]);
    expect(gapTotals(gaps)).toEqual({ missingValue: 2100, surplusValue: 750, lines: 2 });
  });
});
