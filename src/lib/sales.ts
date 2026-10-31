/** Ventes : forme d'une vente enregistrée et règles d'annulation (logique pure). */
import type { Currency, Rates } from "./fx";
import type { PaymentMethod } from "./cart";
import type { Unit } from "./products";

export interface SaleLine {
  productId: string;
  name: string;
  unit: Unit;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  /** Emballage vendu (« Paquet ») ; absent pour la vente à l'unité. */
  packId?: string;
  packName?: string;
  packUnits?: number;
  /** Appareil vendu (IMEI ou numéro de série) et fin de sa garantie « AAAA-MM-JJ » (vide : aucune). */
  serial?: string;
  warrantyUntil?: string;
}

export interface SalePayment {
  method: PaymentMethod;
  currency: Currency;
  /** Taux du jour (FC pour 1 $ et 1 €) si le client a payé dans une autre devise que celle des prix, sinon `null`. */
  rates: Rates | null;
  /** Montant dû dans la devise de paiement. */
  due: number;
  received: number;
  change: number;
}

export type SaleStatus = "validee" | "annulee";

export interface Sale {
  id: string;
  uid: string;
  memberName: string;
  lines: SaleLine[];
  subtotal: number;
  discountPercent: number;
  discount: number;
  total: number;
  /** Devise des prix de la boutique au moment de la vente. */
  currency: Currency;
  payment: SalePayment;
  /** Client rattaché à la vente (facultatif). */
  clientId: string;
  clientName: string;
  /** Comptée dans les compteurs mensuels (ventes créées depuis leur ajout). */
  inStats: boolean;
  status: SaleStatus;
  cancelReason: string;
  cancelledByName: string;
  /** Heure du serveur, ou de l'appareil tant que la vente n'est pas envoyée. */
  createdAtMs: number;
  dayKey: string;
  /** Faux tant que la vente n'a pas atteint le serveur. */
  synced: boolean;
}

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  especes: "Espèces",
  mobile_money: "Mobile money",
};

/** Une vente s'annule le jour même, si elle n'est pas déjà annulée. */
export function canCancelSale(sale: Pick<Sale, "status" | "createdAtMs">, now = Date.now()): boolean {
  if (sale.status !== "validee") return false;
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  return sale.createdAtMs >= start.getTime();
}

/** « à l'instant », « il y a 3 min », « il y a 2 h », puis l'heure (« 08:15 »). */
export function timeAgo(ms: number, now: number): string {
  const min = Math.floor((now - ms) / 60000);
  if (min < 1) return "À l'instant";
  if (min < 60) return `Il y a ${min} min`;
  if (min < 6 * 60) return `Il y a ${Math.floor(min / 60)} h`;
  const d = new Date(ms);
  return `À ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
