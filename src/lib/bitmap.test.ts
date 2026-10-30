import { describe, expect, it } from "vitest";
import { blank, code128Bitmap, code128Widths, escPosRaster, pack, qrBitmap, toBitmap, unpack } from "./bitmap";

describe("pack / unpack", () => {
  it("retrouve la même image", () => {
    const b = blank(13, 5);
    [0, 7, 8, 12, 30, 64].forEach((i) => (b.data[i] = 1));
    const back = unpack(pack(b));
    expect(back.width).toBe(13);
    expect(back.height).toBe(5);
    expect([...back.data]).toEqual([...b.data]);
  });
});

describe("toBitmap", () => {
  it("sans trame : sombre devient noir, clair devient blanc", () => {
    expect([...toBitmap([0, 100, 200, 255], 4, 1, false).data]).toEqual([1, 1, 0, 0]);
  });
  it("avec trame : un gris moyen donne environ moitié de points noirs", () => {
    const b = toBitmap(new Array(400).fill(128), 20, 20, true);
    const black = b.data.reduce((a, v) => a + v, 0);
    expect(black).toBeGreaterThan(150);
    expect(black).toBeLessThan(250);
  });
});

describe("qrBitmap", () => {
  it("tient dans la taille demandée, avec des modules entiers", () => {
    const b = qrBitmap("https://wa.me/243890809883", 200);
    expect(b.width).toBe(b.height);
    expect(b.width).toBeLessThanOrEqual(200);
    expect(b.width).toBeGreaterThan(120);
    // Coin haut gauche : marge blanche puis motif de repérage noir.
    expect(b.data[0]).toBe(0);
  });
});

describe("Code 128", () => {
  it("chaque symbole fait 11 modules, l'arrêt 13", () => {
    const w = code128Widths("7KQ2-M4");
    // départ + 7 caractères + contrôle = 9 symboles de 11, plus l'arrêt.
    expect(w.reduce((a, b) => a + b, 0)).toBe(9 * 11 + 13);
  });
  it("calcule la clé de contrôle", () => {
    // 104 + 48×1 + 42×2 + 42×3 + 17×4 + 18×5 + 19×6 + 35×7 = 879, et 879 modulo 103 = 55.
    const w = code128Widths("PJJ123C");
    expect(w.slice(-13, -7).join("")).toBe("311321");
  });
  it("refuse les caractères hors du jeu B", () => {
    expect(() => code128Widths("é")).toThrow();
  });
  it("dessine dans la largeur demandée", () => {
    const b = code128Bitmap("7KQ2-M4", 368, 60);
    expect(b.width).toBeLessThanOrEqual(368);
    expect(b.height).toBe(60);
  });
});

describe("escPosRaster", () => {
  it("centre l'image en ajoutant du blanc à gauche", () => {
    const b = blank(8, 1);
    b.data.fill(1);
    const bytes = escPosRaster(b, 32);
    // GS v 0, largeur 2 octets (8 points de marge + 8 points), hauteur 1.
    expect(bytes.slice(0, 8)).toEqual([0x1d, 0x76, 0x30, 0, 2, 0, 1, 0]);
    expect(bytes.slice(8)).toEqual([0x00, 0xff]);
  });
});
