/**
 * Compteurs mensuels, sous `boutiques/{id}/monthStats/{AAAA-MM}` : { sales: {CDF, USD, EUR}, saleCount,
 * expenses: {CDF, USD, EUR} }. Mis à jour par `increment()` dans la même écriture groupée que la vente,
 * l'annulation ou la dépense : deux caisses hors ligne s'additionnent sans s'écraser, et le graphique
 * des six derniers mois ne lit que six petits documents au lieu de toutes les ventes.
 * Seules les ventes et dépenses marquées `inStats` (créées depuis l'ajout des compteurs) y sont comptées.
 */
import { doc, increment, onSnapshot, type WriteBatch } from "firebase/firestore";
import { getDb } from "./firebase";
import type { Currency } from "../lib/fx";
import { readMoney, type MonthTotals } from "../lib/monthStats";

const statsRef = (boutiqueId: string, month: string) => doc(getDb(), "boutiques", boutiqueId, "monthStats", month);

/** Ajoute (sign = 1) ou retire (sign = -1) une vente du compteur de son mois. */
export function countSale(batch: WriteBatch, boutiqueId: string, month: string, currency: Currency, total: number, sign: 1 | -1): void {
  batch.set(statsRef(boutiqueId, month), { sales: { [currency]: increment(sign * total) }, saleCount: increment(sign) }, { merge: true });
}

/** Ajoute (sign = 1) ou retire (sign = -1) une dépense du compteur de son mois. */
export function countExpense(batch: WriteBatch, boutiqueId: string, month: string, currency: Currency, amount: number, sign: 1 | -1): void {
  batch.set(statsRef(boutiqueId, month), { expenses: { [currency]: increment(sign * amount) } }, { merge: true });
}

/** Suit les compteurs des mois demandés (un mois sans activité vaut zéro). */
export function watchMonthStats(
  boutiqueId: string,
  months: { key: string; label: string }[],
  cb: (totals: MonthTotals[]) => void,
  onError: (e: unknown) => void,
): () => void {
  const current = new Map<string, MonthTotals>(
    months.map((m) => [m.key, { ...m, sales: readMoney(null), saleCount: 0, expenses: readMoney(null) }]),
  );
  let loaded = 0;
  const seen = new Set<string>();
  const stops = months.map((m) =>
    onSnapshot(
      statsRef(boutiqueId, m.key),
      (s) => {
        const d = s.data() ?? {};
        current.set(m.key, {
          ...m,
          sales: readMoney(d.sales),
          saleCount: typeof d.saleCount === "number" ? d.saleCount : 0,
          expenses: readMoney(d.expenses),
        });
        if (!seen.has(m.key)) {
          seen.add(m.key);
          loaded++;
        }
        // On attend d'avoir les six mois pour ne pas faire sauter le graphique.
        if (loaded === months.length) cb(months.map((x) => current.get(x.key)!));
      },
      onError,
    ),
  );
  return () => stops.forEach((s) => s());
}
