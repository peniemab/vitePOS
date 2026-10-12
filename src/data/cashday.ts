/**
 * Dépenses (`boutiques/{id}/expenses/{id}`) et journées de caisse (`boutiques/{id}/cashDays/{AAAA-MM-JJ}`).
 * La journée suit la date : toutes les ventes du jour en font partie. Le matin on peut noter le fond
 * de caisse ; le soir, la clôture compare l'argent compté à l'argent attendu.
 */
import { collection, doc, onSnapshot, query, serverTimestamp, setDoc, updateDoc, where, type DocumentData } from "firebase/firestore";
import { notifications } from "@mantine/notifications";
import { getDb } from "./firebase";
import { errorMessage } from "./errors";
import { track } from "./sync";
import type { Actor } from "./products";
import { dayKey } from "../lib/cart";
import { isExpenseCategory, type Expense, type ExpenseCategory, type Money2 } from "../lib/cashday";
import { isCurrency, type Currency } from "../lib/fx";

const expensesCol = (b: string) => collection(getDb(), "boutiques", b, "expenses");
const daysCol = (b: string) => collection(getDb(), "boutiques", b, "cashDays");

function num(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

function ms(v: unknown): number {
  return v && typeof v === "object" && "toMillis" in v ? (v as { toMillis(): number }).toMillis() : 0;
}

function money2(v: unknown): Money2 {
  const m = (v ?? {}) as Record<string, unknown>;
  return { CDF: num(m.CDF), USD: num(m.USD) };
}

function onWriteError(e: unknown) {
  notifications.show({ color: "red", title: "Enregistrement refusé par le serveur", message: errorMessage(e), autoClose: false });
}

/* ---------- Dépenses ---------- */

function toExpense(id: string, d: DocumentData): Expense {
  return {
    id,
    amount: num(d.amount),
    currency: isCurrency(d.currency) ? d.currency : "CDF",
    category: isExpenseCategory(d.category) ? d.category : "autres",
    description: String(d.description ?? ""),
    fromTill: d.fromTill !== false,
    status: d.status === "annulee" ? "annulee" : "validee",
    memberName: String(d.memberName ?? ""),
    dayKey: String(d.dayKey ?? ""),
    createdAtMs: ms(d.createdAt) || num(d.clientAtMs),
  };
}

export function watchExpensesOfDay(boutiqueId: string, day: string, cb: (e: Expense[]) => void, onError: (e: unknown) => void) {
  return onSnapshot(
    query(expensesCol(boutiqueId), where("dayKey", "==", day)),
    (s) => cb(s.docs.map((d) => toExpense(d.id, d.data())).sort((a, b) => b.createdAtMs - a.createdAtMs)),
    onError,
  );
}

export function watchExpensesBetween(boutiqueId: string, start: string, end: string, cb: (e: Expense[]) => void, onError: (e: unknown) => void) {
  return onSnapshot(
    query(expensesCol(boutiqueId), where("dayKey", ">=", start), where("dayKey", "<=", end)),
    (s) => cb(s.docs.map((d) => toExpense(d.id, d.data()))),
    onError,
  );
}

export function createExpense(
  actor: Actor,
  input: { amount: number; currency: Currency; category: ExpenseCategory; description: string; fromTill: boolean },
): void {
  const now = Date.now();
  track(
    setDoc(doc(expensesCol(actor.boutiqueId)), {
      ...input,
      description: input.description.trim().slice(0, 200),
      status: "validee",
      uid: actor.uid,
      memberName: actor.memberName,
      dayKey: dayKey(now),
      createdAt: serverTimestamp(),
      clientAtMs: now,
    }),
    onWriteError,
  );
}

export function cancelExpense(actor: Actor, id: string): void {
  track(
    updateDoc(doc(expensesCol(actor.boutiqueId), id), {
      status: "annulee",
      cancelledBy: actor.uid,
      cancelledByName: actor.memberName,
      cancelledAt: serverTimestamp(),
    }),
    onWriteError,
  );
}

/* ---------- Journées de caisse ---------- */

export interface CashDay {
  day: string;
  status: "open" | "closed";
  openingFloat: Money2;
  openedByName: string;
  closing?: {
    counted: Money2;
    expected: Money2;
    variance: Money2;
    salesCount: number;
    revenue: number;
    notes: string;
  };
  closedByName: string;
  closedAtMs: number;
}

export function watchCashDay(boutiqueId: string, day: string, cb: (d: CashDay | null) => void, onError: (e: unknown) => void) {
  return onSnapshot(
    doc(daysCol(boutiqueId), day),
    (s) => {
      if (!s.exists()) return cb(null);
      const d = s.data();
      const c = d.closing as Record<string, unknown> | undefined;
      cb({
        day,
        status: d.status === "closed" ? "closed" : "open",
        openingFloat: money2(d.openingFloat),
        openedByName: String(d.openedByName ?? ""),
        closing: c
          ? {
              counted: money2(c.counted),
              expected: money2(c.expected),
              variance: money2(c.variance),
              salesCount: num(c.salesCount),
              revenue: num(c.revenue),
              notes: String(c.notes ?? ""),
            }
          : undefined,
        closedByName: String(d.closedByName ?? ""),
        closedAtMs: ms(d.closedAt),
      });
    },
    onError,
  );
}

/** Note le fond de caisse du matin (ou le corrige tant que la journée n'est pas clôturée). */
export function setOpeningFloat(actor: Actor, day: string, openingFloat: Money2): void {
  track(
    setDoc(
      doc(daysCol(actor.boutiqueId), day),
      { status: "open", openingFloat, openedBy: actor.uid, openedByName: actor.memberName, openedAt: serverTimestamp() },
      { merge: true },
    ),
    onWriteError,
  );
}

/** Clôture la journée : l'argent compté, ce qui était attendu et l'écart sont figés. */
export function closeDay(actor: Actor, day: string, closing: NonNullable<CashDay["closing"]>, openingFloat: Money2): void {
  track(
    setDoc(
      doc(daysCol(actor.boutiqueId), day),
      {
        status: "closed",
        openingFloat,
        closing: { ...closing, notes: closing.notes.trim().slice(0, 500) },
        closedBy: actor.uid,
        closedByName: actor.memberName,
        closedAt: serverTimestamp(),
      },
      { merge: true },
    ),
    onWriteError,
  );
}
