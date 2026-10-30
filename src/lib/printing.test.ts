import { describe, expect, it } from "vitest";
import { chunks, isPrinterMode, rawbtUrl, toBase64 } from "./printing";

describe("printing", () => {
  it("découpe les données en paquets sans rien perdre", () => {
    const bytes = new Uint8Array(250).map((_, i) => i % 256);
    const parts = chunks(bytes, 100);
    expect(parts.map((p) => p.length)).toEqual([100, 100, 50]);
    expect(Array.from(parts.flatMap((p) => Array.from(p)))).toEqual(Array.from(bytes));
  });

  it("refuse une taille de paquet nulle", () => {
    expect(() => chunks(new Uint8Array(3), 0)).toThrow();
  });

  it("encode en base64, octets non ASCII compris", () => {
    expect(toBase64(new Uint8Array([0x1b, 0x40, 0xe9]))).toBe("G0Dp");
  });

  it("construit l'adresse RawBT", () => {
    expect(rawbtUrl(new Uint8Array([0x1b, 0x40]))).toBe("intent:base64,G0A=#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;end;");
  });

  it("reconnaît les modes d'impression", () => {
    expect(isPrinterMode("bluetooth")).toBe(true);
    expect(isPrinterMode("fax")).toBe(false);
    expect(isPrinterMode(null)).toBe(false);
  });
});
