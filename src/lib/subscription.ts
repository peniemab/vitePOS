/**
 * Abonnements : formules, prix, essai, période de grâce et lecture seule (logique pure).
 * La formule et les dates de paiement sont fixées par l'éditeur de vitePOS, jamais par le client.
 */

export type Plan = "boutique" | "pro" | "supermarche";
export type BillingCycle = "mensuel" | "annuel";

/** Numéro (WhatsApp) à contacter pour payer ; vide tant qu'il n'est pas fixé. */
export const PAYMENT_CONTACT = "";

export const TRIAL_DAYS = 30;
export const GRACE_DAYS = 7;
const DAY = 86_400_000;

export interface PlanInfo {
  name: string;
  /** Prix en dollars par mois (par magasin pour Supermarché). */
  monthlyUsd: number;
  /** Prix annuel : 12 mois pour le prix de 10. */
  yearlyUsd: number;
  /** Comptes (employés) actifs au plus ; `null` = illimité. */
  maxMembers: number | null;
  audience: string;
  features: string[];
}

export const PLANS: Record<Plan, PlanInfo> = {
  boutique: {
    name: "Boutique",
    monthlyUsd: 10,
    yearlyUsd: 100,
    maxMembers: 3,
    audience: "Boutique de quartier, alimentation, cosmétiques, téléphonie",
    features: ["Caisse FC, $ et mobile money", "Stock, alertes, import Excel", "Ventes, clients, dépenses", "Journée de caisse, inventaire, rapports", "3 comptes"],
  },
  pro: {
    name: "Pro",
    monthlyUsd: 25,
    yearlyUsd: 250,
    maxMembers: 10,
    audience: "Quincaillerie, pharmacie, grossiste, grande boutique",
    features: ["Tout de la formule Boutique", "10 comptes", "Crédit clients (bientôt)", "Fournisseurs et achats (bientôt)", "Devis et factures (bientôt)"],
  },
  supermarche: {
    name: "Supermarché",
    monthlyUsd: 80,
    yearlyUsd: 800,
    maxMembers: null,
    audience: "Supermarché, supérette, chaîne de magasins",
    features: ["Tout de la formule Pro", "Comptes illimités", "Plusieurs magasins (bientôt)", "Promotions et balances (bientôt)", "Installation et formation sur devis"],
  },
};

export function isPlan(v: unknown): v is Plan {
  return v === "boutique" || v === "pro" || v === "supermarche";
}

export interface SubscriptionInput {
  plan: Plan;
  /** Fin de l'essai gratuit (0 si inconnue). */
  trialEndsAtMs: number;
  /** Payé jusqu'au (0 si jamais payé). */
  paidUntilMs: number;
  /** Création de la boutique, pour les boutiques créées avant les abonnements. */
  createdAtMs: number;
}

export type SubscriptionState = "essai" | "actif" | "grace" | "bloque";

export interface SubscriptionStatus {
  state: SubscriptionState;
  plan: Plan;
  /** Date jusqu'à laquelle l'accès est payé ou offert. */
  endsAtMs: number;
  /** Jours restants avant la fin (essai ou abonnement), ou avant le blocage pendant la grâce. */
  daysLeft: number;
  /** Plus de ventes ni de modifications possibles ; consultation et export seulement. */
  readOnly: boolean;
}

export function trialEnd(createdAtMs: number): number {
  return createdAtMs + TRIAL_DAYS * DAY;
}

export function subscriptionStatus(s: SubscriptionInput, now = Date.now()): SubscriptionStatus {
  // Boutique créée avant les abonnements : l'essai court depuis sa création ; sans date, on ne bloque pas.
  const trialEndsAt = s.trialEndsAtMs || (s.createdAtMs ? trialEnd(s.createdAtMs) : now + TRIAL_DAYS * DAY);
  const endsAt = Math.max(trialEndsAt, s.paidUntilMs);
  const days = (t: number) => Math.max(0, Math.ceil((t - now) / DAY));

  if (now < endsAt) {
    const state: SubscriptionState = s.paidUntilMs > now ? "actif" : "essai";
    return { state, plan: s.plan, endsAtMs: endsAt, daysLeft: days(endsAt), readOnly: false };
  }
  const blockAt = endsAt + GRACE_DAYS * DAY;
  if (now < blockAt) return { state: "grace", plan: s.plan, endsAtMs: endsAt, daysLeft: days(blockAt), readOnly: false };
  return { state: "bloque", plan: s.plan, endsAtMs: endsAt, daysLeft: 0, readOnly: true };
}

/** Faut-il prévenir le propriétaire ? (fin d'essai ou d'abonnement dans 7 jours ou moins, grâce, blocage) */
export function needsAttention(st: SubscriptionStatus): boolean {
  return st.state === "grace" || st.state === "bloque" || st.daysLeft <= 7;
}

/** Le propriétaire peut changer de formule lui-même seulement pendant l'essai. */
export function canChangePlan(st: SubscriptionStatus): boolean {
  return st.state === "essai";
}

/** Peut-on encore activer un compte d'employé ? `activeMembers` compte déjà le propriétaire. */
export function canAddMember(plan: Plan, activeMembers: number): boolean {
  const max = PLANS[plan].maxMembers;
  return max == null || activeMembers < max;
}
