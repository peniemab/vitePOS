/**
 * Imitation en mémoire de « firebase/firestore », pour l'aperçu seulement (captures d'écran de l'app).
 * Aucune requête réseau : les données viennent de `fixtures.ts`. Les écritures modifient la mémoire
 * et rafraîchissent les écrans, pour qu'on puisse aussi cliquer dans l'aperçu.
 */
import { seed } from "./fixtures";

export class Timestamp {
  constructor(private ms: number) {}
  static fromMillis(ms: number) {
    return new Timestamp(ms);
  }
  static now() {
    return new Timestamp(Date.now());
  }
  toMillis() {
    return this.ms;
  }
  toDate() {
    return new Date(this.ms);
  }
}

export type DocumentData = Record<string, unknown>;
export type Firestore = object;
export type WriteBatch = ReturnType<typeof writeBatch>;

type Ref = { type: "doc" | "collection"; path: string; id: string };
type Constraint = { kind: "where"; field: string; op: string; value: unknown } | { kind: "orderBy"; field: string; dir: string } | { kind: "limit"; n: number };
type Query = { type: "query"; path: string; constraints: Constraint[] };

const store = new Map<string, DocumentData>(seed());
const listeners = new Set<() => void>();
let counter = 0;

const autoId = () => `apercu${(++counter).toString(36)}${Math.random().toString(36).slice(2, 8)}`;
const join = (base: string, segs: string[]) => [base, ...segs].filter(Boolean).join("/");

export function initializeFirestore() {
  return {};
}
export function persistentLocalCache() {
  return {};
}
export function persistentMultipleTabManager() {
  return {};
}

export function collection(parent: unknown, ...segs: string[]): Ref {
  const base = parent && typeof parent === "object" && "path" in parent ? (parent as Ref).path : "";
  const path = join(base, segs);
  return { type: "collection", path, id: path.split("/").pop()! };
}

export function doc(parent: unknown, ...segs: string[]): Ref {
  const base = parent && typeof parent === "object" && "path" in parent ? (parent as Ref).path : "";
  const path = segs.length ? join(base, segs) : join(base, [autoId()]);
  return { type: "doc", path, id: path.split("/").pop()! };
}

export const where = (field: string, op: string, value: unknown): Constraint => ({ kind: "where", field, op, value });
export const orderBy = (field: string, dir = "asc"): Constraint => ({ kind: "orderBy", field, dir });
export const limit = (n: number): Constraint => ({ kind: "limit", n });
export function query(ref: Ref, ...constraints: Constraint[]): Query {
  return { type: "query", path: ref.path, constraints };
}

const comparable = (v: unknown) => (v instanceof Timestamp ? v.toMillis() : (v as number | string));

function matches(data: DocumentData, c: Constraint): boolean {
  if (c.kind !== "where") return true;
  const v = comparable(data[c.field]);
  const w = comparable(c.value);
  switch (c.op) {
    case "==":
      return v === w;
    case ">=":
      return v >= w;
    case "<=":
      return v <= w;
    case "array-contains":
      return Array.isArray(data[c.field]) && (data[c.field] as unknown[]).includes(c.value);
    default:
      return true;
  }
}

const meta = { fromCache: false, hasPendingWrites: false };

function docSnap(path: string) {
  const data = store.get(path);
  return { id: path.split("/").pop()!, exists: () => !!data, data: () => data, metadata: meta };
}

function querySnap(q: Query | Ref) {
  const depth = q.path.split("/").length + 1;
  let rows = [...store.entries()].filter(([p]) => p.startsWith(q.path + "/") && p.split("/").length === depth);
  const constraints = "constraints" in q ? q.constraints : [];
  for (const c of constraints) rows = rows.filter(([, d]) => matches(d, c));
  for (const c of constraints)
    if (c.kind === "orderBy")
      rows.sort(([, a], [, b]) => {
        const x = comparable(a[c.field]);
        const y = comparable(b[c.field]);
        return (x < y ? -1 : x > y ? 1 : 0) * (c.dir === "desc" ? -1 : 1);
      });
  const lim = constraints.find((c) => c.kind === "limit");
  if (lim && lim.kind === "limit") rows = rows.slice(0, lim.n);
  const docs = rows.map(([p, d]) => ({ id: p.split("/").pop()!, data: () => d, metadata: meta }));
  return { docs, size: docs.length, empty: docs.length === 0 };
}

export function onSnapshot(ref: Ref | Query, ...args: unknown[]) {
  if (args[0] && typeof args[0] === "object" && !("call" in (args[0] as object))) args.shift();
  const next = args[0] as (s: unknown) => void;
  const emit = () => next(ref.type === "doc" ? docSnap(ref.path) : querySnap(ref));
  listeners.add(emit);
  setTimeout(emit, 0);
  return () => listeners.delete(emit);
}

export function getDocFromServer(ref: Ref) {
  return Promise.resolve(docSnap(ref.path));
}

/* ---------- Écritures (en mémoire) ---------- */

const INC = Symbol("increment");
export const serverTimestamp = () => Timestamp.now();
export const increment = (n: number) => ({ [INC]: n });

const isPlain = (v: unknown): v is DocumentData =>
  !!v && typeof v === "object" && Object.getPrototypeOf(v) === Object.prototype && !(INC in v);

/** Comme Firestore : `increment()` s'ajoute à l'ancienne valeur, et en fusion les sous-objets se fusionnent aussi. */
function mergeFields(prev: DocumentData, patch: DocumentData, merge: boolean): DocumentData {
  const next: DocumentData = { ...prev };
  for (const [k, v] of Object.entries(patch)) {
    const inc = v && typeof v === "object" && INC in v ? (v as Record<symbol, number>)[INC] : undefined;
    if (inc !== undefined) next[k] = ((prev[k] as number) ?? 0) + inc;
    else if (merge && isPlain(v)) next[k] = mergeFields(isPlain(prev[k]) ? prev[k] : {}, v, true);
    else next[k] = v;
  }
  return next;
}

function apply(path: string, patch: DocumentData, merge: boolean) {
  store.set(path, mergeFields(merge ? (store.get(path) ?? {}) : {}, patch, merge));
}

const notify = () => setTimeout(() => listeners.forEach((l) => l()), 0);

export function setDoc(ref: Ref, data: DocumentData, opts?: { merge?: boolean }) {
  apply(ref.path, data, !!opts?.merge);
  notify();
  return Promise.resolve();
}

export function updateDoc(ref: Ref, data: DocumentData) {
  apply(ref.path, data, true);
  notify();
  return Promise.resolve();
}

export function writeBatch() {
  const ops: (() => void)[] = [];
  const batch = {
    set(ref: Ref, data: DocumentData, opts?: { merge?: boolean }) {
      ops.push(() => apply(ref.path, data, !!opts?.merge));
      return batch;
    },
    update(ref: Ref, data: DocumentData) {
      ops.push(() => apply(ref.path, data, true));
      return batch;
    },
    commit() {
      ops.forEach((o) => o());
      notify();
      return Promise.resolve();
    },
  };
  return batch;
}
