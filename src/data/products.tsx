/**
 * Catalogue et stock de la boutique, sous `boutiques/{id}/…` :
 * - `products/{id}` : fiche produit et stock courant ;
 * - `productCosts/{id}` : prix d'achat, lisible seulement par ceux qui voient les marges ;
 * - `stockMovements/{id}` : journal des mouvements. Un mouvement peut couvrir plusieurs produits
 *   (`deltas`), par exemple un import ou une vente.
 *
 * Le stock n'est jamais écrasé : il varie avec `increment()`, accompagné d'un mouvement dans la
 * même écriture groupée. Deux caisses hors ligne s'additionnent donc au lieu de s'écraser, et les
 * règles refusent toute variation de stock sans mouvement correspondant.
 */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  collection,
  doc,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
  writeBatch,
  type DocumentData,
  type WriteBatch,
} from "firebase/firestore";
import { notifications } from "@mantine/notifications";
import { getDb } from "./firebase";
import { errorMessage } from "./errors";
import { track } from "./sync";
import { useReady } from "./session";
import type { ImportPlan } from "../lib/csv";
import {
  DEFAULT_ALERT_THRESHOLD,
  DEFAULT_CATEGORY,
  isUnit,
  MOVEMENT_LABELS,
  type ManualMovementType,
  type Product,
  type ProductInput,
  type StockMovementType,
} from "../lib/products";

export interface StockMovement {
  id: string;
  type: StockMovementType;
  deltas: Record<string, number>;
  names: Record<string, string>;
  reason: string;
  memberName: string;
  createdAtMs: number;
}

/** Qui écrit : sert à signer les écritures. */
export interface Actor {
  boutiqueId: string;
  uid: string;
  memberName: string;
}

/* ---------- Références ---------- */

const productsCol = (b: string) => collection(getDb(), "boutiques", b, "products");
const costsCol = (b: string) => collection(getDb(), "boutiques", b, "productCosts");
const movementsCol = (b: string) => collection(getDb(), "boutiques", b, "stockMovements");

function ms(v: unknown): number {
  return v && typeof v === "object" && "toMillis" in v ? (v as { toMillis(): number }).toMillis() : 0;
}

function num(v: unknown, fallback = 0): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

function toProduct(id: string, d: DocumentData): Product {
  return {
    id,
    name: String(d.name ?? ""),
    category: String(d.category ?? DEFAULT_CATEGORY),
    sellPrice: num(d.sellPrice),
    unit: isUnit(d.unit) ? d.unit : "u",
    stock: num(d.stock),
    alertThreshold: num(d.alertThreshold, DEFAULT_ALERT_THRESHOLD),
    barcode: String(d.barcode ?? ""),
    favorite: d.favorite === true,
    archived: d.archived === true,
    updatedAtMs: ms(d.updatedAt),
  };
}

function toMovement(id: string, d: DocumentData): StockMovement {
  return {
    id,
    type: (d.type in MOVEMENT_LABELS ? d.type : "correction") as StockMovementType,
    deltas: (d.deltas ?? {}) as Record<string, number>,
    names: (d.names ?? {}) as Record<string, string>,
    reason: String(d.reason ?? ""),
    memberName: String(d.memberName ?? ""),
    // Hors ligne, l'heure du serveur n'est pas encore connue : on garde celle de l'appareil.
    createdAtMs: ms(d.createdAt) || num(d.clientAtMs),
  };
}

/* ---------- Lecture : catalogue écouté en continu ---------- */

interface Catalog {
  products: Product[] | undefined;
  /** Prix d'achat par produit ; `undefined` si l'utilisateur ne voit pas les marges. */
  costs: Map<string, number> | undefined;
  error?: string;
}

const CatalogContext = createContext<Catalog>({ products: undefined, costs: undefined });

/** Le prix d'achat est visible par ceux qui fixent les prix ou consultent les rapports. */
export function useCanSeeCosts(): boolean {
  const { permissions } = useReady();
  return permissions.editPrices || permissions.viewReports;
}

export function CatalogProvider({ children }: { children: ReactNode }) {
  const { boutique } = useReady();
  const canSeeCosts = useCanSeeCosts();
  const [products, setProducts] = useState<Product[]>();
  const [costs, setCosts] = useState<Map<string, number>>();
  const [error, setError] = useState<string>();

  useEffect(
    () =>
      onSnapshot(
        productsCol(boutique.id),
        (s) => {
          setProducts(s.docs.map((d) => toProduct(d.id, d.data())));
          setError(undefined);
        },
        (e) => setError(errorMessage(e)),
      ),
    [boutique.id],
  );

  useEffect(() => {
    setCosts(undefined);
    if (!canSeeCosts) return;
    return onSnapshot(
      costsCol(boutique.id),
      (s) => setCosts(new Map(s.docs.map((d) => [d.id, num(d.data().buyPrice)]))),
      () => setCosts(new Map()),
    );
  }, [boutique.id, canSeeCosts]);

  const value = useMemo(() => ({ products, costs, error }), [products, costs, error]);
  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog(): Catalog {
  return useContext(CatalogContext);
}

/** Les 50 derniers mouvements d'un produit (fonctionne hors ligne sur le cache). */
export function watchProductHistory(
  boutiqueId: string,
  productId: string,
  cb: (movements: StockMovement[]) => void,
  onError: (e: unknown) => void,
): () => void {
  return onSnapshot(
    query(movementsCol(boutiqueId), where("productIds", "array-contains", productId), orderBy("createdAt", "desc"), limit(50)),
    (s) => cb(s.docs.map((d) => toMovement(d.id, d.data()))),
    onError,
  );
}

/* ---------- Écritures (hors ligne, jamais attendues) ---------- */

function onWriteError(e: unknown) {
  notifications.show({ color: "red", title: "Enregistrement refusé par le serveur", message: errorMessage(e), autoClose: false });
}

/** Identifiant Firestore généré sur l'appareil (fonctionne hors ligne). */
function newId(col: ReturnType<typeof productsCol>): string {
  return doc(col).id;
}

interface MovementLine {
  productId: string;
  name: string;
  delta: number;
}

/**
 * Ajoute au lot un mouvement couvrant plusieurs produits et renvoie son identifiant,
 * à recopier dans `lastMovementId` de chaque produit modifié.
 */
function addMovement(batch: WriteBatch, actor: Actor, type: StockMovementType, lines: MovementLine[], reason = ""): string {
  const ref = doc(movementsCol(actor.boutiqueId));
  batch.set(ref, {
    type,
    productIds: lines.map((l) => l.productId),
    deltas: Object.fromEntries(lines.map((l) => [l.productId, l.delta])),
    names: Object.fromEntries(lines.map((l) => [l.productId, l.name])),
    reason: reason.trim().slice(0, 200),
    uid: actor.uid,
    memberName: actor.memberName,
    createdAt: serverTimestamp(),
    clientAtMs: Date.now(),
  });
  return ref.id;
}

function signed(actor: Actor) {
  return { updatedAt: serverTimestamp(), updatedBy: actor.uid };
}

function setCost(batch: WriteBatch, actor: Actor, productId: string, buyPrice: number) {
  batch.set(doc(costsCol(actor.boutiqueId), productId), { buyPrice, ...signed(actor) });
}

export function createProduct(actor: Actor, input: ProductInput, opts: { stock: number; buyPrice?: number }): string {
  const batch = writeBatch(getDb());
  const id = newId(productsCol(actor.boutiqueId));
  const movementId =
    opts.stock !== 0
      ? addMovement(batch, actor, "reappro", [{ productId: id, name: input.name, delta: opts.stock }], "Stock initial")
      : "";
  batch.set(doc(productsCol(actor.boutiqueId), id), {
    ...input,
    stock: opts.stock,
    archived: false,
    lastMovementId: movementId,
    createdAt: serverTimestamp(),
    createdBy: actor.uid,
    ...signed(actor),
  });
  if (opts.buyPrice != null) setCost(batch, actor, id, opts.buyPrice);
  track(batch.commit(), onWriteError);
  return id;
}

/**
 * Modifie une fiche. `stockTarget` corrige le stock vers une valeur précise :
 * l'écart avec le stock affiché est enregistré comme mouvement de correction.
 */
export function updateProduct(
  actor: Actor,
  product: Product,
  input: ProductInput,
  opts: { buyPrice?: number; stockTarget?: number } = {},
): void {
  const batch = writeBatch(getDb());
  const patch: Record<string, unknown> = { ...input, ...signed(actor) };
  const delta = opts.stockTarget == null ? 0 : opts.stockTarget - product.stock;
  if (delta !== 0) {
    patch.stock = increment(delta);
    patch.lastMovementId = addMovement(
      batch,
      actor,
      "correction",
      [{ productId: product.id, name: input.name, delta }],
      "Correction depuis la fiche produit",
    );
  }
  batch.update(doc(productsCol(actor.boutiqueId), product.id), patch);
  if (opts.buyPrice != null) setCost(batch, actor, product.id, opts.buyPrice);
  track(batch.commit(), onWriteError);
}

export function setArchived(actor: Actor, productId: string, archived: boolean): void {
  const batch = writeBatch(getDb());
  batch.update(doc(productsCol(actor.boutiqueId), productId), { archived, ...signed(actor) });
  track(batch.commit(), onWriteError);
}

/** Réapprovisionnement, casse, don ou correction saisis à la main (`delta` déjà signé). */
export function adjustStock(actor: Actor, product: Product, type: ManualMovementType, delta: number, reason: string): void {
  if (delta === 0) return;
  const batch = writeBatch(getDb());
  const movementId = addMovement(batch, actor, type, [{ productId: product.id, name: product.name, delta }], reason);
  batch.update(doc(productsCol(actor.boutiqueId), product.id), {
    stock: increment(delta),
    lastMovementId: movementId,
    ...signed(actor),
  });
  track(batch.commit(), onWriteError);
}

/** Au plus 500 écritures par lot : produit + prix d'achat + un mouvement par lot. */
const IMPORT_CHUNK = 200;

/** Applique un plan d'import par lots (fonctionne hors ligne ; l'envoi se fait au retour du réseau). */
export function importProducts(actor: Actor, plan: ImportPlan, canEditStock: boolean): { created: number; updated: number } {
  type Op =
    | { kind: "create"; id: string; item: ImportPlan["creates"][number] }
    | { kind: "update"; item: ImportPlan["updates"][number] };
  const ops: Op[] = [
    ...plan.creates.map((item) => ({ kind: "create" as const, id: newId(productsCol(actor.boutiqueId)), item })),
    ...plan.updates.map((item) => ({ kind: "update" as const, item })),
  ];

  for (let i = 0; i < ops.length; i += IMPORT_CHUNK) {
    const chunk = ops.slice(i, i + IMPORT_CHUNK);
    const batch = writeBatch(getDb());
    const lines: MovementLine[] = canEditStock
      ? chunk.flatMap((op): MovementLine[] => {
          const delta = op.kind === "create" ? op.item.stock : op.item.stockDelta;
          if (!delta) return [];
          return [{ productId: op.kind === "create" ? op.id : op.item.id, name: op.item.input.name, delta }];
        })
      : [];
    const movementId = lines.length ? addMovement(batch, actor, "correction", lines, "Import CSV") : "";
    const deltaOf = new Map(lines.map((l) => [l.productId, l.delta]));

    for (const op of chunk) {
      const productId = op.kind === "create" ? op.id : op.item.id;
      const delta = deltaOf.get(productId) ?? 0;
      const ref = doc(productsCol(actor.boutiqueId), productId);
      if (op.kind === "create") {
        batch.set(ref, {
          ...op.item.input,
          stock: delta,
          archived: false,
          lastMovementId: delta ? movementId : "",
          createdAt: serverTimestamp(),
          createdBy: actor.uid,
          ...signed(actor),
        });
      } else {
        batch.update(ref, {
          ...op.item.input,
          ...(delta ? { stock: increment(delta), lastMovementId: movementId } : {}),
          ...signed(actor),
        });
      }
      if (op.item.buyPrice != null) setCost(batch, actor, productId, op.item.buyPrice);
    }
    track(batch.commit(), onWriteError);
  }
  return { created: plan.creates.length, updated: plan.updates.length };
}

/** Raccourci pour les écrans : l'auteur des écritures à partir de la session. */
export function useActor(): Actor {
  const { boutique, member } = useReady();
  return { boutiqueId: boutique.id, uid: member.uid, memberName: member.name || member.email };
}
