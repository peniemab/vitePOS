/**
 * Comptes, boutiques et membres.
 *
 * - `users/{uid}` : fiche du compte Firebase, avec la boutique ouverte (`boutiqueId`).
 * - `boutiques/{id}` : réglages de la boutique.
 * - `boutiques/{id}/members/{uid}` : rôle et statut de chaque employé.
 * - `invitations/{code}` : retrouve la boutique à partir de son code d'invitation.
 *
 * Créer ou rejoindre une boutique se fait en ligne (on attend la réponse du serveur) ;
 * tout le reste fonctionne hors ligne grâce au cache Firestore.
 */
import {
  collection,
  doc,
  getDocFromServer,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  Timestamp,
  writeBatch,
  type DocumentData,
} from "firebase/firestore";
import type { User } from "firebase/auth";
import { getDb } from "./firebase";
import { track } from "./sync";
import { CURRENCY_LIST, isCurrency, isValidRate, type Currency, type Rates } from "../lib/fx";
import { generateInviteCode, normalizeInviteCode } from "../lib/invite";
import { isRole, isStatus, type MemberStatus, type Permissions, type Role } from "../lib/roles";
import { isPlan, trialEnd, type BillingCycle, type Plan } from "../lib/subscription";
import type { PackedBitmap } from "../lib/bitmap";
import type { ReceiptSettings } from "../lib/receipt";

export interface Profile {
  uid: string;
  email: string;
  name: string;
  /** Boutique ouverte par ce compte ; vide tant qu'il n'en a ni créé ni rejoint. */
  boutiqueId: string;
}

export interface Boutique {
  id: string;
  name: string;
  currency: Currency;
  inviteCode: string;
  ownerUid: string;
  /** Taux du jour : combien de FC pour 1 $ et pour 1 € (0 si pas encore saisi). */
  usdRateCdf: number;
  usdRateUpdatedAtMs: number;
  eurRateCdf: number;
  eurRateUpdatedAtMs: number;
  paperWidthMm: 58 | 80;
  autoPrintTicket: boolean;
  /** En-tête et pied du ticket : logo, coordonnées, mentions légales, QR code de la boutique. */
  receipt: ReceiptSettings;
  /** Abonnement : fixé par l'éditeur de vitePOS (le propriétaire peut changer de formule pendant l'essai). */
  plan: Plan;
  billingCycle: BillingCycle;
  trialEndsAtMs: number;
  paidUntilMs: number;
  createdAtMs: number;
}

export interface Member {
  uid: string;
  email: string;
  name: string;
  role: Role;
  status: MemberStatus;
  permissions: Partial<Permissions>;
  createdAtMs: number;
}

/* ---------- Conversion des documents ---------- */

function ms(v: unknown): number {
  return v && typeof v === "object" && "toMillis" in v ? (v as { toMillis(): number }).toMillis() : 0;
}

function toProfile(uid: string, d: DocumentData): Profile {
  return { uid, email: String(d.email ?? ""), name: String(d.name ?? ""), boutiqueId: String(d.boutiqueId ?? "") };
}

function toReceipt(r: unknown): ReceiptSettings {
  if (!r || typeof r !== "object") return {};
  const d = r as Record<string, unknown>;
  const str = (k: string) => (typeof d[k] === "string" ? (d[k] as string) : "");
  const logo = d.logo as PackedBitmap | null | undefined;
  return {
    logo: logo && typeof logo.bits === "string" && logo.w > 0 && logo.h > 0 ? logo : null,
    address: str("address"),
    phone: str("phone"),
    rccm: str("rccm"),
    idNat: str("idNat"),
    taxId: str("taxId"),
    footer: str("footer"),
    link: str("link"),
    linkLabel: str("linkLabel"),
  };
}

function toBoutique(id: string, d: DocumentData): Boutique {
  return {
    id,
    name: String(d.name ?? ""),
    currency: isCurrency(d.currency) ? d.currency : "CDF",
    inviteCode: String(d.inviteCode ?? ""),
    ownerUid: String(d.ownerUid ?? ""),
    usdRateCdf: isValidRate(d.usdRateCdf) ? d.usdRateCdf : 0,
    usdRateUpdatedAtMs: ms(d.usdRateUpdatedAt),
    eurRateCdf: isValidRate(d.eurRateCdf) ? d.eurRateCdf : 0,
    eurRateUpdatedAtMs: ms(d.eurRateUpdatedAt),
    paperWidthMm: d.paperWidthMm === 80 ? 80 : 58,
    autoPrintTicket: d.autoPrintTicket === true,
    receipt: toReceipt(d.receipt),
    plan: isPlan(d.plan) ? d.plan : "boutique",
    billingCycle: d.billingCycle === "annuel" ? "annuel" : "mensuel",
    trialEndsAtMs: ms(d.trialEndsAt),
    paidUntilMs: ms(d.paidUntil),
    createdAtMs: ms(d.createdAt),
  };
}

function toMember(uid: string, d: DocumentData): Member {
  return {
    uid,
    email: String(d.email ?? ""),
    name: String(d.name ?? ""),
    role: isRole(d.role) ? d.role : "vendeur",
    status: isStatus(d.status) ? d.status : "pending",
    permissions: (d.permissions ?? {}) as Partial<Permissions>,
    createdAtMs: ms(d.createdAt),
  };
}

/* ---------- Références ---------- */

const userRef = (uid: string) => doc(getDb(), "users", uid);
const boutiqueRef = (id: string) => doc(getDb(), "boutiques", id);
const memberRef = (boutiqueId: string, uid: string) => doc(getDb(), "boutiques", boutiqueId, "members", uid);
const invitationRef = (code: string) => doc(getDb(), "invitations", code);

/* ---------- Écoutes (hors ligne grâce au cache) ---------- */

type Watch<T> = (value: T | null, fromCache: boolean) => void;

export function watchProfile(uid: string, cb: Watch<Profile>, onError: (e: unknown) => void) {
  return onSnapshot(
    userRef(uid),
    { includeMetadataChanges: true },
    (s) => cb(s.exists() ? toProfile(s.id, s.data()) : null, s.metadata.fromCache),
    onError,
  );
}

export function watchBoutique(id: string, cb: Watch<Boutique>, onError: (e: unknown) => void) {
  return onSnapshot(
    boutiqueRef(id),
    { includeMetadataChanges: true },
    (s) => cb(s.exists() ? toBoutique(s.id, s.data()) : null, s.metadata.fromCache),
    onError,
  );
}

export function watchMember(boutiqueId: string, uid: string, cb: Watch<Member>, onError: (e: unknown) => void) {
  return onSnapshot(
    memberRef(boutiqueId, uid),
    { includeMetadataChanges: true },
    (s) => cb(s.exists() ? toMember(s.id, s.data()) : null, s.metadata.fromCache),
    onError,
  );
}

/** Tous les membres de la boutique, y compris ceux en attente (réservé aux membres actifs). */
export function watchMembers(boutiqueId: string, cb: (members: Member[]) => void, onError: (e: unknown) => void) {
  return onSnapshot(
    query(collection(getDb(), "boutiques", boutiqueId, "members"), orderBy("createdAt", "asc")),
    (s) => cb(s.docs.map((d) => toMember(d.id, d.data()))),
    onError,
  );
}

/* ---------- Compte ---------- */

/** Crée la fiche du compte juste après l'inscription (opération en ligne). */
export function createProfile(user: User): Promise<void> {
  return setDoc(userRef(user.uid), {
    email: user.email ?? "",
    name: user.displayName ?? "",
    boutiqueId: "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

/** Abandonne la boutique en attente pour en créer ou en rejoindre une autre. */
export function leaveBoutique(uid: string): Promise<void> {
  return updateDoc(userRef(uid), { boutiqueId: "", updatedAt: serverTimestamp() });
}

/* ---------- Création et adhésion (en ligne) ---------- */

export interface NewBoutique {
  name: string;
  ownerName: string;
  plan: Plan;
  currency: Currency;
  usdRateCdf: number;
  /** 0 si la boutique n'utilise pas l'euro. */
  eurRateCdf: number;
}

/**
 * Crée la boutique, son code d'invitation et le membre propriétaire en une seule écriture.
 * Si le code tiré existe déjà, les règles refusent l'écriture et on en tire un autre.
 */
export async function createBoutique(user: User, input: NewBoutique): Promise<string> {
  const db = getDb();
  let lastError: unknown;
  for (let attempt = 0; attempt < 5; attempt++) {
    const id = doc(collection(db, "boutiques")).id;
    const inviteCode = generateInviteCode();
    const batch = writeBatch(db);
    batch.set(boutiqueRef(id), {
      name: input.name.trim(),
      currency: input.currency,
      inviteCode,
      ownerUid: user.uid,
      usdRateCdf: input.usdRateCdf,
      usdRateUpdatedAt: serverTimestamp(),
      eurRateCdf: input.eurRateCdf,
      eurRateUpdatedAt: serverTimestamp(),
      paperWidthMm: 58,
      autoPrintTicket: false,
      plan: input.plan,
      billingCycle: "mensuel",
      // Les règles vérifient que l'essai dure bien 30 jours à partir de maintenant.
      trialEndsAt: Timestamp.fromMillis(trialEnd(Date.now())),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    batch.set(memberRef(id, user.uid), {
      email: user.email ?? "",
      name: input.ownerName.trim(),
      role: "proprietaire",
      status: "active",
      permissions: {},
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    batch.set(invitationRef(inviteCode), { boutiqueId: id, createdBy: user.uid, createdAt: serverTimestamp() });
    batch.set(
      userRef(user.uid),
      { email: user.email ?? "", name: input.ownerName.trim(), boutiqueId: id, updatedAt: serverTimestamp() },
      { merge: true },
    );
    try {
      await batch.commit();
      return id;
    } catch (e) {
      lastError = e;
      // Code déjà pris : on réessaie avec un autre. Toute autre erreur est remontée tout de suite.
      const taken = await getDocFromServer(invitationRef(inviteCode)).then(
        (s) => s.exists(),
        () => false,
      );
      if (!taken) throw e;
    }
  }
  throw lastError;
}

export class InviteNotFoundError extends Error {
  constructor() {
    super("Ce code d'invitation n'existe pas. Vérifiez-le auprès du propriétaire.");
  }
}

/** Demande à rejoindre une boutique : le membre reste « en attente » jusqu'à validation du propriétaire. */
export async function joinBoutique(user: User, rawCode: string, name: string): Promise<string> {
  const code = normalizeInviteCode(rawCode);
  if (!code) throw new InviteNotFoundError();
  const invitation = await getDocFromServer(invitationRef(code));
  if (!invitation.exists()) throw new InviteNotFoundError();
  const boutiqueId = String(invitation.data().boutiqueId);

  const batch = writeBatch(getDb());
  batch.set(memberRef(boutiqueId, user.uid), {
    email: user.email ?? "",
    name: name.trim(),
    role: "vendeur",
    status: "pending",
    permissions: {},
    // Les règles vérifient que ce code mène bien à cette boutique.
    inviteCode: code,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  batch.set(
    userRef(user.uid),
    { email: user.email ?? "", name: name.trim(), boutiqueId, updatedAt: serverTimestamp() },
    { merge: true },
  );
  await batch.commit();
  return boutiqueId;
}

/* ---------- Gestion de l'équipe (propriétaire, en ligne) ---------- */

export function updateMember(
  boutiqueId: string,
  uid: string,
  patch: Partial<Pick<Member, "role" | "status" | "permissions">>,
): Promise<void> {
  return updateDoc(memberRef(boutiqueId, uid), { ...patch, updatedAt: serverTimestamp() });
}

/** Le membre change son propre nom (fonctionne hors ligne). */
export function updateOwnName(boutiqueId: string, uid: string, name: string): void {
  track(updateDoc(memberRef(boutiqueId, uid), { name: name.trim(), updatedAt: serverTimestamp() }));
  track(updateDoc(userRef(uid), { name: name.trim(), updatedAt: serverTimestamp() }));
}

/* ---------- Réglages de la boutique (hors ligne) ---------- */

export function updateBoutique(
  id: string,
  patch: Partial<Pick<Boutique, "name" | "currency" | "paperWidthMm" | "autoPrintTicket">>,
  onError?: (e: unknown) => void,
): void {
  track(updateDoc(boutiqueRef(id), { ...patch, updatedAt: serverTimestamp() }), onError);
}

/** En-tête et pied du ticket (propriétaire seulement, fonctionne hors ligne). */
export function updateReceipt(id: string, receipt: ReceiptSettings, onError?: (e: unknown) => void): void {
  const t = (v?: string) => (v ?? "").trim();
  const clean = {
    logo: receipt.logo ?? null,
    address: t(receipt.address),
    phone: t(receipt.phone),
    rccm: t(receipt.rccm),
    idNat: t(receipt.idNat),
    taxId: t(receipt.taxId),
    footer: t(receipt.footer),
    link: t(receipt.link),
    linkLabel: t(receipt.linkLabel),
  };
  track(updateDoc(boutiqueRef(id), { receipt: clean, updatedAt: serverTimestamp() }), onError);
}

/** Pendant l'essai seulement : le propriétaire choisit une autre formule (fonctionne hors ligne). */
export function changePlan(id: string, plan: Plan, onError?: (e: unknown) => void): void {
  track(updateDoc(boutiqueRef(id), { plan, updatedAt: serverTimestamp() }), onError);
}

/** Taux du jour d'une devise (FC pour 1 $ ou pour 1 €). */
export function updateRate(id: string, currency: "USD" | "EUR", value: number, onError?: (e: unknown) => void): void {
  const fields = currency === "USD" ? { usdRateCdf: value, usdRateUpdatedAt: serverTimestamp() } : { eurRateCdf: value, eurRateUpdatedAt: serverTimestamp() };
  track(updateDoc(boutiqueRef(id), { ...fields, updatedAt: serverTimestamp() }), onError);
}

/** Les taux du jour de la boutique, pour les conversions. */
export function ratesOf(b: Pick<Boutique, "usdRateCdf" | "eurRateCdf">): Rates {
  return { USD: b.usdRateCdf, EUR: b.eurRateCdf };
}

/** Devises proposées dans cette boutique : FC et $ toujours, € si son taux est saisi ou si les prix sont en euros. */
export function currenciesOf(b: Pick<Boutique, "currency" | "eurRateCdf">): Currency[] {
  return CURRENCY_LIST.filter((c) => c !== "EUR" || b.currency === "EUR" || b.eurRateCdf > 0);
}
