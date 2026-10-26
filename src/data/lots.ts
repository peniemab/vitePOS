/**
 * Lots (dates de péremption), sous `boutiques/{id}/lots/{id}` : { productId, expiry, quantity, movementId,
 * uid, memberName, createdAt, clientAtMs }. Un lot est créé avec l'arrivage, dans la même écriture groupée,
 * et ne change plus ensuite : ce qui en reste est estimé à partir du stock (src/lib/lots.ts).
 */
import { collection, doc, onSnapshot, query, serverTimestamp, where, type DocumentData, type WriteBatch } from "firebase/firestore";
import { useEffect, useState } from "react";
import { getDb } from "./firebase";
import type { Actor } from "./products";
import { isDay, type Lot } from "../lib/lots";
import { dayKey } from "../lib/cart";
import { shiftDay } from "../lib/cashday";

const lotsCol = (boutiqueId: string) => collection(getDb(), "boutiques", boutiqueId, "lots");

/** Ajoute un lot à l'écriture groupée d'un arrivage. */
export function addLot(batch: WriteBatch, actor: Actor, productId: string, expiry: string, quantity: number, movementId: string): void {
  if (!isDay(expiry) || quantity <= 0) return;
  batch.set(doc(lotsCol(actor.boutiqueId)), {
    productId,
    expiry,
    quantity,
    movementId,
    uid: actor.uid,
    memberName: actor.memberName,
    createdAt: serverTimestamp(),
    clientAtMs: Date.now(),
  });
}

function toLot(id: string, d: DocumentData): Lot {
  const created = d.createdAt && typeof d.createdAt.toMillis === "function" ? d.createdAt.toMillis() : 0;
  return {
    id,
    productId: String(d.productId ?? ""),
    expiry: String(d.expiry ?? ""),
    quantity: typeof d.quantity === "number" ? d.quantity : 0,
    receivedAtMs: created || (typeof d.clientAtMs === "number" ? d.clientAtMs : 0),
  };
}

/** Lots dont la date n'est pas passée depuis plus d'un an (les plus vieux ne peuvent plus être en rayon). */
export function watchLots(boutiqueId: string, cb: (lots: Lot[]) => void, onError: (e: unknown) => void): () => void {
  const since = shiftDay(dayKey(Date.now()), -365);
  return onSnapshot(
    query(lotsCol(boutiqueId), where("expiry", ">=", since)),
    (s) => cb(s.docs.map((d) => toLot(d.id, d.data())).filter((l) => isDay(l.expiry))),
    onError,
  );
}

/** Lots de la boutique, suivis en continu (marche hors ligne sur le cache). */
export function useLots(boutiqueId: string): Lot[] | undefined {
  const [lots, setLots] = useState<Lot[]>();
  useEffect(() => watchLots(boutiqueId, setLots, () => setLots([])), [boutiqueId]);
  return lots;
}
