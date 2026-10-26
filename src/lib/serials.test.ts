import { describe, expect, it } from "vitest";
import { checkSerial, formatDayShort, isValidImei, normalizeSerial, parseSerialList, warrantyUntil } from "./serials";

describe("numéros de série et IMEI", () => {
  it("nettoie un numéro saisi", () => {
    expect(normalizeSerial(" 35-209900 176148 1 ")).toBe("352099001761481");
    expect(normalizeSerial("sn:ab12-cd")).toBe("SNAB12CD");
  });

  it("vérifie un IMEI par le contrôle de Luhn", () => {
    expect(isValidImei("352099001761481")).toBe(true);
    expect(isValidImei("352099001761482")).toBe(false);
    expect(checkSerial("352099001761482")).toHaveProperty("error");
    expect(checkSerial("SN-12345")).toEqual({ value: "SN12345" });
    expect(checkSerial("12")).toHaveProperty("error");
  });

  it("lit une liste scannée, sans doublons", () => {
    expect(parseSerialList("352099001761481\n352099001761481, SN-0099\n12")).toEqual({
      values: ["352099001761481", "SN0099"],
      errors: ["« 12 » : numéro trop court."],
    });
  });

  it("calcule la fin de garantie", () => {
    expect(warrantyUntil("2026-10-17", 12)).toBe("2027-10-17");
    expect(warrantyUntil("2026-01-31", 1)).toBe("2026-02-28");
    expect(warrantyUntil("2026-10-17", 0)).toBe("");
    expect(formatDayShort("2027-10-17")).toBe("17/10/2027");
  });
});
