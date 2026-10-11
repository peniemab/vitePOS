// Génère le favicon, le logo et les icônes de l'application à partir du symbole vitePOS
// (dessiné dans Google Stitch, sources dans design/logo-stitch/).
// Usage : node scripts/gen-icons.mjs
import { writeFileSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";

const NAVY = "#1A2B4C";
const RED = "#B6171E";

/** Le symbole, centré sur l'origine, dans une boîte d'environ 260 × 290. */
function symbol(vColor) {
  return `<path d="M-130,-105 L-60,-105 L-20,60 L50,-105 L125,-105 L10,125 C-2,145 -18,155 -35,155 C-52,155 -68,145 -80,125 Z" fill="${vColor}"/>
<polygon points="-15,-30 40,-130 95,-130 15,20" fill="${RED}"/>
<circle cx="85" cy="-70" r="14" fill="${RED}"/>`;
}

/** Icône carrée 512 : fond bleu nuit (arrondi ou plein) et symbole blanc, réduit de `scale`. */
function icon({ rounded = true, scale = 1 } = {}) {
  const bg = `<rect width="512" height="512"${rounded ? ' rx="112"' : ""} fill="${NAVY}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${bg}<g transform="translate(256 256) scale(${scale})">${symbol("#FFFFFF")}</g></svg>\n`;
}

/** Symbole seul, sur fond transparent, pour les fonds clairs. */
const logo = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-140 -140 280 305">${symbol(NAVY)}</svg>\n`;

function png(svg, size, file) {
  const out = new Resvg(svg, { fitTo: { mode: "width", value: size } }).render().asPng();
  writeFileSync(new URL(`../public/${file}`, import.meta.url), out);
}

writeFileSync(new URL("../public/favicon.svg", import.meta.url), icon());
writeFileSync(new URL("../public/logo.svg", import.meta.url), logo);
png(icon(), 192, "pwa-192.png");
png(icon(), 512, "pwa-512.png");
// « Maskable » : Android découpe l'icône en cercle ou en goutte ; le symbole reste dans les 80 % du centre.
png(icon({ rounded: false, scale: 0.8 }), 512, "pwa-maskable-512.png");
// iPhone : fond plein, iOS arrondit lui-même les coins.
png(icon({ rounded: false, scale: 0.9 }), 180, "apple-touch-icon.png");
console.log("Icônes générées dans public/.");
