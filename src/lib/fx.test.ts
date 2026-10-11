import { describe, expect, it } from "vitest";
import { cdfToUsd, convert, formatMoney, hasValidUsdRate, roundMoney, usdToCdf } from "./fx";

describe("fx", () => {
  it("arrondit selon la devise", () => {
    expect(roundMoney(1234.5, "CDF")).toBe(1235);
    expect(roundMoney(1.005, "USD")).toBe(1.01);
  });

  it("convertit au taux du jour", () => {
    expect(usdToCdf(10, 2850)).toBe(28500);
    expect(cdfToUsd(28500, 2850)).toBe(10);
    expect(cdfToUsd(1000, 2850)).toBe(0.35);
    expect(convert(5, "USD", "USD", 2850)).toBe(5);
    expect(convert(5, "USD", "CDF", 2850)).toBe(14250);
  });

  it("refuse un taux invalide", () => {
    expect(hasValidUsdRate(0)).toBe(false);
    expect(hasValidUsdRate(Number.NaN)).toBe(false);
    expect(hasValidUsdRate(undefined)).toBe(false);
    expect(usdToCdf(10, 0)).toBe(0);
  });

  it("formate les montants", () => {
    expect(formatMoney(12500, "CDF")).toBe("12 500 FC");
    expect(formatMoney(4.5, "USD")).toBe("4,50 $");
  });
});
