import { describe, expect, it } from "vitest";
import { generateInviteCode, INVITE_ALPHABET, normalizeInviteCode } from "./invite";

describe("invite", () => {
  it("génère un code de 6 caractères de l'alphabet", () => {
    for (let i = 0; i < 50; i++) {
      const code = generateInviteCode();
      expect(code).toHaveLength(6);
      expect([...code].every((c) => INVITE_ALPHABET.includes(c))).toBe(true);
    }
  });

  it("nettoie la saisie", () => {
    expect(normalizeInviteCode(" ab-c 2d3 ")).toBe("ABC2D3");
    expect(normalizeInviteCode("abc")).toBe("");
    expect(normalizeInviteCode("ABC10O")).toBe("");
  });
});
