/**
 * Résumés par jour, sous `boutiques/{id}/dayStats/{AAAA-MM-JJ}` (forme : `DayTotals` de `lib/dayStats`).
 * Mis à jour par `increment()` dans la même écriture groupée que la vente ou son annulation : deux caisses
 * hors ligne s'additionnent sans s'écraser. Le graphique de l'accueil et les rapports lisent ainsi un petit
 * document par jour au lieu de toutes les ventes.
 *
 * `dayStats/start` ({ day }) dit à partir de quel jour les résumés sont complets. Il est créé une seule fois,
 * par le premier appareil à jour, avec le lendemain : les jours d'avant se calculent encore depuis les ventes.
 */
import { useEffect, useState } from "react";
import { collection, doc, documentId, increment, onSnapshot, query, setDoc, where, type WriteBatch } from "firebase/firestore";
import { getDb } from "./firebase";
import { track } from "./sync";
import { watchSalesBetween } from "./sales";
import { dayKey } from "../lib/cart";
import { shiftDay } from "../lib/cashday";
import { daysFromSales, readDay, saleShare, type DayTotals } from "../lib/dayStats";
import type { Sale } from "../lib/sales";

const statsCol = (b: string) => collection(getDb(), "boutiques", b, "dayStats");

/** Ajoute (sign = 1) ou retire (sign = -1) une vente du résumé de son jour. */
export function countSaleDay(batch: WriteBatch, boutiqueId: string, sale: Parameters<typeof saleShare>[0], sign: 1 | -1): void {
  const d = saleShare(sale);
  const inc = (n: number) => increment(sign * n);
  batch.set(
    doc(statsCol(boutiqueId), d.day),
    {
      revenue: inc(d.revenue),
      count: inc(d.count),
      discounts: inc(d.discounts),
      cash: inc(d.cash),
      mobileMoney: inc(d.mobileMoney),
      products: Object.fromEntries(Object.entries(d.products).map(([id, p]) => [id, { n: p.n, q: inc(p.q), r: inc(p.r) }])),
      members: Object.fromEntries(Object.entries(d.members).map(([uid, m]) => [uid, { r: inc(m.r), c: inc(m.c) }])),
    },
    { merge: true },
  );
}

/**
 * Premier jour couvert par les résumés : `undefined` pendant la lecture, `null` s'il n'est pas (encore) connu,
 * auquel cas tout se calcule depuis les ventes, comme avant.
 */
function useStatsStart(boutiqueId: string): string | null | undefined {
  const [start, setStart] = useState<string | null>();
  useEffect(() => {
    setStart(undefined);
    const ref = doc(statsCol(boutiqueId), "start");
    return onSnapshot(
      ref,
      (s) => {
        const day = s.data()?.day;
        if (typeof day === "string") return setStart(day);
        setStart(null);
        // Absent du serveur : cet appareil compte déjà chaque vente, les résumés seront complets dès demain.
        // Si un autre appareil l'a créé entre-temps, le serveur refuse celui-ci : rien à signaler.
        if (!s.metadata.fromCache) track(setDoc(ref, { day: shiftDay(dayKey(Date.now()), 1) }), () => undefined);
      },
      () => setStart(null),
    );
  }, [boutiqueId]);
  return start;
}

/** Suit les résumés enregistrés des jours `start` à `end` compris. */
function watchDayStats(boutiqueId: string, start: string, end: string, cb: (days: DayTotals[]) => void, onError: (e: unknown) => void) {
  return onSnapshot(
    query(statsCol(boutiqueId), where(documentId(), ">=", start), where(documentId(), "<=", end)),
    (s) => cb(s.docs.map((d) => readDay(d.id, d.data()))),
    onError,
  );
}

/**
 * Résumés des jours `start` à `end` : lus dans `dayStats` quand ils sont complets, recalculés depuis les ventes
 * pour les jours plus anciens. `undefined` pendant le chargement.
 */
export function useDays(boutiqueId: string, start: string, end: string, onError: (e: unknown) => void): DayTotals[] | undefined {
  const from = useStatsStart(boutiqueId);
  const [old, setOld] = useState<DayTotals[]>();
  const [saved, setSaved] = useState<DayTotals[]>();

  useEffect(() => {
    if (from === undefined) return;
    setOld(undefined);
    setSaved(undefined);
    const oldEnd = from ? [end, shiftDay(from, -1)].sort()[0] : end;
    const savedStart = from ? [start, from].sort()[1] : "";
    const stops: (() => void)[] = [];
    if (start <= oldEnd) stops.push(watchSalesBetween(boutiqueId, start, oldEnd, (sales: Sale[]) => setOld(daysFromSales(sales)), onError));
    else setOld([]);
    if (savedStart && savedStart <= end) stops.push(watchDayStats(boutiqueId, savedStart, end, setSaved, onError));
    else setSaved([]);
    return () => stops.forEach((s) => s());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boutiqueId, start, end, from]);

  return old && saved ? [...old, ...saved] : undefined;
}
