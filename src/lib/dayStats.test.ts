import { describe, expect, it } from "vitest";
import { addDay, daysFromSales, emptyDay, readDay, saleShare } from "./dayStats";
import { buildReport, periodOf, reportFromDays } from "./reports";
import type { Sale } from "./sales";

function sale(over: Partial<Sale>): Sale {
  return {
    id: "s",
    uid: "u1",
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
    inStats: true,
    inDayStats: true,
    status: "validee",
    cancelReason: "",
    cancelledByName: "",
    createdAtMs: 0,
    dayKey: "2026-10-12",
    synced: true,
    ...over,
  };
}

const riz = { productId: "riz", name: "Riz", unit: "kg" as const, unitPrice: 2000, quantity: 2, lineTotal: 4000 };
const eau = { productId: "eau", name: "Eau", unit: "u" as const, unitPrice: 6000, quantity: 1, lineTotal: 6000, packId: "p", packName: "Pack", packUnits: 6 };
const sales = [
  sale({ lines: [riz, eau], subtotal: 10000, discount: 1000, total: 9000 }),
  sale({ uid: "u2", lines: [riz], subtotal: 4000, total: 4000, payment: { ...sale({}).payment, method: "mobile_money" } }),
  sale({ dayKey: "2026-10-13", lines: [eau], subtotal: 6000, total: 6000 }),
  sale({ lines: [riz], subtotal: 4000, total: 4000, status: "annulee" }),
];

describe("résumés par jour", () => {
  it("répartit la remise sur les lignes et compte les paquets à l'unité", () => {
    const d = saleShare(sales[0]);
    expect(d.products.riz).toEqual({ n: "Riz", q: 2, r: 3600 });
    expect(d.products.eau).toEqual({ n: "Eau", q: 6, r: 5400 });
    expect(d.members.u1).toEqual({ r: 9000, c: 1 });
  });

  it("ignore les ventes annulées et regroupe par jour", () => {
    const days = daysFromSales(sales);
    expect(days.map((d) => [d.day, d.count, d.revenue])).toEqual([
      ["2026-10-12", 2, 13000],
      ["2026-10-13", 1, 6000],
    ]);
  });

  it("donne le même rapport que les ventes elles-mêmes", () => {
    const week = periodOf("semaine", "2026-10-12");
    const costs = new Map([["riz", 1500]]);
    expect(reportFromDays(daysFromSales(sales), week, "CDF", costs)).toEqual(buildReport(sales, week, "CDF", costs));
  });

  it("revient à zéro quand une vente est annulée, sans laisser d'article vide", () => {
    const d = addDay(emptyDay("2026-10-12"), saleShare(sales[1]));
    const minus = saleShare(sales[1]);
    for (const k of ["revenue", "count", "cash", "mobileMoney"] as const) minus[k] = -minus[k];
    for (const p of Object.values(minus.products)) Object.assign(p, { q: -p.q, r: -p.r });
    for (const m of Object.values(minus.members)) Object.assign(m, { r: -m.r, c: -m.c });
    const r = reportFromDays([addDay(d, minus)], periodOf("jour", "2026-10-12"), "CDF");
    expect([r.revenue, r.salesCount, r.topProducts]).toEqual([0, 0, []]);
  });

  it("limite le graphique d'un vendeur à ses propres ventes", () => {
    const r = reportFromDays(daysFromSales(sales), periodOf("jour", "2026-10-12"), "CDF", undefined, "u2");
    expect([r.revenue, r.salesCount, r.byDay[0].revenue]).toEqual([4000, 1, 4000]);
  });

  it("lit un résumé enregistré, même abîmé", () => {
    const d = readDay("2026-10-12", { revenue: 5, count: "x", products: { riz: { n: "Riz", q: 1 } }, members: null });
    expect([d.revenue, d.count, d.products.riz, d.members]).toEqual([5, 0, { n: "Riz", q: 1, r: 0 }, {}]);
  });
});

describe("dépôts dans les résumés", () => {
  it("l'avance et sa reprise au retrait s'annulent dans les articles, l'argent reste compté", () => {
    const acompte = { productId: "acompte-depot", name: "Acompte · Dépôt N° AB12-CD", unit: "u" as const, unitPrice: 5000, quantity: 1, lineTotal: 5000, service: true };
    const chemise = { productId: "s1", name: "Chemise", unit: "u" as const, unitPrice: 2000, quantity: 6, lineTotal: 12000, service: true };
    const reprise = { ...acompte, name: "Acompte déjà payé", unitPrice: -5000, lineTotal: -5000 };
    const days = daysFromSales([
      sale({ lines: [acompte], subtotal: 5000, total: 5000 }),
      sale({ lines: [chemise, reprise], subtotal: 7000, total: 7000 }),
    ]);
    const report = reportFromDays(days, periodOf("jour", "2026-10-12"), "CDF");
    expect(report.revenue).toBe(12000);
    expect(report.topProducts.map((p) => p.name)).toEqual(["Chemise"]);
  });
});
