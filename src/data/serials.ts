/**
 * Numéros de série et IMEI, sous `boutiques/{id}/serials/{numéro}` (le numéro sert d'identifiant : il ne
 * peut exister qu'une fois par boutique) : { productId, productName, status (en_stock | vendu | retire),
 * movementId, saleId, soldDay, warrantyUntil, receivedAt, updatedAt, updatedBy }.
 * Arrivage, vente, annulation et sortie (casse, don) les modifient dans la même écriture groupée que le stock.
 */
import { collection, doc, getDoc, onSnapshot, query, serverTimestamp, where, type DocumentData, type WriteBatch } from "firebase/firestore";
import { useEffect, useState } from "react";
import { getDb } from "./firebase";
import type { Actor } from "./products";

export type SerialStatus = "en_stock" | "vendu" | "retire";

export interface Serial {
  serial: string;
  productId: string;
  productName: string;
  status: SerialStatus;
  saleId: string;
  soldDay: string;
  warrantyUntil: string;
}

const serialsCol = (boutiqueId: string) => collection(getDb(), "boutiques", boutiqueId, "serials");
const serialRef = (boutiqueId: string, serial: string) => doc(serialsCol(boutiqueId), serial);

function toSerial(id: string, d: DocumentData): Serial {
  const status = d.status === "vendu" || d.status === "retire" ? d.status : "en_stock";
  return {
    serial: id,
    productId: String(d.productId ?? ""),
    productName: String(d.productName ?? ""),
    status,
    saleId: String(d.saleId ?? ""),
    soldDay: String(d.soldDay ?? ""),
    warrantyUntil: String(d.warrantyUntil ?? ""),
  };
}

const signed = (actor: Actor) => ({ updatedAt: serverTimestamp(), updatedBy: actor.uid });

/** Arrivage : un document par appareil reçu. */
export function addSerials(batch: WriteBatch, actor: Actor, product: { id: string; name: string }, serials: string[], movementId: string): void {
  for (const s of serials) {
    batch.set(serialRef(actor.boutiqueId, s), {
      productId: product.id,
      productName: product.name,
      status: "en_stock",
      movementId,
      saleId: "",
      soldDay: "",
      warrantyUntil: "",
      receivedAt: serverTimestamp(),
      ...signed(actor),
    });
  }
}

/** Vente : l'appareil quitte le stock, avec sa fin de garantie. */
export function markSold(batch: WriteBatch, actor: Actor, serial: string, saleId: string, soldDay: string, warrantyUntil: string): void {
  batch.update(serialRef(actor.boutiqueId, serial), { status: "vendu", saleId, soldDay, warrantyUntil, ...signed(actor) });
}

/** Annulation de la vente : l'appareil revient en stock. */
export function markReturned(batch: WriteBatch, actor: Actor, serial: string): void {
  batch.update(serialRef(actor.boutiqueId, serial), { status: "en_stock", saleId: "", soldDay: "", warrantyUntil: "", ...signed(actor) });
}

/** Casse ou don : l'appareil sort du stock sans être vendu. */
export function markRemoved(batch: WriteBatch, actor: Actor, serial: string): void {
  batch.update(serialRef(actor.boutiqueId, serial), { status: "retire", ...signed(actor) });
}

/** Les appareils en stock, de toute la boutique (pour la caisse et les sorties). */
export function watchSerialsInStock(boutiqueId: string, cb: (serials: Serial[]) => void, onError: (e: unknown) => void): () => void {
  return onSnapshot(
    query(serialsCol(boutiqueId), where("status", "==", "en_stock")),
    (s) => cb(s.docs.map((d) => toSerial(d.id, d.data()))),
    onError,
  );
}

/** Retrouve un appareil par son numéro (garantie, retour). `null` s'il n'existe pas dans cette boutique. */
export async function findSerial(boutiqueId: string, serial: string): Promise<Serial | null> {
  const snap = await getDoc(serialRef(boutiqueId, serial));
  return snap.exists() ? toSerial(snap.id, snap.data()) : null;
}

/** Appareils en stock de la boutique, suivis en continu (marche hors ligne sur le cache). */
export function useSerialsInStock(boutiqueId: string): Serial[] | undefined {
  const [serials, setSerials] = useState<Serial[]>();
  useEffect(() => watchSerialsInStock(boutiqueId, setSerials, () => setSerials([])), [boutiqueId]);
  return serials;
}
