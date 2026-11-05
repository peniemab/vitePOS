import { describe, expect, it } from "vitest";
import {
  addMonths,
  canAddMember,
  canChangePlan,
  extendPaidUntil,
  formatUsd,
  needsAttention,
  paymentMessage,
  planPriceLabel,
  PLANS,
  priceUsd,
  subscriptionStatus,
  trialEnd,
  whatsappLink,
} from "./subscription";

const DAY = 86_400_000;
const start = new Date(2026, 9, 1).getTime();
const base = { plan: "supermarche" as const, trialEndsAtMs: trialEnd(start, "supermarche"), paidUntilMs: 0, createdAtMs: start };

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
    for (const p of Object.values(PLANS)) {
      if (p.monthlyUsd == null) expect(p.yearlyUsd).toBeNull();
      else expect(p.yearlyUsd).toBe(Math.round(p.monthlyUsd * 1000) / 100);
    }
  });

  it("donne un essai plus long aux grandes formules", () => {
    expect(trialEnd(start, "solo")).toBe(start + 7 * DAY);
    expect(trialEnd(start, "boutique")).toBe(start + 14 * DAY);
    expect(trialEnd(start, "pro")).toBe(start + 21 * DAY);
    expect(trialEnd(start, "supermarche")).toBe(start + 30 * DAY);
  });

  it("affiche les prix à la française", () => {
    expect(formatUsd(5)).toBe("5");
    expect(formatUsd(13.99)).toBe("13,99");
    expect(formatUsd(139.9)).toBe("139,90");
    expect(planPriceLabel("pro")).toBe("20,99 $ par mois");
    expect(planPriceLabel("supermarche")).toBe("sur devis");
  });

  it("limite les comptes selon la formule", () => {
    expect(canAddMember("solo", 0)).toBe(true);
    expect(canAddMember("solo", 1)).toBe(false);
    expect(canAddMember("boutique", 2)).toBe(true);
    expect(canAddMember("boutique", 3)).toBe(false);
    expect(canAddMember("pro", 9)).toBe(true);
    expect(canAddMember("supermarche", 500)).toBe(true);
  });
});

describe("paiements", () => {
  it("compte le prix annuel pour 12 mois", () => {
    expect(priceUsd("solo", 1)).toBe(5);
    expect(priceUsd("boutique", 3)).toBe(41.97);
    expect(priceUsd("pro", 6)).toBe(125.94);
    expect(priceUsd("pro", 12)).toBe(209.9);
    expect(priceUsd("supermarche", 1)).toBeNull();
  });

  it("ajoute des mois de calendrier sans déborder", () => {
    const day = (ms: number) => new Date(ms).toDateString();
    expect(day(addMonths(new Date(2026, 0, 31).getTime(), 1))).toBe(new Date(2026, 1, 28).toDateString());
    expect(day(addMonths(new Date(2026, 10, 15).getTime(), 3))).toBe(new Date(2027, 1, 15).toDateString());
  });

  it("prolonge après la fin de l'essai quand on paie pendant l'essai", () => {
    expect(extendPaidUntil(base, 1, start + 10 * DAY)).toBe(addMonths(trialEnd(start, "supermarche"), 1));
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
    expect(decodeURIComponent(link.split("text=")[1])).toContain("formule Équipe, 1 an (139,90 $)");
    expect(paymentMessage("Chez Mado", "supermarche", 1)).toContain("formule Sur mesure, 1 mois (prix sur devis)");
  });
});
