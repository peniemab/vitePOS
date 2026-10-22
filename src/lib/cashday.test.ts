import { describe, expect, it } from "vitest";
import { expectedCash, shiftDay, summarizeDay, variance, type Expense } from "./cashday";
import { formatPhone, matchClient, validateClient } from "./clients";
import type { Sale } from "./sales";

function sale(over: Partial<Sale> & Pick<Sale, "total" | "payment">): Sale {
  return {
    id: "s",
    uid: "u1",
    memberName: "Mado",
    lines: [],
    subtotal: over.total,
    discountPercent: 0,
    discount: 0,
    currency: "CDF",
    status: "validee",
    cancelReason: "",
    cancelledByName: "",
    createdAtMs: 0,
    dayKey: "2026-10-11",
    synced: true,
    clientId: "",
    clientName: "",
    inStats: true,
    ...over,
  };
}

const cashFc = (due: number) => ({ method: "especes" as const, currency: "CDF" as const, rates: null, due, received: due, change: 0 });

function expense(over: Partial<Expense>): Expense {
  return {
    id: "e",
    inStats: true,
    amount: 0,
    currency: "CDF",
    category: "transport",
    description: "",
    fromTill: true,
    status: "validee",
    memberName: "Mado",
    dayKey: "2026-10-11",
    createdAtMs: 0,
    ...over,
  };
}

describe("journée de caisse", () => {
  const sales: Sale[] = [
    sale({ total: 5000, payment: cashFc(5000) }),
    sale({ total: 14250, payment: { method: "especes", currency: "USD", rates: { USD: 2850, EUR: 0 }, due: 5, received: 10, change: 5 } }),
    sale({ total: 3000, payment: { method: "mobile_money", currency: "CDF", rates: null, due: 3000, received: 3000, change: 0 }, uid: "u2", memberName: "Joël" }),
    sale({ total: 9999, payment: cashFc(9999), status: "annulee" }),
  ];
  const expenses = [
    expense({ amount: 1500 }),
    expense({ amount: 2, currency: "USD" }),
    expense({ amount: 50000, fromTill: false, category: "loyer" }),
    expense({ amount: 700, status: "annulee" }),
  ];
  const s = summarizeDay(sales, expenses, "CDF");

  it("compte les ventes et ignore les annulées", () => {
    expect(s.salesCount).toBe(3);
    expect(s.cancelledCount).toBe(1);
    expect(s.revenue).toBe(22250);
  });

  it("sépare espèces FC, espèces $ et mobile money", () => {
    expect(s.cash).toEqual({ CDF: 5000, USD: 5, EUR: 0 });
    expect(s.mobileMoney).toEqual({ CDF: 3000, USD: 0, EUR: 0 });
  });

  it("distingue les dépenses payées en caisse", () => {
    expect(s.tillExpenses).toEqual({ CDF: 1500, USD: 2, EUR: 0 });
    expect(s.allExpenses).toEqual({ CDF: 51500, USD: 2, EUR: 0 });
  });

  it("calcule l'argent attendu et l'écart", () => {
    const exp = expectedCash(s, { CDF: 10000, USD: 20, EUR: 5 });
    expect(exp).toEqual({ CDF: 13500, USD: 23, EUR: 5 });
    expect(variance({ CDF: 13000, USD: 23, EUR: 5 }, exp)).toEqual({ CDF: -500, USD: 0, EUR: 0 });
  });

  it("classe les vendeurs par chiffre d'affaires", () => {
    expect(s.bySeller.map((v) => v.name)).toEqual(["Mado", "Joël"]);
  });

  it("change de jour, y compris d'un mois à l'autre", () => {
    expect(shiftDay("2026-10-31", 1)).toBe("2026-11-01");
    expect(shiftDay("2026-03-01", -1)).toBe("2026-02-28");
  });
});

describe("clients", () => {
  it("met les numéros congolais en forme", () => {
    expect(formatPhone("+243 81 234 5678")).toBe("0812 345 678");
    expect(formatPhone("0991234567")).toBe("0991 234 567");
    expect(formatPhone("812345678")).toBe("0812 345 678");
    expect(formatPhone("+33 6 12 34 56 78")).toBe("+33 6 12 34 56 78");
  });

  it("trouve un client par nom ou par numéro", () => {
    const c = { name: "Mama Ngalula", phone: "0812 345 678" };
    expect(matchClient(c, "ngalula")).toBe(true);
    expect(matchClient(c, "345678")).toBe(true);
    expect(matchClient(c, "kabila")).toBe(false);
  });

  it("valide la fiche", () => {
    expect(validateClient("  Papa Joël ", "243991234567")).toEqual({ name: "Papa Joël", phone: "0991 234 567" });
    expect(validateClient(" ", "")).toHaveProperty("error");
  });
});
