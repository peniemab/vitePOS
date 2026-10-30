/**
 * Images en noir et blanc pour les tickets (logo, QR code, code-barres) : un point par point de l'imprimante
 * (203 dpi : 384 points sur 58 mm, 576 sur 80 mm). Sans React ni Firebase.
 */
import QRCode from "qrcode";

/** Image 1 bit : `data[y * width + x]` vaut 1 pour un point noir. */
export interface Bitmap {
  width: number;
  height: number;
  data: Uint8Array;
}

/** Logo enregistré dans la boutique : bits tassés par 8 (ligne après ligne) puis en base64. */
export interface PackedBitmap {
  w: number;
  h: number;
  bits: string;
}

export function blank(width: number, height: number): Bitmap {
  return { width, height, data: new Uint8Array(width * height) };
}

export function pack(b: Bitmap): PackedBitmap {
  const bytes = new Uint8Array(Math.ceil((b.width * b.height) / 8));
  b.data.forEach((v, i) => {
    if (v) bytes[i >> 3] |= 0x80 >> (i & 7);
  });
  let s = "";
  for (const x of bytes) s += String.fromCharCode(x);
  return { w: b.width, h: b.height, bits: btoa(s) };
}

export function unpack(p: PackedBitmap): Bitmap {
  const s = atob(p.bits);
  const out = blank(p.w, p.h);
  for (let i = 0; i < out.data.length; i++) out.data[i] = (s.charCodeAt(i >> 3) >> (7 - (i & 7))) & 1;
  return out;
}

/**
 * Niveaux de gris (0 noir … 255 blanc) vers noir et blanc : tout ce qui est plus sombre que `threshold` devient
 * noir. Avec `dither` (photos), les dégradés deviennent une trame de points (Floyd-Steinberg).
 */
export function toBitmap(gray: Float32Array | number[], width: number, height: number, dither: boolean, threshold = 128): Bitmap {
  const g = Float32Array.from(gray);
  const out = blank(width, height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      const black = g[i] < (dither ? 128 : threshold);
      out.data[i] = black ? 1 : 0;
      if (!dither) continue;
      const err = g[i] - (black ? 0 : 255);
      if (x + 1 < width) g[i + 1] += (err * 7) / 16;
      if (y + 1 < height) {
        if (x > 0) g[i + width - 1] += (err * 3) / 16;
        g[i + width] += (err * 5) / 16;
        if (x + 1 < width) g[i + width + 1] += err / 16;
      }
    }
  }
  return out;
}

/** QR code d'au plus `maxDots` points de côté (marge blanche comprise), carrés nets d'un nombre entier de points. */
export function qrBitmap(text: string, maxDots: number): Bitmap {
  const { modules } = QRCode.create(text, { errorCorrectionLevel: "M" });
  const n = modules.size;
  const quiet = 2;
  const scale = Math.max(1, Math.floor(maxDots / (n + quiet * 2)));
  const side = (n + quiet * 2) * scale;
  const out = blank(side, side);
  for (let r = 0; r < n; r++)
    for (let c = 0; c < n; c++)
      if (modules.get(r, c))
        for (let dy = 0; dy < scale; dy++)
          out.data.fill(1, ((r + quiet) * scale + dy) * side + (c + quiet) * scale, ((r + quiet) * scale + dy) * side + (c + quiet + 1) * scale);
  return out;
}

/* ---------- Code-barres Code 128 (jeu B : chiffres, lettres, ponctuation) ---------- */

/** Largeurs barre / espace des 107 symboles Code 128. */
const CODE128 = (
  "212222 222122 222221 121223 121322 131222 122213 122312 132212 221213 221312 231212 112232 122132 122231 113222 " +
  "123122 123221 223211 221132 221231 213212 223112 312131 311222 321122 321221 312212 322112 322211 212123 212321 " +
  "232121 111323 131123 131321 112313 132113 132311 211313 231113 231311 112133 112331 132131 113123 113321 133121 " +
  "313121 211331 231131 213113 213311 213131 311123 311321 331121 312113 312311 332111 314111 221411 431111 111224 " +
  "111422 121124 121421 141122 141221 112214 112412 122114 122411 142112 142211 241211 221114 413111 241112 134111 " +
  "111242 121142 121241 114212 124112 124211 411212 421112 421211 212141 214121 412121 111143 111341 131141 114113 " +
  "114311 411113 411311 113141 114131 311141 411131 211412 211214 211232 2331112"
).split(" ");
const START_B = 104;
const STOP = 106;

/** Largeurs des barres et espaces (en modules) du code-barres, marges blanches non comprises. */
export function code128Widths(value: string): number[] {
  const codes = [START_B];
  for (const ch of value) {
    const c = ch.charCodeAt(0);
    if (c < 32 || c > 127) throw new Error(`Caractère impossible dans un code-barres : ${ch}`);
    codes.push(c - 32);
  }
  codes.push(codes.reduce((sum, c, i) => sum + c * Math.max(i, 1), 0) % 103, STOP);
  return codes.flatMap((c) => [...CODE128[c]].map(Number));
}

/** Code-barres d'au plus `maxDots` points de large et `height` de haut, marges blanches comprises. */
export function code128Bitmap(value: string, maxDots: number, height: number): Bitmap {
  const widths = code128Widths(value);
  const modules = widths.reduce((a, b) => a + b, 0) + 20; // 10 modules de marge de chaque côté
  const scale = Math.max(1, Math.min(3, Math.floor(maxDots / modules)));
  const out = blank(modules * scale, height);
  let x = 10 * scale;
  widths.forEach((w, i) => {
    if (i % 2 === 0) for (let y = 0; y < height; y++) out.data.fill(1, y * out.width + x, y * out.width + x + w * scale);
    x += w * scale;
  });
  return out;
}

/* ---------- Impression ESC/POS ---------- */

/**
 * Commande « image tramée » (GS v 0) qui imprime l'image centrée sur un papier de `paperDots` points.
 * Le blanc de gauche fait partie de l'image : toutes les imprimantes ne savent pas centrer une image.
 */
export function escPosRaster(b: Bitmap, paperDots: number): number[] {
  const left = Math.max(0, Math.floor((paperDots - b.width) / 2 / 8)) * 8;
  const bytesPerRow = Math.ceil((left + b.width) / 8);
  const out = [0x1d, 0x76, 0x30, 0, bytesPerRow & 0xff, bytesPerRow >> 8, b.height & 0xff, b.height >> 8];
  for (let y = 0; y < b.height; y++) {
    const row = new Array<number>(bytesPerRow).fill(0);
    for (let x = 0; x < b.width; x++) if (b.data[y * b.width + x]) row[(left + x) >> 3] |= 0x80 >> ((left + x) & 7);
    out.push(...row);
  }
  return out;
}
