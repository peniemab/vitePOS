/**
 * Dépôts (pressing, couture, réparation…) : le client laisse ses affaires et revient les chercher.
 * Logique pure : solde, retard, lignes des ventes liées, ticket de dépôt, message WhatsApp.
 *
 * Chaque paiement d'un dépôt est une vente ordinaire, liée au dépôt par `depositId` :
 * - tout payé au dépôt : une vente avec les services ;
 * - acompte : une vente d'une seule ligne « Acompte », puis au retrait une vente avec les services
 *   et une ligne négative « Acompte déjà payé » (même article : il s'annule dans les statistiques) ;
 * - tout au retrait : une seule vente, le jour du retrait.
 * La caisse du jour et les rapports comptent donc l'argent le jour où il est reçu.
 */
import { lineTotal, ticketNumber, type CartLine } from "./cart";
import { formatMoney, roundMoney, type Currency } from "./fx";
import { fold, type Unit } from "./products";
import type { ReceiptLine, ReceiptShop } from "./receipt";

export type DepositStatus = "recu" | "pret" | "retire" | "annule";

/** Comment le client paie : tout de suite, une avance maintenant, ou tout au retrait. */
export type DepositPayMode = "total" | "acompte" | "retrait";

/** Étape d'une vente liée à un dépôt. */
export type DepositStep = DepositPayMode;

export interface DepositLine {
  productId: string;
  name: string;
  unit: Unit;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface Deposit {
  id: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  lines: DepositLine[];
  /** Ce que le client a laissé, en clair (« 3 chemises blanches, 1 costume noir taché au col »). */
  notes: string;
  subtotal: number;
  discount: number;
  total: number;
  currency: Currency;
  /** Déjà payé (suit les ventes liées, par increment). */
  paid: number;
  /** Jour promis « AAAA-MM-JJ ». */
  dueDay: string;
  status: DepositStatus;
  uid: string;
  memberName: string;
  dayKey: string;
  createdAtMs: number;
  readyAtMs: number;
  pickedUpAtMs: number;
  pickedUpByName: string;
  cancelReason: string;
  synced: boolean;
}

/** Article technique des lignes d'acompte (il n'existe pas dans le catalogue). */
export const ACOMPTE_ID = "acompte-depot";
/** Article technique de la remise accordée au dépôt, reprise au retrait. */
export const REMISE_ID = "remise-depot";

/** Délai proposé par défaut pour le retrait. */
export const DEFAULT_DELAY_DAYS = 3;

export const DEPOSIT_STATUS_LABELS: Record<DepositStatus, string> = {
  recu: "En cours",
  pret: "Prêt",
  retire: "Retiré",
  annule: "Annulé",
};

/** Le dépôt ne prend que des services (pas de stock à sortir) : un panier mixte passe par la caisse normale. */
export function canDeposit(lines: Pick<CartLine, "service">[]): boolean {
  return lines.length > 0 && lines.every((l) => l.service === true);
}

export function balance(d: Pick<Deposit, "total" | "paid">, currency: Currency): number {
  return Math.max(0, roundMoney(d.total - d.paid, currency));
}

export function isOpen(d: Pick<Deposit, "status">): boolean {
  return d.status === "recu" || d.status === "pret";
}

/** Le jour promis est passé et le client n'a pas encore récupéré ses affaires. */
export function isLate(d: Pick<Deposit, "status" | "dueDay">, today: string): boolean {
  return isOpen(d) && !!d.dueDay && d.dueDay < today;
}

/** Jour « AAAA-MM-JJ » décalé de `days` jours (calcul en UTC : pas de souci d'heure d'été). */
export function addDays(day: string, days: number): string {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y!, m! - 1, d! + days)).toISOString().slice(0, 10);
}

export function defaultDueDay(today: string, days = DEFAULT_DELAY_DAYS): string {
  return addDays(today, days);
}

/** Montant valide pour un acompte : plus que rien, moins que le total. */
export function validAcompte(amount: number, total: number): boolean {
  return Number.isFinite(amount) && amount > 0 && amount < total;
}

/** Recherche par numéro du dépôt, nom ou téléphone du client. */
export function matchDeposit(d: Pick<Deposit, "id" | "clientName" | "clientPhone">, search: string): boolean {
  const q = fold(search).trim();
  if (!q) return true;
  const code = ticketNumber(d.id).toLowerCase();
  const compact = q.replace(/[\s-]/g, "");
  if (compact.length >= 3 && code.replace("-", "").includes(compact)) return true;
  const digits = search.replace(/\D/g, "");
  if (digits.length >= 3 && d.clientPhone.replace(/\D/g, "").includes(digits)) return true;
  return q.split(/\s+/).every((w) => fold(d.clientName).includes(w));
}

/** Ordre d'affichage : en retard d'abord, puis par jour promis ; les retirés et annulés du plus récent au plus ancien. */
export function sortDeposits<T extends Pick<Deposit, "status" | "dueDay" | "createdAtMs" | "pickedUpAtMs">>(list: T[]): T[] {
  return [...list].sort((a, b) => {
    if (isOpen(a) && isOpen(b)) return a.dueDay.localeCompare(b.dueDay) || a.createdAtMs - b.createdAtMs;
    if (isOpen(a) !== isOpen(b)) return isOpen(a) ? -1 : 1;
    return (b.pickedUpAtMs || b.createdAtMs) - (a.pickedUpAtMs || a.createdAtMs);
  });
}

/** Ligne de panier de l'acompte versé le jour du dépôt. */
export function acompteLine(amount: number, depositId: string): CartLine {
  return { productId: ACOMPTE_ID, name: `Acompte · Dépôt N° ${ticketNumber(depositId)}`, unit: "u", unitPrice: amount, quantity: 1, service: true };
}

/**
 * Lignes de la vente du retrait : les services du dépôt, puis la remise accordée au dépôt
 * et l'acompte déjà payé, en négatif. Leur somme est le solde à payer.
 */
export function pickupLines(d: Pick<Deposit, "id" | "lines" | "discount" | "paid">): CartLine[] {
  const out: CartLine[] = d.lines.map((l) => ({ productId: l.productId, name: l.name, unit: l.unit, unitPrice: l.unitPrice, quantity: l.quantity, service: true }));
  if (d.discount > 0) out.push({ productId: REMISE_ID, name: "Remise accordée au dépôt", unit: "u", unitPrice: -d.discount, quantity: 1, service: true });
  if (d.paid > 0) out.push({ productId: ACOMPTE_ID, name: `Acompte déjà payé · Dépôt N° ${ticketNumber(d.id)}`, unit: "u", unitPrice: -d.paid, quantity: 1, service: true });
  return out;
}

/** Lignes du dépôt, telles qu'enregistrées, à partir du panier. */
export function depositLines(cart: CartLine[], currency: Currency): DepositLine[] {
  return cart.map((l) => ({ productId: l.productId, name: l.name, unit: l.unit, unitPrice: l.unitPrice, quantity: l.quantity, lineTotal: lineTotal(l, currency) }));
}

function day(d: string): string {
  const [y, m, dd] = d.split("-");
  return y && m && dd ? `${dd}/${m}/${y}` : d;
}

function qty(q: number): string {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 3 }).format(q).replace(/[  ]/g, " ");
}

/** Ticket de dépôt, remis au client : il le présentera au retrait. */
export function depositReceiptLines(shop: ReceiptShop, d: Deposit): ReceiptLine[] {
  const c = d.currency;
  const code = ticketNumber(d.id);
  const out: ReceiptLine[] = [];
  if (shop.logo) out.push({ kind: "logo", bitmap: shop.logo });
  out.push({ kind: "title", text: shop.name });
  if (shop.address?.trim()) out.push({ kind: "center", text: shop.address.trim() });
  if (shop.phone?.trim()) out.push({ kind: "center", text: `Tél : ${shop.phone.trim()}` });
  out.push(
    { kind: "center", text: "Ticket de dépôt" },
    { kind: "rule" },
    { kind: "text", text: `Dépôt N° ${code}` },
    { kind: "text", text: `Déposé le ${new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" }).format(d.createdAtMs)}` },
    { kind: "text", text: `Client : ${d.clientName}` },
  );
  if (d.clientPhone) out.push({ kind: "text", text: `Tél : ${d.clientPhone}` });
  out.push({ kind: "pair", left: "À retirer le", right: day(d.dueDay), strong: true });
  if (d.status === "annule") out.push({ kind: "center", text: "*** DÉPÔT ANNULÉ ***" });
  if (d.status === "retire") out.push({ kind: "center", text: "*** RETIRÉ ***" });
  out.push({ kind: "rule" });
  for (const l of d.lines) {
    out.push({ kind: "text", text: l.name });
    out.push({ kind: "pair", left: `  ${qty(l.quantity)} × ${formatMoney(l.unitPrice, c)}`, right: formatMoney(l.lineTotal, c) });
  }
  if (d.notes.trim()) {
    out.push({ kind: "rule" });
    out.push({ kind: "text", text: d.notes.trim() });
  }
  out.push({ kind: "rule" });
  if (d.discount > 0) out.push({ kind: "pair", left: "Remise", right: `-${formatMoney(d.discount, c)}` });
  out.push({ kind: "pair", left: "TOTAL", right: formatMoney(d.total, c), strong: true });
  out.push({ kind: "pair", left: "Déjà payé", right: formatMoney(d.paid, c) });
  out.push({ kind: "pair", left: "Reste à payer", right: formatMoney(balance(d, c), c), strong: true });
  out.push({ kind: "rule" });
  out.push({ kind: "barcode", value: code }, { kind: "center", text: code });
  out.push({ kind: "center", text: "Présentez ce ticket pour retirer vos affaires." });
  out.push({ kind: "center", text: shop.footer?.trim() || "Merci et à bientôt !" });
  return out;
}

/** Message « c'est prêt » envoyé au client sur WhatsApp. */
export function readyMessage(shopName: string, d: Pick<Deposit, "id" | "clientName" | "total" | "paid" | "currency">): string {
  const rest = balance(d, d.currency);
  return [
    `Bonjour ${d.clientName.trim()},`,
    `vos affaires (dépôt N° ${ticketNumber(d.id)}) sont prêtes chez ${shopName}.`,
    rest > 0 ? `Reste à payer : ${formatMoney(rest, d.currency)}.` : "Tout est déjà payé.",
    "À bientôt !",
  ].join("\n");
}

/** Lien WhatsApp vers le numéro du client (« 0812 345 678 » devient 243812345678). */
export function whatsappTo(phone: string, text: string): string {
  const digits = phone.replace(/\D/g, "").replace(/^0/, "243");
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}
