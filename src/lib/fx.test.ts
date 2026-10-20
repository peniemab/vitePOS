import { describe, expect, it } from "vitest";
import { convert, formatMoney, formatMoneyByCurrency, hasRate, isValidRate, roundMoney } from "./fx";

const rates = { USD: 2850, EUR: 3100 };

describe("fx", () => {
  it("arrondit selon la devise", () => {
    expect(roundMoney(1234.5, "CDF")).toBe(1235);
    expect(roundMoney(1.005, "USD")).toBe(1.01);
    expect(roundMoney(2.345, "EUR")).toBe(2.35);
  });

  it("convertit entre francs, dollars et euros en passant par le franc", () => {
    expect(convert(10, "USD", "CDF", rates)).toBe(28500);
    expect(convert(28500, "CDF", "USD", rates)).toBe(10);
    expect(convert(1000, "CDF", "USD", rates)).toBe(0.35);
    expect(convert(10, "EUR", "CDF", rates)).toBe(31000);
    expect(convert(31000, "CDF", "EUR", rates)).toBe(10);
    // 10 € = 31 000 FC = 10,88 $
    expect(convert(10, "EUR", "USD", rates)).toBe(10.88);
    expect(convert(5, "USD", "USD", rates)).toBe(5);
  });

  it("refuse un taux invalide", () => {
    expect(isValidRate(0)).toBe(false);
    expect(isValidRate(Number.NaN)).toBe(false);
    expect(isValidRate(undefined)).toBe(false);
    expect(hasRate({ USD: 2850, EUR: 0 }, "EUR")).toBe(false);
    expect(hasRate({ USD: 0, EUR: 0 }, "CDF")).toBe(true);
    expect(convert(10, "EUR", "CDF", { USD: 2850, EUR: 0 })).toBe(0);
  });

  it("formate les montants", () => {
    expect(formatMoney(12500, "CDF")).toBe("12 500 FC");
    expect(formatMoney(4.5, "USD")).toBe("4,50 $");
    expect(formatMoney(3.2, "EUR")).toBe("3,20 €");
    expect(formatMoneyByCurrency({ CDF: 12500, USD: 0, EUR: 3 })).toBe("12 500 FC + 3,00 €");
    expect(formatMoneyByCurrency({ CDF: 0, USD: 0, EUR: 0 })).toBe("—");
  });
});
