/**
 * Dates de péremption (logique pure). Chaque arrivage d'un produit suivi crée un « lot » : quantité reçue
 * et date de péremption. On ne décompte pas les lots à chaque vente (deux caisses hors ligne se
 * marcheraient dessus) : on estime ce qui reste de chaque lot à partir du stock actuel, en supposant que
 * les plus anciens partent en premier. Le stock restant appartient donc aux arrivages les plus récents.
 */

export interface Lot {
  id: string;
  productId: string;
  /** « AAAA-MM-JJ ». */
  expiry: string;
  /** Quantité reçue avec ce lot. */
  quantity: number;
  /** Heure de réception (sert à l'ordre des lots). */
  receivedAtMs: number;
}

export interface LotLeft extends Lot {
  /** Quantité estimée encore en rayon. */
  left: number;
}

export const EXPIRY_WARNING_DAYS = 30;

const DAY = 24 * 3600 * 1000;

function dayToMs(day: string): number {
  return new Date(Number(day.slice(0, 4)), Number(day.slice(5, 7)) - 1, Number(day.slice(8, 10))).getTime();
}

/** Jours entre deux jours « AAAA-MM-JJ » (négatif si `to` est passé). */
export function daysBetween(from: string, to: string): number {
  return Math.round((dayToMs(to) - dayToMs(from)) / DAY);
}

export function isDay(v: unknown): v is string {
  return typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(dayToMs(v));
}

/**
 * Ce qui reste de chaque lot d'un produit, du plus ancien au plus récent (seulement ceux qui ne sont pas épuisés).
 * Le stock actuel est attribué aux lots les plus récents d'abord.
 */
export function lotsLeft(lots: Lot[], stock: number): LotLeft[] {
  let rest = Math.max(0, stock);
  const newestFirst = [...lots].sort((a, b) => b.receivedAtMs - a.receivedAtMs);
  const out: LotLeft[] = [];
  for (const lot of newestFirst) {
    if (rest <= 0) break;
    const left = Math.min(rest, lot.quantity);
    rest -= left;
    out.push({ ...lot, left });
  }
  return out.reverse();
}

export interface ExpiringLot extends LotLeft {
  productName: string;
  /** Jours avant la péremption (négatif : déjà périmé). */
  daysLeft: number;
}

/** Lots encore en rayon qui expirent dans `days` jours ou sont déjà périmés, les plus urgents d'abord. */
export function expiringLots(
  products: { id: string; name: string; stock: number; tracksExpiry: boolean; archived: boolean }[],
  lots: Lot[],
  today: string,
  days = EXPIRY_WARNING_DAYS,
): ExpiringLot[] {
  const byProduct = new Map<string, Lot[]>();
  for (const l of lots) byProduct.set(l.productId, [...(byProduct.get(l.productId) ?? []), l]);
  const out: ExpiringLot[] = [];
  for (const p of products) {
    if (!p.tracksExpiry || p.archived) continue;
    for (const l of lotsLeft(byProduct.get(p.id) ?? [], p.stock)) {
      const daysLeft = daysBetween(today, l.expiry);
      if (daysLeft <= days) out.push({ ...l, productName: p.name, daysLeft });
    }
  }
  return out.sort((a, b) => a.daysLeft - b.daysLeft || a.productName.localeCompare(b.productName, "fr"));
}

/** Libellé court : « Périmé depuis 3 j », « Périme aujourd'hui », « Dans 12 j ». */
export function expiryLabel(daysLeft: number): string {
  if (daysLeft < 0) return `Périmé depuis ${-daysLeft} j`;
  if (daysLeft === 0) return "Périme aujourd'hui";
  return `Dans ${daysLeft} j`;
}
