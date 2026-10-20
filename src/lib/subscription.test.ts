import { describe, expect, it } from "vitest";
import { canAddMember, canChangePlan, needsAttention, PLANS, subscriptionStatus, trialEnd } from "./subscription";

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
