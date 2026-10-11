/**
 * Ticket de caisse : une seule description des lignes, utilisée pour l'affichage à l'écran,
 * le partage en texte et l'impression thermique (ESC/POS).
 */
import { formatMoney } from "./fx";
import { PAYMENT_LABELS, type Sale } from "./sales";
import { ticketNumber } from "./cart";

export type PaperWidth = 58 | 80;

export type ReceiptLine =
  | { kind: "title"; text: string }
  | { kind: "center"; text: string }
  | { kind: "text"; text: string }
  | { kind: "pair"; left: string; right: string; strong?: boolean }
  | { kind: "rule" };

export interface ReceiptShop {
  name: string;
}

function qty(q: number, unit: string): string {
  const s = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 3 }).format(q).replace(/[  ]/g, " ");
  return unit === "u" ? s : `${s} ${unit}`;
}

function dateTime(ms: number): string {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" }).format(ms);
}

export function receiptLines(shop: ReceiptShop, sale: Sale): ReceiptLine[] {
  const c = sale.currency;
  const p = sale.payment;
  const out: ReceiptLine[] = [
    { kind: "title", text: shop.name },
    { kind: "center", text: "Ticket de vente" },
    { kind: "rule" },
    { kind: "text", text: dateTime(sale.createdAtMs) },
    { kind: "text", text: `N° ${ticketNumber(sale.id)}` },
    { kind: "text", text: `Vendeur : ${sale.memberName}` },
  ];
  if (sale.clientName) out.push({ kind: "text", text: `Client : ${sale.clientName}` });
  if (sale.status === "annulee") out.push({ kind: "center", text: "*** VENTE ANNULÉE ***" });
  out.push({ kind: "rule" });

  for (const l of sale.lines) {
    out.push({ kind: "text", text: l.name });
    out.push({ kind: "pair", left: `  ${qty(l.quantity, l.unit)} × ${formatMoney(l.unitPrice, c)}`, right: formatMoney(l.lineTotal, c) });
  }
  out.push({ kind: "rule" });
  if (sale.discount > 0) {
    out.push({ kind: "pair", left: "Sous-total", right: formatMoney(sale.subtotal, c) });
    out.push({ kind: "pair", left: `Remise ${sale.discountPercent} %`, right: `-${formatMoney(sale.discount, c)}` });
  }
  out.push({ kind: "pair", left: "TOTAL", right: formatMoney(sale.total, c), strong: true });

  const label = p.method === "especes" ? `${PAYMENT_LABELS.especes} ${p.currency === "USD" ? "$" : "FC"}` : PAYMENT_LABELS.mobile_money;
  out.push({ kind: "pair", left: "Paiement", right: label });
  if (p.rate > 0) {
    out.push({ kind: "pair", left: "À payer", right: formatMoney(p.due, p.currency) });
    out.push({ kind: "text", text: `Taux : 1 $ = ${formatMoney(p.rate, "CDF")}` });
  }
  if (p.method === "especes") {
    out.push({ kind: "pair", left: "Reçu", right: formatMoney(p.received, p.currency) });
    if (p.change > 0) out.push({ kind: "pair", left: "Rendu", right: formatMoney(p.change, p.currency) });
  }
  out.push({ kind: "rule" });
  out.push({ kind: "center", text: "Merci et à bientôt !" });
  return out;
}

/** Nombre de caractères par ligne selon la largeur du papier. */
export function columns(width: PaperWidth): number {
  return width === 80 ? 48 : 32;
}

function pairText(left: string, right: string, cols: number): string {
  const room = cols - right.length - 1;
  const l = left.length > room ? left.slice(0, Math.max(0, room)) : left;
  return l + " ".repeat(Math.max(1, cols - l.length - right.length)) + right;
}

function center(text: string, cols: number): string {
  const t = text.slice(0, cols);
  return " ".repeat(Math.floor((cols - t.length) / 2)) + t;
}

/** Ticket en texte brut (partage WhatsApp, SMS…). */
export function receiptText(lines: ReceiptLine[], width: PaperWidth = 58): string {
  const cols = columns(width);
  return lines
    .map((l) => {
      switch (l.kind) {
        case "title":
        case "center":
          return center(l.text, cols);
        case "text":
          return l.text;
        case "pair":
          return pairText(l.left, l.right, cols);
        case "rule":
          return "-".repeat(cols);
      }
    })
    .join("\n");
}

/* ---------- ESC/POS (imprimantes thermiques) ---------- */

const ESC = 0x1b;
const GS = 0x1d;

/** Page de code Windows-1252 : la plupart des imprimantes bon marché impriment ainsi les accents. */
const CP1252: Record<string, number> = {
  "€": 0x80, "Œ": 0x8c, "œ": 0x9c, "×": 0xd7, "°": 0xb0,
  "À": 0xc0, "Â": 0xc2, "Ä": 0xc4, "Ç": 0xc7, "È": 0xc8, "É": 0xc9, "Ê": 0xca, "Ë": 0xcb, "Î": 0xce, "Ï": 0xcf,
  "Ô": 0xd4, "Ö": 0xd6, "Ù": 0xd9, "Û": 0xdb, "Ü": 0xdc,
  "à": 0xe0, "â": 0xe2, "ä": 0xe4, "ç": 0xe7, "è": 0xe8, "é": 0xe9, "ê": 0xea, "ë": 0xeb, "î": 0xee, "ï": 0xef,
  "ô": 0xf4, "ö": 0xf6, "ù": 0xf9, "û": 0xfb, "ü": 0xfc,
};

export function encodeCp1252(text: string): number[] {
  const bytes: number[] = [];
  for (const ch of text.replace(/[  ]/g, " ")) {
    const code = ch.codePointAt(0) ?? 63;
    bytes.push(code < 128 ? code : (CP1252[ch] ?? 63));
  }
  return bytes;
}

export function escPos(lines: ReceiptLine[], width: PaperWidth): Uint8Array {
  const cols = columns(width);
  const b: number[] = [ESC, 0x40, ESC, 0x74, 16]; // initialisation, page de code 16 (Windows-1252)
  const text = (t: string) => b.push(...encodeCp1252(t), 0x0a);
  const align = (n: 0 | 1) => b.push(ESC, 0x61, n);

  for (const l of lines) {
    switch (l.kind) {
      case "title":
        align(1);
        b.push(ESC, 0x21, 0x30); // double hauteur et largeur
        text(l.text.slice(0, Math.floor(cols / 2)));
        b.push(ESC, 0x21, 0x00);
        align(0);
        break;
      case "center":
        align(1);
        text(l.text.slice(0, cols));
        align(0);
        break;
      case "text":
        text(l.text.slice(0, cols));
        break;
      case "pair":
        if (l.strong) b.push(ESC, 0x45, 1);
        text(pairText(l.left, l.right, cols));
        if (l.strong) b.push(ESC, 0x45, 0);
        break;
      case "rule":
        text("-".repeat(cols));
        break;
    }
  }
  b.push(0x0a, 0x0a, 0x0a, GS, 0x56, 0x00); // avance et coupe
  return new Uint8Array(b);
}
