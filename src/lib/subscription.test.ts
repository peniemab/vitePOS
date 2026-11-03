import { describe, expect, it } from "vitest";
import {
  addMonths,
  canAddMember,
  canChangePlan,
  extendPaidUntil,
  needsAttention,
  paymentMessage,
  PLANS,
  priceUsd,
  subscriptionStatus,
  trialEnd,
  whatsappLink,
} from "./subscription";

const DAY = 86_400_000;
const start = new Date(2026, 9, 1).getTime();
const base = { plan: "boutique" as const, trialEndsAtMs: trialEnd(start), paidUntilMs: 0, createdAtMs: start };

describe("abonnement", () => {
  it("est en essai pendant 30 jours", () => {
    const st = subscriptionStatus(base, start + 10 * DAY);
    expect(st).toMatchObject({ state: "essai", daysLeft: 20, readOnly: false });
    expect(canChangePlan(st)).toBe(true);
  });

  it("laisse 7 jours de grâce puis passe en lecture seule", () => {
    expect(subscriptionStatus(base, start + 32 * DAY)).toMatchObject({ state: "grace", daysLeft: 5, readOnly: false });
    expect(subscriptionStatus(base, start + 37 * DAY)).toMatchObject({ state: "bloque", readOnly: true });
  });

  it("est actif une fois payé, jusqu'à la date payée", () => {
    const paid = { ...base, paidUntilMs: start + 60 * DAY };
    const st = subscriptionStatus(paid, start + 40 * DAY);
    expect(st).toMatchObject({ state: "actif", daysLeft: 20, readOnly: false });
    expect(canChangePlan(st)).toBe(false);
  });

  it("compte l'essai depuis la création pour une ancienne boutique", () => {
    const old = { ...base, trialEndsAtMs: 0 };
    expect(subscriptionStatus(old, start + 5 * DAY)).toMatchObject({ state: "essai", daysLeft: 25 });
  });

  it("prévient à 7 jours de la fin", () => {
    expect(needsAttention(subscriptionStatus(base, start + 10 * DAY))).toBe(false);
    expect(needsAttention(subscriptionStatus(base, start + 24 * DAY))).toBe(true);
  });
});

describe("formules", () => {
  it("offre 2 mois sur l'annuel", () => {
    for (const p of Object.values(PLANS)) expect(p.yearlyUsd).toBe(p.monthlyUsd * 10);
  });

  it("limite les comptes selon la formule", () => {
    expect(canAddMember("boutique", 2)).toBe(true);
    expect(canAddMember("boutique", 3)).toBe(false);
    expect(canAddMember("pro", 9)).toBe(true);
    expect(canAddMember("supermarche", 500)).toBe(true);
  });
});

describe("paiements", () => {
  it("compte le prix annuel pour 12 mois", () => {
    expect(priceUsd("boutique", 1)).toBe(10);
    expect(priceUsd("pro", 3)).toBe(75);
    expect(priceUsd("pro", 12)).toBe(250);
  });

  it("ajoute des mois de calendrier sans déborder", () => {
    const day = (ms: number) => new Date(ms).toDateString();
    expect(day(addMonths(new Date(2026, 0, 31).getTime(), 1))).toBe(new Date(2026, 1, 28).toDateString());
    expect(day(addMonths(new Date(2026, 10, 15).getTime(), 3))).toBe(new Date(2027, 1, 15).toDateString());
  });

  it("prolonge après la fin de l'essai quand on paie pendant l'essai", () => {
    expect(extendPaidUntil(base, 1, start + 10 * DAY)).toBe(addMonths(trialEnd(start), 1));
  });

  it("prolonge après la date payée quand l'abonnement court encore", () => {
    const paid = { ...base, paidUntilMs: start + 60 * DAY };
    expect(extendPaidUntil(paid, 12, start + 40 * DAY)).toBe(addMonths(start + 60 * DAY, 12));
  });

  it("repart d'aujourd'hui quand on paie en retard", () => {
    const now = start + 40 * DAY;
    expect(extendPaidUntil(base, 1, now)).toBe(addMonths(now, 1));
  });

  it("prépare le message WhatsApp", () => {
    const link = whatsappLink("083 989 2822", paymentMessage("Chez Mado", "boutique", 12));
    expect(link.startsWith("https://wa.me/243839892822?text=")).toBe(true);
    expect(decodeURIComponent(link.split("text=")[1])).toContain("formule Boutique, 1 an (100 $)");
  });
});
