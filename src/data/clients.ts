/** Clients de la boutique, sous `boutiques/{id}/clients/{id}`. Leurs totaux d'achats suivent les ventes (increment). */
import { useEffect, useState } from "react";
import { collection, doc, onSnapshot, serverTimestamp, setDoc, updateDoc, type DocumentData } from "firebase/firestore";
import { notifications } from "@mantine/notifications";
import { getDb } from "./firebase";
import { errorMessage } from "./errors";
import { track } from "./sync";
import { useReady } from "./session";
import type { Actor } from "./products";
import type { Client } from "../lib/clients";

const clientsCol = (b: string) => collection(getDb(), "boutiques", b, "clients");

function num(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

function toClient(id: string, d: DocumentData): Client {
  const last = d.lastPurchaseAt;
  return {
    id,
    name: String(d.name ?? ""),
    phone: String(d.phone ?? ""),
    notes: String(d.notes ?? ""),
    purchaseCount: num(d.purchaseCount),
    totalSpent: num(d.totalSpent),
    lastPurchaseAtMs: last && typeof last === "object" && "toMillis" in last ? (last as { toMillis(): number }).toMillis() : 0,
  };
}

/** Tous les clients, triés par nom (écoutés en continu, disponibles hors ligne). */
export function useClients(): { clients: Client[] | undefined; error?: string } {
  const { boutique } = useReady();
  const [clients, setClients] = useState<Client[]>();
  const [error, setError] = useState<string>();
  useEffect(
    () =>
      onSnapshot(
        clientsCol(boutique.id),
        (s) => setClients(s.docs.map((d) => toClient(d.id, d.data())).sort((a, b) => a.name.localeCompare(b.name, "fr"))),
        (e) => setError(errorMessage(e)),
      ),
    [boutique.id],
  );
  return { clients, error };
}

function onWriteError(e: unknown) {
  notifications.show({ color: "red", title: "Client refusé par le serveur", message: errorMessage(e), autoClose: false });
}

export function createClient(actor: Actor, input: { name: string; phone: string; notes: string }): string {
  const ref = doc(clientsCol(actor.boutiqueId));
  track(
    setDoc(ref, {
      ...input,
      purchaseCount: 0,
      totalSpent: 0,
      createdAt: serverTimestamp(),
      createdBy: actor.uid,
      updatedAt: serverTimestamp(),
      updatedBy: actor.uid,
    }),
    onWriteError,
  );
  return ref.id;
}

export function updateClient(actor: Actor, id: string, input: { name: string; phone: string; notes: string }): void {
  track(updateDoc(doc(clientsCol(actor.boutiqueId), id), { ...input, updatedAt: serverTimestamp(), updatedBy: actor.uid }), onWriteError);
}
