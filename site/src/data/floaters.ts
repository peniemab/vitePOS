/**
 * Objets du commerce qui flottent dans le fond du site : pièces FC, $ et €, pile de pièces, étiquette code-barres,
 * ticket de caisse, carton, téléphone avec l'app, étiquette de prix. Dessinés en SVG (aucune image à charger).
 */

/**
 * Pièce de monnaie en relief : dégradé métallique, tranche, anneau crénelé et signe frappé au centre.
 * `metal` : or, argent ou cuivre.
 */
const METALS = {
  gold: ["#fff1b8", "#e9bb45", "#a8770f", "#7a5408"],
  silver: ["#ffffff", "#c9d1dd", "#8b96a8", "#5b6577"],
  copper: ["#ffd9b8", "#d98a4e", "#9a5524", "#6d3815"],
} as const;
function coin(id: string, metal: keyof typeof METALS, sign: string) {
  const [light, mid, dark, ink] = METALS[metal];
  const size = sign.length > 1 ? 19 : 26;
  return `<svg viewBox="0 0 72 76" xmlns="http://www.w3.org/2000/svg">
<defs><radialGradient id="${id}" cx=".35" cy=".3" r=".85"><stop offset="0" stop-color="${light}"/><stop offset=".55" stop-color="${mid}"/><stop offset="1" stop-color="${dark}"/></radialGradient></defs>
<ellipse cx="36" cy="40" rx="34" ry="34" fill="${dark}"/>
<circle cx="36" cy="36" r="34" fill="url(#${id})"/>
<circle cx="36" cy="36" r="27" fill="none" stroke="${ink}" stroke-opacity=".45" stroke-width="1.5" stroke-dasharray="2.5 2.5"/>
<circle cx="36" cy="36" r="22" fill="none" stroke="${light}" stroke-opacity=".6" stroke-width="1"/>
<text x="36" y="${36 + size * 0.36}" text-anchor="middle" font-family="Georgia,serif" font-size="${size}" font-weight="700" fill="${ink}">${sign}</text>
</svg>`;
}

/** Petite pile de pièces d'or, vue de côté. */
function coinStack() {
  const layer = (y: number) =>
    `<ellipse cx="40" cy="${y + 6}" rx="32" ry="10" fill="#a8770f"/><rect x="8" y="${y}" width="64" height="6" fill="#c9952a"/><ellipse cx="40" cy="${y}" rx="32" ry="10" fill="url(#stack-g)"/>`;
  return `<svg viewBox="0 0 80 70" xmlns="http://www.w3.org/2000/svg">
<defs><linearGradient id="stack-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff1b8"/><stop offset="1" stop-color="#e2ac35"/></linearGradient></defs>
${[52, 42, 32, 22].map(layer).join("")}
<text x="40" y="26" text-anchor="middle" font-family="Georgia,serif" font-size="11" font-weight="700" fill="#7a5408">FC</text>
</svg>`;
}

/** Étiquette code-barres EAN : barres de largeurs variées et chiffres dessous. */
function barcode() {
  const widths = [2, 1, 1, 3, 1, 2, 1, 1, 2, 3, 1, 1, 2, 1, 3, 1, 2, 2, 1, 1, 3, 1, 2, 1, 1, 2, 1, 3, 1, 1, 2, 1, 2, 3, 1, 1, 2];
  let x = 12;
  const bars = widths
    .map((w, i) => {
      const bar = i % 2 === 0 ? `<rect x="${x}" y="10" width="${w * 1.6}" height="${i < 3 || i > widths.length - 4 ? 46 : 40}" fill="#111"/>` : "";
      x += w * 1.6 + 0.6;
      return bar;
    })
    .join("");
  return `<svg viewBox="0 0 120 72" xmlns="http://www.w3.org/2000/svg">
<rect x="1" y="1" width="118" height="70" rx="6" fill="#fff"/>${bars}
<text x="60" y="64" text-anchor="middle" font-family="'Courier New',monospace" font-size="10" letter-spacing="1" fill="#111">5449000000996</text>
</svg>`;
}

/** Ticket de caisse : papier blanc, bas dentelé, lignes d'articles et total. */
function receipt() {
  // Bas dentelé, de droite à gauche : 10 dents de 8 px entre x = 86 et x = 6.
  const zig = Array.from({ length: 10 }, (_, i) => `L${86 - i * 8 - 4},126 L${86 - (i + 1) * 8},120`).join(" ");
  return `<svg viewBox="0 0 92 130" xmlns="http://www.w3.org/2000/svg">
<path d="M6 4 H86 V120 ${zig} Z" fill="#fbfbf7"/>
<rect x="30" y="12" width="32" height="6" rx="2" fill="#1a2b4c"/>
<rect x="14" y="26" width="64" height="2" fill="#c9ced8"/>
<rect x="14" y="36" width="40" height="4" rx="1" fill="#8a93a6"/><rect x="62" y="36" width="16" height="4" rx="1" fill="#8a93a6"/>
<rect x="14" y="46" width="32" height="4" rx="1" fill="#8a93a6"/><rect x="62" y="46" width="16" height="4" rx="1" fill="#8a93a6"/>
<rect x="14" y="56" width="44" height="4" rx="1" fill="#8a93a6"/><rect x="62" y="56" width="16" height="4" rx="1" fill="#8a93a6"/>
<rect x="14" y="66" width="36" height="4" rx="1" fill="#8a93a6"/><rect x="62" y="66" width="16" height="4" rx="1" fill="#8a93a6"/>
<rect x="14" y="78" width="64" height="1.5" fill="#c9ced8"/>
<rect x="14" y="86" width="24" height="6" rx="1" fill="#1a2b4c"/><rect x="50" y="86" width="28" height="6" rx="1" fill="#b6171e"/>
<g fill="#1a2b4c">${[0, 2, 3, 5, 7, 8, 10, 12, 13, 15, 17, 18, 20, 22, 24].map((i) => `<rect x="${20 + i * 2.4}" y="100" width="1.4" height="10"/>`).join("")}</g>
</svg>`;
}

/** Carton de marchandise, en perspective, avec son ruban adhésif. */
function box() {
  return `<svg viewBox="0 0 110 100" xmlns="http://www.w3.org/2000/svg">
<path d="M55 6 L104 28 L55 50 L6 28 Z" fill="#d9a46a"/>
<path d="M6 28 L55 50 L55 96 L6 74 Z" fill="#b97f45"/>
<path d="M104 28 L55 50 L55 96 L104 74 Z" fill="#c98f53"/>
<path d="M30 17 L79 39 L79 47 L30 25 Z" fill="#e8c493" opacity=".9"/>
</svg>`;
}

/** Téléphone avec l'écran de caisse vitePOS (en-tête bleu nuit, articles, total rouge). */
function phone() {
  return `<svg viewBox="0 0 64 120" xmlns="http://www.w3.org/2000/svg">
<rect x="1" y="1" width="62" height="118" rx="10" fill="#11161f"/>
<rect x="5" y="8" width="54" height="104" rx="6" fill="#f4f6fa"/>
<rect x="5" y="8" width="54" height="14" rx="6" fill="#1a2b4c"/><rect x="5" y="16" width="54" height="6" fill="#1a2b4c"/>
<path d="M10 12 h4 l2 6 l2 -6 h4 l-5 9 h-2 z" fill="#fff"/><circle cx="25" cy="12.5" r="1.4" fill="#b6171e"/>
${[0, 1, 2].map((r) => `<rect x="9" y="${28 + r * 22}" width="21" height="18" rx="3" fill="#fff" stroke="#dde2ec"/><rect x="34" y="${28 + r * 22}" width="21" height="18" rx="3" fill="#fff" stroke="#dde2ec"/>`).join("")}
<rect x="9" y="96" width="46" height="10" rx="3" fill="#b6171e"/>
</svg>`;
}

/** Étiquette de prix en carton, avec son œillet et sa ficelle. */
function priceTag() {
  return `<svg viewBox="0 0 120 64" xmlns="http://www.w3.org/2000/svg">
<path d="M2 20 Q-2 2 18 6" fill="none" stroke="#d8c9a8" stroke-width="2"/>
<path d="M22 4 H112 a6 6 0 0 1 6 6 V54 a6 6 0 0 1 -6 6 H22 L4 32 Z" fill="#f2b705"/>
<circle cx="20" cy="32" r="5" fill="#0f1f42"/>
<text x="70" y="40" text-anchor="middle" font-family="Arial,sans-serif" font-size="18" font-weight="800" fill="#1a2b4c">2 500 FC</text>
</svg>`;
}

/** Les objets, avec leur largeur d'affichage de base (px). L'argent est représenté par des pièces. */
export const floaterArt = [
  { svg: coin("coin-fc", "copper", "FC"), w: 54 },
  { svg: barcode(), w: 96 },
  { svg: coin("coin-usd", "gold", "$"), w: 50 },
  { svg: receipt(), w: 58 },
  { svg: coinStack(), w: 70 },
  { svg: box(), w: 80 },
  { svg: coin("coin-eur", "silver", "€"), w: 48 },
  { svg: phone(), w: 44 },
  { svg: priceTag(), w: 92 },
  { svg: coin("coin-fc-2", "gold", "FC"), w: 46 },
];
