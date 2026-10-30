/**
 * Ticket en image PNG, à la largeur exacte du papier (384 points pour 58 mm, 576 pour 80 mm à 203 dpi),
 * pour le partager vers une app d'impression comme Thermer sur iPhone.
 * Tout est synchrone : iPhone n'ouvre le partage que juste après le geste de l'utilisateur.
 */
import { receiptRows, type PaperWidth, type ReceiptLine, type ReceiptRow } from "../lib/receipt";

const DOTS: Record<PaperWidth, number> = { 58: 384, 80: 576 };
const SIDE = 8;
const TOP = 16;
/** Papier blanc après le texte (~ 2 cm) : la dernière ligne passe la barre de coupe sans être déchirée. */
const FEED = 160;
/** Les lettres sont étirées en hauteur, comme la police des imprimantes thermiques (12 × 24 points). */
const STRETCH = 1.35;
/** Polices à chasse fixe épaisses, déjà présentes sur les téléphones (rien à télécharger, marche hors ligne). */
const FONT = `Menlo, "SF Mono", "Roboto Mono", "Droid Sans Mono", "DejaVu Sans Mono", Consolas, "Courier New", monospace`;

export function receiptImageFile(lines: ReceiptLine[], width: PaperWidth, name: string): File {
  const rows = receiptRows(lines, width);
  const w = DOTS[width];
  const cols = width === 80 ? 48 : 32;
  const charW = (w - SIDE * 2) / cols;
  // Un caractère Menlo fait 0,6 fois la taille de la police : la police remplit sa colonne.
  const size = charW / 0.62;
  const lineH = Math.round(size * STRETCH * 1.25);
  // Une image (logo, QR code, code-barres) prend sa hauteur, avec un peu d'air au-dessus et au-dessous.
  const rowH = (r: ReceiptRow) => ("image" in r ? r.image.height + 16 : r.big ? lineH * 2 : lineH);
  const height = rows.reduce((h, r) => h + rowH(r), TOP) + FEED;

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Impossible de préparer l'image du ticket.");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, w, height);
  ctx.fillStyle = "#000";
  ctx.textBaseline = "top";

  let y = TOP;
  for (const r of rows) {
    if ("image" in r) {
      const { width: iw, height: ih, data } = r.image;
      const x0 = Math.floor((w - iw) / 2);
      for (let iy = 0; iy < ih; iy++) for (let ix = 0; ix < iw; ix++) if (data[iy * iw + ix]) ctx.fillRect(x0 + ix, y + 8 + iy, 1, 1);
    } else if (/^-+$/.test(r.text)) {
      // Trait plein plutôt qu'une suite de tirets.
      ctx.fillRect(SIDE, y + Math.round(lineH / 2) - 1, w - SIDE * 2, 2);
    } else {
      const scale = r.big ? 2 : 1;
      // Tout en gras : les traits fins sortent pâles ou coupés sur papier thermique.
      ctx.font = `bold ${size * scale}px ${FONT}`;
      // Chaque caractère est placé à sa colonne : l'alignement des prix reste juste quelle que soit la police.
      [...r.text].forEach((ch, i) => {
        if (ch === " ") return;
        ctx.save();
        ctx.translate(SIDE + i * charW * scale, y + 2);
        ctx.scale(1, STRETCH);
        ctx.fillText(ch, 0, 0);
        ctx.restore();
      });
    }
    y += rowH(r);
  }
  // Un point au bas du ticket : certaines apps rognent le blanc final, ce point garde la marge.
  ctx.fillRect(w / 2, height - 2, 1, 1);

  // Noir ou blanc, sans gris : l'imprimante tramerait les bords gris des lettres et le texte serait flou.
  const img = ctx.getImageData(0, 0, w, height);
  const px = img.data;
  for (let i = 0; i < px.length; i += 4) {
    const v = px[i] * 0.3 + px[i + 1] * 0.59 + px[i + 2] * 0.11 < 150 ? 0 : 255;
    px[i] = px[i + 1] = px[i + 2] = v;
    px[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);

  const data = atob(canvas.toDataURL("image/png").split(",")[1]);
  const bytes = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) bytes[i] = data.charCodeAt(i);
  return new File([bytes], `${name}.png`, { type: "image/png" });
}
