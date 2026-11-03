/**
 * Administration de vitePOS (réservée à l'éditeur) et historique des paiements d'abonnement.
 *
 * - `admins/{uid}` : présent pour les comptes de l'équipe vitePOS. Créé à la main dans la console
 *   Firebase, jamais par l'app.
 * - `boutiques/{id}/subscriptionPayments/{pid}` : un paiement d'abonnement, jamais modifié ni supprimé.
 *   Écrit par l'éditeur à la réception d'un paiement (et plus tard par le serveur pour FlexPay).
 *
 * Enregistrer un paiement se fait en ligne : on attend la réponse du serveur.
 */
import { useEffect, useState } from "react";
import { collection, doc, getDocFromServer, onSnapshot, orderBy, query, serverTimestamp, Timestamp, writeBatch, type DocumentData } from "firebase/firestore";
import { getDb } from "./firebase";
import { useSession } from "./session";
import { toBoutique, type Boutique } from "./boutique";
import { isPaymentMethod, isPlan, type PaymentMethod, type Plan } from "../lib/subscription";

export interface SubscriptionPayment {
  id: string;
  plan: Plan;
  months: number;
  amountUsd: number;
  method: PaymentMethod;
  /** Référence de la transaction mobile money (ou note libre). */
  reference: string;
  paidUntilMs: number;
  createdAtMs: number;
}

const ms = (v: unknown) => (v && typeof v === "object" && "toMillis" in v ? (v as { toMillis(): number }).toMillis() : 0);

function toPayment(id: string, d: DocumentData): SubscriptionPayment {
  return {
    id,
    plan: isPlan(d.plan) ? d.plan : "boutique",
    months: Number(d.months) || 0,
    amountUsd: Number(d.amountUsd) || 0,
    method: isPaymentMethod(d.method) ? d.method : "mobile_money",
    reference: String(d.reference ?? ""),
    paidUntilMs: ms(d.paidUntil),
    createdAtMs: ms(d.createdAt),
  };
}

const paymentsRef = (boutiqueId: string) => collection(getDb(), "boutiques", boutiqueId, "subscriptionPayments");

/** Ce compte fait-il partie de l'équipe vitePOS ? `undefined` tant que ce n'est pas lu. */
export function useIsAdmin(): boolean | undefined {
  const session = useSession();
  const uid = session.status === "loading" || session.status === "signedOut" ? "" : session.user.uid;
  const [admin, setAdmin] = useState<{ uid: string; yes: boolean }>({
    uid: "",
    yes: false,
  });
  useEffect(() => {
    if (!uid) return;
    return onSnapshot(
      doc(getDb(), "admins", uid),
      (s) => setAdmin({ uid, yes: s.exists() }),
      () => setAdmin({ uid, yes: false }),
    );
  }, [uid]);
  if (!uid) return false;
  return admin.uid === uid ? admin.yes : undefined;
}

/** Toutes les boutiques (éditeur seulement), les plus récentes d'abord. */
export function watchAllBoutiques(cb: (boutiques: Boutique[]) => void, onError: (e: unknown) => void) {
  return onSnapshot(query(collection(getDb(), "boutiques"), orderBy("createdAt", "desc")), (s) => cb(s.docs.map((d) => toBoutique(d.id, d.data()))), onError);
}

/** Nom et e-mail du propriétaire d'une boutique (éditeur seulement). */
export async function getOwner(b: Boutique): Promise<{ name: string; email: string }> {
  const s = await getDocFromServer(doc(getDb(), "boutiques", b.id, "members", b.ownerUid));
  const d = s.data() ?? {};
  return { name: String(d.name ?? ""), email: String(d.email ?? "") };
}

export function watchPayments(boutiqueId: string, cb: (payments: SubscriptionPayment[]) => void, onError: (e: unknown) => void) {
  return onSnapshot(query(paymentsRef(boutiqueId), orderBy("createdAt", "desc")), (s) => cb(s.docs.map((d) => toPayment(d.id, d.data()))), onError);
}

export interface NewPayment {
  plan: Plan;
  months: number;
  amountUsd: number;
  method: PaymentMethod;
  reference: string;
  /** Nouvelle date « payé jusqu'au », calculée par `extendPaidUntil`. */
  paidUntilMs: number;
}

/** Enregistre un paiement reçu et prolonge l'abonnement, d'un seul coup (éditeur seulement). */
export function recordPayment(boutique: Boutique, p: NewPayment, adminUid: string): Promise<void> {
  const db = getDb();
  const paidUntil = Timestamp.fromMillis(p.paidUntilMs);
  const batch = writeBatch(db);
  batch.update(doc(db, "boutiques", boutique.id), {
    plan: p.plan,
    billingCycle: p.months === 12 ? "annuel" : "mensuel",
    paidUntil,
    updatedAt: serverTimestamp(),
  });
  batch.set(doc(paymentsRef(boutique.id)), {
    plan: p.plan,
    months: p.months,
    amountUsd: p.amountUsd,
    method: p.method,
    reference: p.reference.trim(),
    paidUntilBefore: boutique.paidUntilMs ? Timestamp.fromMillis(boutique.paidUntilMs) : null,
    paidUntil,
    createdBy: adminUid,
    createdAt: serverTimestamp(),
  });
  return batch.commit();
}
