import { describe, expect, it } from "vitest";
import { lastMonths, monthOf, readMoney, toMain } from "./monthStats";

describe("compteurs mensuels", () => {
  it("donne le mois d'un jour", () => {
    expect(monthOf("2026-10-17")).toBe("2026-10");
  });

  it("liste les six derniers mois, en passant l'année", () => {
    expect(lastMonths("2026-02-14").map((m) => m.key)).toEqual(["2025-09", "2025-10", "2025-11", "2025-12", "2026-01", "2026-02"]);
    expect(lastMonths("2026-10-17", 1)[0].label).toBe("oct.");
  });

  it("lit un compteur abîmé sans planter", () => {
    expect(readMoney({ CDF: 1500, USD: "x" })).toEqual({ CDF: 1500, USD: 0, EUR: 0 });
    expect(readMoney(undefined)).toEqual({ CDF: 0, USD: 0, EUR: 0 });
  });

  it("convertit dans la devise principale au taux du jour", () => {
    const rates = { USD: 2850, EUR: 3100 };
    expect(toMain({ CDF: 10_000, USD: 2, EUR: 0 }, "CDF", rates)).toEqual({ total: 15_700, missing: [] });
    expect(toMain({ CDF: 2850, USD: 1, EUR: 0 }, "USD", rates)).toEqual({ total: 2, missing: [] });
  });

  it("signale une devise sans taux au lieu de la compter pour zéro", () => {
    expect(toMain({ CDF: 1000, USD: 0, EUR: 5 }, "CDF", { USD: 2850, EUR: 0 })).toEqual({ total: 1000, missing: ["EUR"] });
  });
});
