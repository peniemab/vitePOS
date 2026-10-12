/**
 * Inventaires, sous `boutiques/{id}/inventories/{id}` avec une ligne par produit compté
 * (`…/lines/{produitId}`). On peut compter tout ou partie du stock, à plusieurs et hors ligne.
 * La validation applique les écarts par increment, avec des mouvements « inventaire ».
 */
import {
  collection,
  doc,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
  type DocumentData,
} from "firebase/firestore";
import { notifications } from "@mantine/notifications";
import { getDb } from "./firebase";
import { errorMessage } from "./errors";
import { track } from "./sync";
import type { Actor } from "./products";
import type { CountLine, InventoryGap } from "../lib/inventory";
import { isUnit, type Product } from "../lib/products";

export interface Inventory {
  id: string;
  label: string;
  status: "en_cours" | "validee" | "annulee";
  createdByName: string;
  createdAtMs: number;
  validatedByName: string;
  gapsCount: number;
  missingValue: number;
  surplusValue: number;
}

const invCol = (b: string) => collection(getDb(), "boutiques", b, "inventories");
const linesCol = (b: string, inv: string) => collection(getDb(), "boutiques", b, "inventories", inv, "lines");
const productsCol = (b: string) => collection(getDb(), "boutiques", b, "products");
const movementsCol = (b: string) => collection(getDb(), "boutiques", b, "stockMovements");

function num(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

function ms(v: unknown): number {
  return v && typeof v === "object" && "toMillis" in v ? (v as { toMillis(): number }).toMillis() : 0;
}

function toInventory(id: string, d: DocumentData): Inventory {
  return {
    id,
    label: String(d.label ?? ""),
    status: d.status === "validee" || d.status === "annulee" ? d.status : "en_cours",
    createdByName: String(d.createdByName ?? ""),
    createdAtMs: ms(d.createdAt) || num(d.clientAtMs),
    validatedByName: String(d.validatedByName ?? ""),
    gapsCount: num(d.gapsCount),
    missingValue: num(d.missingValue),
    surplusValue: num(d.surplusValue),
  };
}

/** Les 20 derniers inventaires, le plus récent d'abord. */
export function watchInventories(boutiqueId: string, cb: (list: Inventory[]) => void, onError: (e: unknown) => void) {
  return onSnapshot(
    query(invCol(boutiqueId), orderBy("createdAt", "desc"), limit(20)),
    (s) => cb(s.docs.map((d) => toInventory(d.id, d.data()))),
    onError,
  );
}

export function watchCountLines(boutiqueId: string, inventoryId: string, cb: (lines: Map<string, CountLine>) => void, onError: (e: unknown) => void) {
  return onSnapshot(
    linesCol(boutiqueId, inventoryId),
    (s) =>
      cb(
        new Map(
          s.docs.map((d) => {
            const v = d.data();
            const line: CountLine = {
              productId: d.id,
              name: String(v.name ?? ""),
              unit: isUnit(v.unit) ? v.unit : "u",
              theoretical: num(v.theoretical),
              counted: num(v.counted),
            };
            return [d.id, line];
          }),
        ),
      ),
    onError,
  );
}

function onWriteError(e: unknown) {
  notifications.show({ color: "red", title: "Inventaire refusé par le serveur", message: errorMessage(e), autoClose: false });
}

export function startInventory(actor: Actor, label: string): string {
  const ref = doc(invCol(actor.boutiqueId));
  track(
    setDoc(ref, {
      label: label.trim().slice(0, 80),
      status: "en_cours",
      createdBy: actor.uid,
      createdByName: actor.memberName,
      createdAt: serverTimestamp(),
      clientAtMs: Date.now(),
    }),
    onWriteError,
  );
  return ref.id;
}

/** Enregistre le comptage d'un produit ; le stock affiché à cet instant sert de référence. */
export function countProduct(actor: Actor, inventoryId: string, product: Product, counted: number): void {
  track(
    setDoc(doc(linesCol(actor.boutiqueId, inventoryId), product.id), {
      name: product.name,
      unit: product.unit,
      theoretical: product.stock,
      counted,
      countedBy: actor.uid,
      countedByName: actor.memberName,
      countedAt: serverTimestamp(),
    }),
    onWriteError,
  );
}

const CHUNK = 200;

/** Applique les écarts (par lots de 200 produits) puis marque l'inventaire comme validé. */
export function validateInventory(
  actor: Actor,
  inventoryId: string,
  gaps: InventoryGap[],
  totals: { missingValue: number; surplusValue: number },
): void {
  const chunks: InventoryGap[][] = [];
  for (let i = 0; i < gaps.length; i += CHUNK) chunks.push(gaps.slice(i, i + CHUNK));
  if (!chunks.length) chunks.push([]);

  chunks.forEach((chunk, index) => {
    const batch = writeBatch(getDb());
    if (chunk.length) {
      const mref = doc(movementsCol(actor.boutiqueId));
      batch.set(mref, {
        type: "inventaire",
        productIds: chunk.map((g) => g.productId),
        deltas: Object.fromEntries(chunk.map((g) => [g.productId, g.delta])),
        names: Object.fromEntries(chunk.map((g) => [g.productId, g.name])),
        reason: "Inventaire",
        refId: inventoryId,
        uid: actor.uid,
        memberName: actor.memberName,
        createdAt: serverTimestamp(),
        clientAtMs: Date.now(),
      });
      for (const g of chunk) {
        batch.update(doc(productsCol(actor.boutiqueId), g.productId), {
          stock: increment(g.delta),
          lastMovementId: mref.id,
          updatedAt: serverTimestamp(),
          updatedBy: actor.uid,
        });
      }
    }
    if (index === chunks.length - 1) {
      batch.update(doc(invCol(actor.boutiqueId), inventoryId), {
        status: "validee",
        validatedBy: actor.uid,
        validatedByName: actor.memberName,
        validatedAt: serverTimestamp(),
        gapsCount: gaps.length,
        missingValue: totals.missingValue,
        surplusValue: totals.surplusValue,
      });
    }
    track(batch.commit(), onWriteError);
  });
}

export function cancelInventory(actor: Actor, inventoryId: string): void {
  track(
    updateDoc(doc(invCol(actor.boutiqueId), inventoryId), {
      status: "annulee",
      validatedBy: actor.uid,
      validatedByName: actor.memberName,
      validatedAt: serverTimestamp(),
    }),
    onWriteError,
  );
}
