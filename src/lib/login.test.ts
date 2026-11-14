import { describe, expect, it } from "vitest";
import { displayLogin, isPhoneLogin, loginEmail, phoneDigits } from "./login";

describe("connexion par téléphone", () => {
  it("reconnaît les numéros congolais sous toutes leurs formes", () => {
    for (const n of ["0812345678", "0812 345 678", "+243 812 345 678", "243812345678", "00243812345678", "812345678", "081-234-5678"])
      expect(phoneDigits(n)).toBe("243812345678");
    expect(phoneDigits("0998112233")).toBe("243998112233");
  });

  it("refuse ce qui n'est pas un numéro", () => {
    for (const n of ["12345", "0712345678", "+33612345678", "08123456789", "abc"]) expect(phoneDigits(n)).toBeNull();
  });

  it("transforme le numéro en adresse technique, garde l'e-mail tel quel", () => {
    expect(loginEmail(" 0812 345 678 ")).toEqual({ email: "243812345678@tel.viteposrdc.com", phone: true });
    expect(loginEmail("Mama@Gmail.com ")).toEqual({ email: "mama@gmail.com", phone: false });
    expect(loginEmail("")).toHaveProperty("error");
    expect(loginEmail("1234")).toHaveProperty("error");
  });

  it("montre le numéro, jamais l'adresse technique", () => {
    expect(isPhoneLogin("243812345678@tel.viteposrdc.com")).toBe(true);
    expect(displayLogin("243812345678@tel.viteposrdc.com")).toBe("0812 345 678");
    expect(displayLogin("mama@gmail.com")).toBe("mama@gmail.com");
    expect(displayLogin(undefined)).toBe("");
  });
});
