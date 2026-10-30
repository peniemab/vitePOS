import { describe, expect, it } from "vitest";
import { encodeCp1252, escPos, receiptLines, receiptText, receiptRows, type TextRow } from "./receipt";
import { blank, pack } from "./bitmap";
import { canCancelSale, type Sale } from "./sales";

const sale: Sale = {
  id: "abcdefQ9XM4P",
  uid: "u1",
  memberName: "Mado",
  lines: [
    { productId: "riz", name: "Riz 1kg", unit: "u", unitPrice: 700, quantity: 3, lineTotal: 2100 },
    { productId: "sucre", name: "Sucre", unit: "kg", unitPrice: 650, quantity: 1.5, lineTotal: 975 },
  ],
  subtotal: 3075,
  discountPercent: 10,
  discount: 308,
  total: 2767,
  currency: "CDF",
  payment: { method: "especes", currency: "USD", rates: { USD: 2850, EUR: 3100 }, due: 0.97, received: 1, change: 0.03 },
  clientId: "",
  clientName: "",
  inStats: true,
  status: "validee",
  cancelReason: "",
  cancelledByName: "",
  createdAtMs: new Date(2026, 9, 11, 14, 30).getTime(),
  dayKey: "2026-10-11",
  synced: true,
};

describe("ticket", () => {
  const lines = receiptLines({ name: "Boutique Mado" }, sale);
  const text = receiptText(lines, 58);

  it("contient les lignes, la remise, le total et le rendu", () => {
    expect(text).toContain("N° Q9XM-4P");
    expect(text).toContain("Sucre");
    expect(text).toContain("1,5 kg × 650 FC");
    expect(text).toContain("Remise 10 %");
    expect(text).toMatch(/TOTAL\s+2 767 FC/);
    expect(text).toContain("Taux : 1 $ = 2 850 FC");
    expect(text).toMatch(/Rendu\s+0,03 \$/);
  });

  it("tient dans la largeur du papier", () => {
    for (const l of text.split("\n")) expect(l.length).toBeLessThanOrEqual(32);
    for (const l of receiptText(lines, 80).split("\n")) expect(l.length).toBeLessThanOrEqual(48);
  });

  it("signale une vente annulée", () => {
    expect(receiptText(receiptLines({ name: "B" }, { ...sale, status: "annulee" }))).toContain("ANNULÉE");
  });
});

describe("receiptRows", () => {
  it("met le ticket en colonnes pour l'image", () => {
    const rows = receiptRows(
      [
        { kind: "title", text: "Mama" },
        { kind: "pair", left: "TOTAL", right: "21 100 FC", strong: true },
        { kind: "rule" },
      ],
      58,
    ) as TextRow[];
    expect(rows[0]).toEqual({ text: "      Mama", big: true, bold: true });
    expect(rows[1].text).toHaveLength(32);
    expect(rows[1].text.endsWith("21 100 FC")).toBe(true);
    expect(rows[1].bold).toBe(true);
    expect(rows[2].text).toBe("-".repeat(32));
  });

  it("passe à la ligne un nom de boutique trop long en double taille", () => {
    const rows = receiptRows([{ kind: "title", text: "Alimentation Mama Ngalula" }], 58) as TextRow[];
    expect(rows.map((r) => r.text.trim())).toEqual(["Alimentation", "Mama Ngalula"]);
  });
});

describe("ESC/POS", () => {
  it("encode les accents en Windows-1252", () => {
    expect(encodeCp1252("é à ×")).toEqual([0xe9, 0x20, 0xe0, 0x20, 0xd7]);
    expect(encodeCp1252("✓")).toEqual([63]);
  });

  it("initialise, imprime et coupe", () => {
    const bytes = escPos(receiptLines({ name: "B" }, sale), 58);
    expect([...bytes.slice(0, 2)]).toEqual([0x1b, 0x40]);
    expect([...bytes.slice(-3)]).toEqual([0x1d, 0x56, 0x00]);
  });
});

describe("annulation", () => {
  const now = new Date(2026, 9, 11, 18, 0).getTime();

  it("est permise le jour même", () => {
    expect(canCancelSale(sale, now)).toBe(true);
  });

  it("est refusée le lendemain ou si déjà annulée", () => {
    expect(canCancelSale(sale, new Date(2026, 9, 12, 8, 0).getTime())).toBe(false);
    expect(canCancelSale({ ...sale, status: "annulee" }, now)).toBe(false);
  });
});

describe("ticket d'un appareil", () => {
  it("imprime l'IMEI et la fin de garantie", () => {
    const line = { productId: "tel", name: "Galaxy A15", unit: "u" as const, unitPrice: 350000, quantity: 1, lineTotal: 350000 };
    const tel: Sale = { ...sale, lines: [{ ...line, serial: "352099001761481", warrantyUntil: "2027-10-11" }] };
    const text = receiptText(receiptLines({ name: "Boutique" }, tel));
    expect(text).toContain("IMEI / N° série : 352099001761481");
    expect(text).toContain("Garantie jusqu'au 11/10/2027");
  });
});

describe("en-tête et pied du ticket", () => {
  const shop = {
    name: "S&K",
    logo: pack(blank(16, 8)),
    address: "999, av. Libération, Kinshasa",
    phone: "+243 890 809 883",
    rccm: "CD/KIN/RCCM/14-B-2145",
    footer: "Merci de votre visite",
    link: "https://wa.me/243890809883",
    linkLabel: "Scannez et suivez-nous",
  };
  const lines = receiptLines(shop, sale);

  it("met le logo en premier et les coordonnées sous le nom", () => {
    expect(lines[0].kind).toBe("logo");
    expect(lines[1]).toEqual({ kind: "title", text: "S&K" });
    const text = receiptText(lines, 58);
    expect(text).toContain("Tél : +243 890 809 883");
    expect(text).toContain("RCCM : CD/KIN/RCCM/14-B-2145");
    expect(text).not.toContain("ID NAT");
  });

  it("ajoute le code-barres du ticket, le QR de la boutique, le message de fin et le QR vitePOS", () => {
    expect(lines).toContainEqual({ kind: "barcode", value: "Q9XM-4P" });
    expect(lines).toContainEqual({ kind: "qr", value: "https://wa.me/243890809883" });
    expect(lines.at(-2)).toMatchObject({ kind: "qr", small: true });
    const text = receiptText(lines, 58);
    expect(text).toContain("Merci de votre visite");
    expect(text).toContain("https://wa.me/243890809883");
    expect(text).not.toContain("Merci et à bientôt");
  });

  it("sans réglages : pas de QR de boutique, message par défaut", () => {
    const plain = receiptLines({ name: "B" }, sale);
    expect(plain.filter((l) => l.kind === "qr")).toHaveLength(1);
    expect(receiptText(plain)).toContain("Merci et à bientôt !");
  });

  it("dessine les images à la largeur du papier et les envoie à l'imprimante", () => {
    for (const r of receiptRows(lines, 58)) if ("image" in r) expect(r.image.width).toBeLessThanOrEqual(384);
    const bytes = [...escPos(lines, 58)];
    // Au moins trois images (logo, code-barres, deux QR) en commande GS v 0.
    const rasters = bytes.filter((b, i) => b === 0x1d && bytes[i + 1] === 0x76 && bytes[i + 2] === 0x30).length;
    expect(rasters).toBeGreaterThanOrEqual(4);
  });

  it("coupe les longues lignes centrées au lieu de les tronquer", () => {
    for (const l of receiptText(lines, 58).split("\n")) expect(l.length).toBeLessThanOrEqual(32);
    expect(receiptText(lines, 58)).toContain("Libération,");
  });
});
