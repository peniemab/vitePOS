/**
 * Dépôts, sous `boutiques/{id}/deposits/{id}` (pressing, couture, réparation…).
 *
 * Tout s'enregistre en écritures groupées, sans attendre le réseau. Chaque paiement est une vente
 * ordinaire liée au dépôt (`depositId`) : le « déjà payé » du dépôt suit ces ventes par increment,
 * et le dernier paiement est noté dans `lastSaleId` (les règles vérifient le lien).
 */
import { useEffect, useState } from "react";
import { collection, deleteField, doc, increment, limit, onSnapshot, orderBy, query, serverTimestamp, where, writeBatch, type DocumentData, type WriteBatch } from "firebase/firestore";
import { notifications } from "@mantine/notifications";
import { getDb } from "./firebase";
import { errorMessage } from "./errors";
import { track } from "./sync";
import { useReady } from "./session";
import { writeSale } from "./sales";
import type { Actor } from "./products";
import { computeTotals, dayKey, type CartLine, type PaymentInput, type PaymentResult } from "../lib/cart";
import { isCurrency, type Currency } from "../lib/fx";
import { isUnit } from "../lib/products";
import { acompteLine, balance, depositLines, pickupLines, type Deposit, type DepositPayMode, type DepositStatus } from "../lib/deposits";
import type { Sale } from "../lib/sales";

const depositsCol = (b: string) => collection(getDb(), "boutiques", b, "deposits");

function ms(v: unknown): number {
  return v && typeof v === "object" && "toMillis" in v ? (v as { toMillis(): number }).toMillis() : 0;
}

function num(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

const STATUSES: DepositStatus[] = ["recu", "pret", "retire", "annule"];

function toDeposit(id: string, d: DocumentData, synced: boolean): Deposit {
  const createdAtMs = ms(d.createdAt) || num(d.clientAtMs);
  return {
    id,
    clientId: String(d.clientId ?? ""),
    clientName: String(d.clientName ?? ""),
    clientPhone: String(d.clientPhone ?? ""),
    lines: (Array.isArray(d.lines) ? d.lines : []).map((l: Record<string, unknown>) => ({
      productId: String(l.productId ?? ""),
      name: String(l.name ?? ""),
      unit: isUnit(l.unit) ? l.unit : "u",
      unitPrice: num(l.unitPrice),
      quantity: num(l.quantity),
      lineTotal: num(l.lineTotal),
    })),
    notes: String(d.notes ?? ""),
    subtotal: num(d.subtotal),
    discount: num(d.discount),
    total: num(d.total),
    currency: isCurrency(d.currency) ? d.currency : "CDF",
    paid: num(d.paid),
    dueDay: String(d.dueDay ?? ""),
    status: STATUSES.includes(d.status) ? d.status : "recu",
    uid: String(d.uid ?? ""),
    memberName: String(d.memberName ?? ""),
    dayKey: String(d.dayKey ?? (createdAtMs ? dayKey(createdAtMs) : "")),
    createdAtMs,
    readyAtMs: ms(d.readyAt),
    pickedUpAtMs: ms(d.pickedUpAt),
    pickedUpByName: String(d.pickedUpByName ?? ""),
    cancelReason: String(d.cancelReason ?? ""),
    synced,
  };
}

/**
 * Les dépôts en cours (tous) et les 100 derniers déposés, retirés ou annulés compris.
 * Deux requêtes simples : pas d'index composite à créer.
 */
export function useDeposits(): { deposits: Deposit[] | undefined; error?: string } {
  const { boutique } = useReady();
  const [open, setOpen] = useState<Deposit[]>();
  const [recent, setRecent] = useState<Deposit[]>();
  const [error, setError] = useState<string>();
  useEffect(() => {
    const onErr = (e: unknown) => setError(errorMessage(e));
    const col = depositsCol(boutique.id);
    const map = (docs: { id: string; data(): DocumentData; metadata: { hasPendingWrites: boolean } }[]) =>
      docs.map((d) => toDeposit(d.id, d.data(), !d.metadata.hasPendingWrites));
    const a = onSnapshot(query(col, where("status", "in", ["recu", "pret"])), { includeMetadataChanges: true }, (s) => setOpen(map(s.docs)), onErr);
    const b = onSnapshot(query(col, orderBy("createdAt", "desc"), limit(100)), { includeMetadataChanges: true }, (s) => setRecent(map(s.docs)), onErr);
    return () => {
      a();
      b();
    };
  }, [boutique.id]);
  if (!open || !recent) return { deposits: undefined, error };
  const byId = new Map<string, Deposit>();
  for (const d of [...recent, ...open]) byId.set(d.id, d);
  return { deposits: [...byId.values()], error };
}

export function watchDeposit(boutiqueId: string, id: string, cb: (d: Deposit | null) => void, onError: (e: unknown) => void) {
  return onSnapshot(
    doc(depositsCol(boutiqueId), id),
    { includeMetadataChanges: true },
    (s) => cb(s.exists() ? toDeposit(s.id, s.data(), !s.metadata.hasPendingWrites) : null),
    onError,
  );
}

function onWriteError(e: unknown) {
  notifications.show({ color: "red", title: "Dépôt refusé par le serveur", message: errorMessage(e), autoClose: false });
}

export interface NewDeposit {
  cart: CartLine[];
  discountPercent: number;
  client: { id: string; name: string; phone: string };
  notes: string;
  dueDay: string;
  mode: DepositPayMode;
  /** Montant de l'acompte (mode « acompte »). */
  acompte?: number;
  /** Paiement encaissé maintenant (modes « total » et « acompte »). */
  payment?: { input: PaymentInput; result: PaymentResult };
}

/** Enregistre le dépôt, et la vente du paiement encaissé tout de suite s'il y en a un. Renvoie l'identifiant du dépôt. */
export function createDeposit(actor: Actor, currency: Currency, n: NewDeposit): string {
  const batch = writeBatch(getDb());
  const ref = doc(depositsCol(actor.boutiqueId));
  const now = Date.now();
  const totals = computeTotals(n.cart, n.discountPercent, currency);
  const client = { id: n.client.id, name: n.client.name };
  let paid = 0;
  let saleId = "";
  if (n.payment && n.mode === "total") {
    saleId = writeSale(batch, actor, currency, n.cart, n.discountPercent, n.payment.input, n.payment.result, client, { id: ref.id, step: "total" });
    paid = totals.total;
  } else if (n.payment && n.mode === "acompte" && n.acompte) {
    saleId = writeSale(batch, actor, currency, [acompteLine(n.acompte, ref.id)], 0, n.payment.input, n.payment.result, client, { id: ref.id, step: "acompte" });
    paid = n.acompte;
  }
  batch.set(ref, {
    clientId: n.client.id,
    clientName: n.client.name,
    clientPhone: n.client.phone,
    lines: depositLines(n.cart, currency),
    notes: n.notes.trim().slice(0, 500),
    subtotal: totals.subtotal,
    discount: totals.discount,
    total: totals.total,
    currency,
    paid,
    lastSaleId: saleId,
    dueDay: n.dueDay,
    status: "recu",
    uid: actor.uid,
    memberName: actor.memberName,
    dayKey: dayKey(now),
    createdAt: serverTimestamp(),
    clientAtMs: now,
    updatedAt: serverTimestamp(),
  });
  track(batch.commit(), onWriteError);
  return ref.id;
}

function setStatus(actor: Actor, d: Deposit, status: DepositStatus, extra: Record<string, unknown>) {
  const batch = writeBatch(getDb());
  batch.update(doc(depositsCol(actor.boutiqueId), d.id), { status, ...extra, updatedAt: serverTimestamp() });
  track(batch.commit(), onWriteError);
}

/** Le travail est fini : le client peut venir. */
export function markReady(actor: Actor, d: Deposit): void {
  setStatus(actor, d, "pret", { readyAt: serverTimestamp(), readyBy: actor.uid, readyByName: actor.memberName });
}

/** Retour en « en cours » (marqué prêt par erreur). */
export function markNotReady(actor: Actor, d: Deposit): void {
  setStatus(actor, d, "recu", { readyAt: deleteField(), readyBy: deleteField(), readyByName: deleteField() });
}

/**
 * Le client récupère ses affaires. S'il reste à payer, la vente du solde est enregistrée en même temps.
 * Renvoie l'identifiant de cette vente (vide si tout était déjà payé).
 */
export function pickUp(actor: Actor, d: Deposit, payment?: { input: PaymentInput; result: PaymentResult }): string {
  const batch = writeBatch(getDb());
  const rest = balance(d, d.currency);
  let saleId = "";
  if (rest > 0) {
    if (!payment) throw new Error("Paiement du solde manquant.");
    const client = d.clientId ? { id: d.clientId, name: d.clientName } : undefined;
    saleId = writeSale(batch, actor, d.currency, pickupLines(d), 0, payment.input, payment.result, client, { id: d.id, step: "retrait" });
  }
  batch.update(doc(depositsCol(actor.boutiqueId), d.id), {
    status: "retire",
    ...(saleId ? { paid: increment(rest), lastSaleId: saleId } : {}),
    pickedUpAt: serverTimestamp(),
    pickedUpBy: actor.uid,
    pickedUpByName: actor.memberName,
    updatedAt: serverTimestamp(),
  });
  track(batch.commit(), onWriteError);
  return saleId;
}

/** Annule un dépôt sur lequel rien n'a été payé (sinon, annuler d'abord la vente de l'acompte). */
export function cancelDeposit(actor: Actor, d: Deposit, reason: string): void {
  setStatus(actor, d, "annule", {
    cancelReason: reason.trim().slice(0, 200),
    cancelledBy: actor.uid,
    cancelledByName: actor.memberName,
    cancelledAt: serverTimestamp(),
  });
}

/** Appelé par l'annulation d'une vente liée à un dépôt : retire son montant du « déjà payé ». */
export function unpayDeposit(batch: WriteBatch, actor: Actor, sale: Sale): void {
  batch.update(doc(depositsCol(actor.boutiqueId), sale.depositId), {
    paid: increment(-sale.total),
    lastSaleId: sale.id,
    // Le solde payé au retrait est annulé : les affaires sont de nouveau à rendre.
    ...(sale.depositStep === "retrait" ? { status: "pret", pickedUpAt: deleteField(), pickedUpBy: deleteField(), pickedUpByName: deleteField() } : {}),
    updatedAt: serverTimestamp(),
  });
}

/** Le catalogue contient-il au moins un service ? (affiche l'entrée « Dépôts ») */
export function hasServices(products: { isService: boolean; archived?: boolean }[] | undefined): boolean {
  return !!products?.some((p) => p.isService && !p.archived);
}
