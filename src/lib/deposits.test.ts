import { describe, expect, it } from "vitest";
import { computeTotals, ticketNumber, type CartLine } from "./cart";
import {
  acompteLine,
  addDays,
  balance,
  canDeposit,
  defaultDueDay,
  depositReceiptLines,
  isLate,
  matchDeposit,
  pickupLines,
  readyMessage,
  sortDeposits,
  validAcompte,
  whatsappTo,
  type Deposit,
} from "./deposits";

const chemise: CartLine = { productId: "p1", name: "Chemise lavée-repassée", unit: "u", unitPrice: 2000, quantity: 3, service: true };
const costume: CartLine = { productId: "p2", name: "Costume nettoyage à sec", unit: "u", unitPrice: 8000, quantity: 1, service: true };

const dep: Deposit = {
  id: "abcdQ9XM4P",
  clientId: "c1",
  clientName: "Mme Kabongo Marie",
  clientPhone: "0812 345 678",
  lines: [
    { productId: "p1", name: "Chemise lavée-repassée", unit: "u", unitPrice: 2000, quantity: 3, lineTotal: 6000 },
    { productId: "p2", name: "Costume nettoyage à sec", unit: "u", unitPrice: 8000, quantity: 1, lineTotal: 8000 },
  ],
  notes: "Costume noir taché au col",
  subtotal: 14000,
  discount: 0,
  total: 14000,
  currency: "CDF",
  paid: 5000,
  dueDay: "2026-11-16",
  status: "recu",
  uid: "u1",
  memberName: "Ruth",
  dayKey: "2026-11-13",
  createdAtMs: Date.UTC(2026, 10, 13, 9),
  readyAtMs: 0,
  pickedUpAtMs: 0,
  pickedUpByName: "",
  cancelReason: "",
  synced: true,
};

describe("dépôts", () => {
  it("ne prend que des services", () => {
    expect(canDeposit([chemise, costume])).toBe(true);
    expect(canDeposit([chemise, { ...costume, service: undefined }])).toBe(false);
    expect(canDeposit([])).toBe(false);
  });

  it("calcule le reste à payer et le retard", () => {
    expect(balance(dep, "CDF")).toBe(9000);
    expect(balance({ total: 10, paid: 12 }, "USD")).toBe(0);
    expect(isLate(dep, "2026-11-16")).toBe(false);
    expect(isLate(dep, "2026-11-17")).toBe(true);
    expect(isLate({ ...dep, status: "retire" }, "2026-12-01")).toBe(false);
  });

  it("propose un retrait dans trois jours", () => {
    expect(defaultDueDay("2026-11-13")).toBe("2026-11-16");
    expect(addDays("2026-12-30", 3)).toBe("2027-01-02");
    expect(addDays("2026-03-28", 2)).toBe("2026-03-30");
  });

  it("vérifie l'acompte", () => {
    expect(validAcompte(5000, 14000)).toBe(true);
    expect(validAcompte(0, 14000)).toBe(false);
    expect(validAcompte(14000, 14000)).toBe(false);
  });

  it("la vente du retrait vaut le solde, remise et acompte déduits", () => {
    const lines = pickupLines(dep);
    expect(computeTotals(lines, 0, "CDF").total).toBe(9000);
    expect(lines.at(-1)).toMatchObject({ productId: "acompte-depot", unitPrice: -5000 });
    // L'acompte du jour du dépôt et sa reprise au retrait s'annulent sur le même article.
    expect(acompteLine(5000, dep.id)).toMatchObject({ productId: "acompte-depot", unitPrice: 5000, service: true });
    const withDiscount = pickupLines({ ...dep, discount: 1400, paid: 0 });
    expect(computeTotals(withDiscount, 0, "CDF").total).toBe(12600);
    expect(pickupLines({ ...dep, paid: 0 })).toHaveLength(2);
  });

  it("retrouve un dépôt par numéro, nom ou téléphone", () => {
    const code = ticketNumber(dep.id);
    expect(matchDeposit(dep, code)).toBe(true);
    expect(matchDeposit(dep, code.replace("-", "").toLowerCase())).toBe(true);
    expect(matchDeposit(dep, "kabongo")).toBe(true);
    expect(matchDeposit(dep, "345 678")).toBe(true);
    expect(matchDeposit(dep, "Tshala")).toBe(false);
  });

  it("met les dépôts en cours d'abord, par jour promis", () => {
    const a = { ...dep, id: "a", dueDay: "2026-11-18" };
    const b = { ...dep, id: "b", dueDay: "2026-11-15" };
    const c = { ...dep, id: "c", status: "retire" as const, pickedUpAtMs: 5 };
    expect(sortDeposits([c, a, b]).map((d) => d.id)).toEqual(["b", "a", "c"]);
  });

  it("imprime le ticket de dépôt avec le reste à payer", () => {
    const lines = depositReceiptLines({ name: "Pressing Élégance" }, dep);
    expect(lines).toContainEqual({ kind: "center", text: "Ticket de dépôt" });
    expect(lines).toContainEqual({ kind: "pair", left: "À retirer le", right: "16/11/2026", strong: true });
    expect(lines).toContainEqual({ kind: "text", text: "Costume noir taché au col" });
    expect(lines).toContainEqual({ kind: "barcode", value: ticketNumber(dep.id) });
    const rest = lines.find((l) => l.kind === "pair" && l.left === "Reste à payer");
    expect(rest).toMatchObject({ right: expect.stringContaining("9") });
  });

  it("prépare le message WhatsApp « c'est prêt »", () => {
    const msg = readyMessage("Pressing Élégance", dep);
    expect(msg).toContain("Bonjour Mme Kabongo Marie,");
    expect(msg).toContain(ticketNumber(dep.id));
    expect(msg).toContain("Reste à payer");
    expect(readyMessage("P", { ...dep, paid: 14000 })).toContain("Tout est déjà payé.");
    expect(whatsappTo("0812 345 678", "Salut")).toBe("https://wa.me/243812345678?text=Salut");
  });
});
