// Capture des planches « écrans mobiles » du portfolio (2000 px de large) avec Chrome sans interface.
// Prérequis : l'aperçu de l'app (données fictives, aucune connexion à Firebase) lancé dans ce projet :
//   npx vite --config preview/vite.config.ts
// Usage : node mockups/capture.mjs [dossier de sortie]
import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";

const CHROME = process.env.CHROME || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = "http://localhost:5183";
const OUT = resolve(process.argv[2] || "mockups/out");
mkdirSync(OUT, { recursive: true });

// [fichier, page, hauteur CSS, largeur CSS, échelle] : sortie en 2000 px de large
const shots = [
  ["mobile", "/mockups/mobile.html?set=1", 1200, 1585, 2000 / 1585],
  ["mobile-2", "/mockups/mobile.html?set=2", 1200, 1585, 2000 / 1585],
];

for (const [name, path, h, w, scale] of shots) {
  const file = join(OUT, name + ".png");
  execFileSync(
    CHROME,
    [
      "--headless=new",
      "--disable-gpu",
      "--hide-scrollbars",
      // Profil neuf à chaque capture : le stockage du navigateur ne garde rien d'une planche à l'autre.
      `--user-data-dir=${join(tmpdir(), `chrome-mockups-${name}-${Date.now()}`)}`,
      `--window-size=${w},${h}`,
      `--force-device-scale-factor=${scale}`,
      // Les trois écrans se chargent l'un après l'autre (environ 3 s chacun).
      "--virtual-time-budget=25000",
      `--screenshot=${file}`,
      BASE + path,
    ],
    { stdio: "ignore" },
  );
  console.log("capturé :", file);
}
