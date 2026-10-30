/**
 * Ticket en image PNG, à la largeur exacte du papier (384 points pour 58 mm, 576 pour 80 mm à 203 dpi),
 * pour le partager vers une app d'impression comme Thermer sur iPhone.
 * Tout est synchrone : iPhone n'ouvre le partage que juste après le geste de l'utilisateur.
 */
import { receiptRows, type PaperWidth, type ReceiptLine } from "../lib/receipt";

const DOTS: Record<PaperWidth, number> = { 58: 384, 80: 576 };
const MARGIN = 8;

export function receiptImageFile(lines: ReceiptLine[], width: PaperWidth, name: string): File {
  const rows = receiptRows(lines, width);
  const w = DOTS[width];
  const cols = width === 80 ? 48 : 32;
  // Police à chasse fixe : un caractère occupe toujours la même largeur, comme sur le papier.
  const charW = (w - MARGIN * 2) / cols;
  const size = charW / 0.6;
  const lineH = Math.round(size * 1.3);
  const height = rows.reduce((h, r) => h + (r.big ? lineH * 2 : lineH), MARGIN * 2) + lineH;

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Impossible de préparer l'image du ticket.");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, w, height);
  ctx.fillStyle = "#000";
  ctx.textBaseline = "top";

  let y = MARGIN;
  for (const r of rows) {
    const s = r.big ? size * 2 : size;
    ctx.font = `${r.bold ? "bold " : ""}${s}px "Courier New", Courier, monospace`;
    // Chaque caractère est placé à sa colonne : l'alignement des prix reste juste quelle que soit la police.
    const step = r.big ? charW * 2 : charW;
    [...r.text].forEach((ch, i) => ctx.fillText(ch, MARGIN + i * step, y));
    y += r.big ? lineH * 2 : lineH;
  }

  const data = atob(canvas.toDataURL("image/png").split(",")[1]);
  const bytes = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) bytes[i] = data.charCodeAt(i);
  return new File([bytes], `${name}.png`, { type: "image/png" });
}
