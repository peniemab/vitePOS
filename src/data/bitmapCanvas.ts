/**
 * Passage entre les images du navigateur et les images noir et blanc des tickets : préparation du logo choisi
 * par le propriétaire, et affichage à l'écran des logos, QR codes et codes-barres.
 */
import { pack, toBitmap, type Bitmap, type PackedBitmap } from "../lib/bitmap";

/** Taille maximale du logo sur le ticket, en points d'imprimante (environ 36 × 18 mm). */
const LOGO_MAX_W = 288;
const LOGO_MAX_H = 144;

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Cette image ne peut pas être lue. Essayez une photo ou une image PNG ou JPG."));
    };
    img.src = url;
  });
}

function grayOf(ctx: CanvasRenderingContext2D, w: number, h: number): Float32Array {
  const px = ctx.getImageData(0, 0, w, h).data;
  const g = new Float32Array(w * h);
  // Les zones transparentes comptent comme du blanc (papier).
  for (let i = 0; i < g.length; i++) {
    const a = px[i * 4 + 3] / 255;
    g[i] = (px[i * 4] * 0.3 + px[i * 4 + 1] * 0.59 + px[i * 4 + 2] * 0.11) * a + 255 * (1 - a);
  }
  return g;
}

/**
 * Logo choisi par le propriétaire → image noir et blanc prête pour le ticket : marges blanches retirées,
 * mis à la bonne taille, dégradés tramés.
 */
export async function logoFromFile(file: File): Promise<PackedBitmap> {
  const img = await loadImage(file);
  const src = document.createElement("canvas");
  src.width = img.naturalWidth;
  src.height = img.naturalHeight;
  const sctx = src.getContext("2d", { willReadFrequently: true });
  if (!sctx) throw new Error("Impossible de préparer le logo.");
  sctx.drawImage(img, 0, 0);
  const g = grayOf(sctx, src.width, src.height);

  // Cadre du dessin : on retire le blanc autour.
  let x0 = src.width, y0 = src.height, x1 = -1, y1 = -1;
  for (let y = 0; y < src.height; y++)
    for (let x = 0; x < src.width; x++)
      if (g[y * src.width + x] < 235) {
        x0 = Math.min(x0, x);
        x1 = Math.max(x1, x);
        y0 = Math.min(y0, y);
        y1 = Math.max(y1, y);
      }
  if (x1 < 0) throw new Error("Ce logo est vide ou tout blanc.");
  const cw = x1 - x0 + 1;
  const ch = y1 - y0 + 1;
  const scale = Math.min(LOGO_MAX_W / cw, LOGO_MAX_H / ch, 1);
  const w = Math.max(1, Math.round(cw * scale));
  const h = Math.max(1, Math.round(ch * scale));

  const out = document.createElement("canvas");
  out.width = w;
  out.height = h;
  const octx = out.getContext("2d", { willReadFrequently: true });
  if (!octx) throw new Error("Impossible de préparer le logo.");
  octx.imageSmoothingQuality = "high";
  octx.drawImage(src, x0, y0, cw, ch, 0, 0, w, h);
  const gray = grayOf(octx, w, h);
  // Une photo a des milliers de teintes : on la trame. Un logo en aplats de couleur en a peu : chaque couleur
  // franche devient noire et le fond clair reste blanc, c'est bien plus net.
  const px = octx.getImageData(0, 0, w, h).data;
  const tints = new Set<number>();
  for (let i = 0; i < px.length; i += 4) tints.add(((px[i] >> 3) << 10) | ((px[i + 1] >> 3) << 5) | (px[i + 2] >> 3));
  const photo = tints.size > 1500;
  return pack(toBitmap(gray, w, h, photo, 190));
}

/** Image noir et blanc → adresse d'image affichable (`<img src>`). */
export function bitmapDataUrl(b: Bitmap): string {
  const c = document.createElement("canvas");
  c.width = b.width;
  c.height = b.height;
  const ctx = c.getContext("2d");
  if (!ctx) return "";
  const img = ctx.createImageData(b.width, b.height);
  b.data.forEach((v, i) => {
    const k = v ? 0 : 255;
    img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = k;
    img.data[i * 4 + 3] = 255;
  });
  ctx.putImageData(img, 0, 0);
  return c.toDataURL("image/png");
}
