/**
 * Ticket de caisse : une seule description des lignes, utilisée pour l'affichage à l'écran,
 * le partage en texte et l'impression thermique (ESC/POS).
 */
import { CURRENCIES, formatMoney } from "./fx";
import { PAYMENT_LABELS, type Sale } from "./sales";
import { ticketNumber } from "./cart";
import { packLabel } from "./products";
import { formatDayShort } from "./serials";
import { code128Bitmap, escPosRaster, qrBitmap, unpack, type Bitmap, type PackedBitmap } from "./bitmap";

export type PaperWidth = 58 | 80;

/** Adresse du site de vitePOS, dans le petit QR code en bas de chaque ticket. */
export const VITEPOS_SITE = "https://vitepos-rdc.web.app";

export type ReceiptLine =
  | { kind: "title"; text: string }
  | { kind: "center"; text: string }
  | { kind: "text"; text: string }
  | { kind: "pair"; left: string; right: string; strong?: boolean }
  | { kind: "rule" }
  | { kind: "logo"; bitmap: PackedBitmap }
  | { kind: "barcode"; value: string }
  /** `small` : le petit QR code vitePOS du bas du ticket. */
  | { kind: "qr"; value: string; small?: boolean };

/** En-tête et pied du ticket, réglés par le propriétaire (tout est facultatif sauf le nom). */
export interface ReceiptSettings {
  logo?: PackedBitmap | null;
  address?: string;
  phone?: string;
  rccm?: string;
  idNat?: string;
  taxId?: string;
  /** Message de fin (« Merci et à bientôt ! » si vide). */
  footer?: string;
  /** Lien du QR code de la boutique (WhatsApp, Facebook, site…) et la phrase imprimée dessous. */
  link?: string;
  linkLabel?: string;
}

export interface ReceiptShop extends ReceiptSettings {
  name: string;
}

/** Points imprimables sur la largeur du papier (203 dpi). */
export function paperDots(width: PaperWidth): number {
  return width === 80 ? 576 : 384;
}

/** Image d'une ligne logo, QR code ou code-barres, à la taille du papier ; `null` pour une ligne de texte. */
export function lineBitmap(l: ReceiptLine, width: PaperWidth): Bitmap | null {
  const dots = paperDots(width);
  switch (l.kind) {
    case "logo":
      return unpack(l.bitmap);
    case "barcode":
      return code128Bitmap(l.value, dots - 16, 64);
    case "qr":
      return qrBitmap(l.value, l.small ? (width === 80 ? 128 : 112) : width === 80 ? 264 : 216);
    default:
      return null;
  }
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
  const out: ReceiptLine[] = [];
  if (shop.logo) out.push({ kind: "logo", bitmap: shop.logo });
  out.push({ kind: "title", text: shop.name });
  const info = (label: string, v?: string) => v?.trim() && out.push({ kind: "center", text: `${label}${v.trim()}` });
  info("", shop.address);
  info("Tél : ", shop.phone);
  info("RCCM : ", shop.rccm);
  info("ID NAT : ", shop.idNat);
  info("N° impôt : ", shop.taxId);
  out.push(
    { kind: "center", text: "Ticket de vente" },
    { kind: "rule" },
    { kind: "text", text: dateTime(sale.createdAtMs) },
    { kind: "text", text: `N° ${ticketNumber(sale.id)}` },
    { kind: "text", text: `Vendeur : ${sale.memberName}` },
  );
  if (sale.clientName) out.push({ kind: "text", text: `Client : ${sale.clientName}` });
  if (sale.status === "annulee") out.push({ kind: "center", text: "*** VENTE ANNULÉE ***" });
  out.push({ kind: "rule" });

  for (const l of sale.lines) {
    out.push({ kind: "text", text: l.name });
    if (l.packName) out.push({ kind: "text", text: `  ${packLabel({ name: l.packName, units: l.packUnits ?? 1 }, l.unit)}` });
    out.push({ kind: "pair", left: `  ${qty(l.quantity, l.packName ? "u" : l.unit)} × ${formatMoney(l.unitPrice, c)}`, right: formatMoney(l.lineTotal, c) });
    if (l.serial) out.push({ kind: "text", text: `  IMEI / N° série : ${l.serial}` });
    if (l.warrantyUntil) out.push({ kind: "text", text: `  Garantie jusqu'au ${formatDayShort(l.warrantyUntil)}` });
  }
  out.push({ kind: "rule" });
  if (sale.discount > 0) {
    out.push({ kind: "pair", left: "Sous-total", right: formatMoney(sale.subtotal, c) });
    out.push({ kind: "pair", left: `Remise ${sale.discountPercent} %`, right: `-${formatMoney(sale.discount, c)}` });
  }
  out.push({ kind: "pair", left: "TOTAL", right: formatMoney(sale.total, c), strong: true });

  const label = p.method === "especes" ? `${PAYMENT_LABELS.especes} ${CURRENCIES[p.currency].symbol}` : PAYMENT_LABELS.mobile_money;
  out.push({ kind: "pair", left: "Paiement", right: label });
  if (p.rates) {
    out.push({ kind: "pair", left: "À payer", right: formatMoney(p.due, p.currency) });
    for (const cur of [sale.currency, p.currency]) {
      if (cur !== "CDF" && p.rates[cur] > 0)
        out.push({ kind: "text", text: `Taux : 1 ${CURRENCIES[cur].symbol} = ${formatMoney(p.rates[cur], "CDF")}` });
    }
  }
  if (p.method === "especes") {
    out.push({ kind: "pair", left: "Reçu", right: formatMoney(p.received, p.currency) });
    if (p.change > 0) out.push({ kind: "pair", left: "Rendu", right: formatMoney(p.change, p.currency) });
  }
  out.push({ kind: "rule" });
  // Code-barres du numéro : on retrouvera la vente en le scannant (retour, réclamation).
  out.push({ kind: "barcode", value: ticketNumber(sale.id) }, { kind: "center", text: ticketNumber(sale.id) });
  if (shop.link?.trim()) {
    out.push({ kind: "qr", value: shop.link.trim() });
    if (shop.linkLabel?.trim()) out.push({ kind: "center", text: shop.linkLabel.trim() });
  }
  out.push({ kind: "center", text: shop.footer?.trim() || "Merci et à bientôt !" });
  out.push({ kind: "qr", value: VITEPOS_SITE, small: true }, { kind: "center", text: "Caisse vitePOS : scannez pour l'essayer" });
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

/** Une ligne du ticket prête à dessiner en image : texte déjà mis en colonnes, gras, double taille. */
export interface TextRow {
  text: string;
  bold?: boolean;
  /** Double hauteur et largeur (nom de la boutique) : deux fois moins de caractères par ligne. */
  big?: boolean;
}

/** Logo, QR code ou code-barres, centré. */
export interface ImageRow {
  image: Bitmap;
}

export type ReceiptRow = TextRow | ImageRow;

/** Coupe un texte en lignes d'au plus `max` caractères, entre les mots quand c'est possible. */
function wrapWords(text: string, max: number): string[] {
  const out: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/).filter(Boolean)) {
    for (let w = word; w.length; ) {
      const room = line ? max - line.length - 1 : max;
      if (w.length <= room) {
        line = line ? `${line} ${w}` : w;
        w = "";
      } else if (line) {
        out.push(line);
        line = "";
      } else {
        out.push(w.slice(0, max));
        w = w.slice(max);
      }
    }
  }
  if (line) out.push(line);
  return out.length ? out : [""];
}

/** Lignes du ticket pour l'image partagée vers une app d'impression (Thermer…), au même format que le papier. */
export function receiptRows(lines: ReceiptLine[], width: PaperWidth): ReceiptRow[] {
  const cols = columns(width);
  return lines.flatMap((l): ReceiptRow[] => {
    switch (l.kind) {
      case "title":
        // En double taille, le nom tient sur moins de caractères : on le coupe entre les mots.
        return wrapWords(l.text, Math.floor(cols / 2)).map((t) => ({ text: center(t, Math.floor(cols / 2)), big: true, bold: true }));
      case "center":
        return wrapWords(l.text, cols).map((t) => ({ text: center(t, cols) }));
      case "text":
        return [{ text: l.text.slice(0, cols) }];
      case "pair":
        return [{ text: pairText(l.left, l.right, cols), bold: l.strong }];
      case "rule":
        return [{ text: "-".repeat(cols) }];
      default:
        return [{ image: lineBitmap(l, width)! }];
    }
  });
}

/** Ticket en texte brut (partage WhatsApp, SMS…). */
export function receiptText(lines: ReceiptLine[], width: PaperWidth = 58): string {
  const cols = columns(width);
  return lines
    .flatMap((l): string[] => {
      switch (l.kind) {
        case "title":
        case "center":
          return wrapWords(l.text, cols).map((t) => center(t, cols));
        case "text":
          return [l.text];
        case "pair":
          return [pairText(l.left, l.right, cols)];
        case "rule":
          return ["-".repeat(cols)];
        case "qr":
          // Le lien de la boutique reste utile en texte ; le QR vitePOS, non.
          return l.small ? [] : [l.value];
        default:
          return [];
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
        wrapWords(l.text, Math.floor(cols / 2)).forEach(text);
        b.push(ESC, 0x21, 0x00);
        align(0);
        break;
      case "center":
        align(1);
        wrapWords(l.text, cols).forEach(text);
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
      default:
        // Logo, QR code, code-barres : imprimés en image, comme dans l'app de partage.
        b.push(...escPosRaster(lineBitmap(l, width)!, paperDots(width)));
        break;
    }
  }
  b.push(0x0a, 0x0a, 0x0a, 0x0a, 0x0a, GS, 0x56, 0x00); // avance (marge pour la déchirure) et coupe
  return new Uint8Array(b);
}

/** Vente d'exemple, pour l'aperçu du ticket dans Paramètres et le ticket de test. */
export function sampleSale(currency: Sale["currency"], nowMs: number): Sale {
  const p = currency === "CDF" ? 1 : 0.001;
  const lines = [
    { productId: "a", name: "Riz 5 kg", unit: "u" as const, unitPrice: 18500 * p, quantity: 2, lineTotal: 37000 * p },
    { productId: "b", name: "Huile 1 L", unit: "u" as const, unitPrice: 6000 * p, quantity: 1, lineTotal: 6000 * p },
  ];
  return {
    id: "exempleTST042",
    uid: "",
    memberName: "Grâce",
    lines,
    subtotal: 43000 * p,
    discountPercent: 0,
    discount: 0,
    total: 43000 * p,
    currency,
    payment: { method: "especes", currency, rates: null, due: 43000 * p, received: 50000 * p, change: 7000 * p },
    clientId: "",
    clientName: "",
    inStats: false,
    status: "validee",
    cancelReason: "",
    cancelledByName: "",
    createdAtMs: nowMs,
    dayKey: "",
    synced: true,
  };
}
