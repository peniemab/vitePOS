/** Ventes : forme d'une vente enregistrée et règles d'annulation (logique pure). */
import type { Currency } from "./fx";
import type { PaymentMethod } from "./cart";
import type { Unit } from "./products";

export interface SaleLine {
  productId: string;
  name: string;
  unit: Unit;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface SalePayment {
  method: PaymentMethod;
  currency: Currency;
  /** FC pour 1 $ si le client a payé dans une autre devise que celle des prix, sinon 0. */
  rate: number;
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
