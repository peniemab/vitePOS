// Captures d'écran de l'aperçu, avec la vraie taille d'un téléphone, d'une tablette ou d'un ordinateur.
// Pilote Chrome par son protocole de développement (comme l'outil « appareil mobile » du navigateur).
// Usage : node preview/capture.mjs [préfixe]   (l'aperçu doit tourner : npx vite --config preview/vite.config.ts)
//   node preview/capture.mjs man-   → seulement les captures du manuel
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CHROME = process.env.CHROME ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = "http://localhost:5183";
const OUT = new URL("../design/captures/", import.meta.url);
// Copies légères (WebP) pour le site de présentation.
const SITE = new URL("../site/public/captures/", import.meta.url);
const PORT = 9333;

const DEVICES = {
  tel: { width: 390, height: 844, deviceScaleFactor: 3, mobile: true },
  tablette: { width: 1180, height: 820, deviceScaleFactor: 2, mobile: true },
  ordi: { width: 1440, height: 900, deviceScaleFactor: 2, mobile: false },
};

/** Petites actions jouées dans la page avant la photo (mêmes gestes qu'un utilisateur). */
const HELPERS = `
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const btn = (re) => [...document.querySelectorAll("button, a, label")].find((b) => re.test(b.textContent.trim()));
  const tap = async (re, ms = 700) => { btn(re)?.click(); await wait(ms); };
  const type = async (sel, value, ms = 400) => {
    const el = document.querySelector(sel);
    const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
    el.focus(); set.call(el, value); el.dispatchEvent(new Event("input", { bubbles: true })); await wait(ms);
  };
  const enter = async (sel, ms = 900) => {
    document.querySelector(sel).dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true })); await wait(ms);
  };
  const reveal = async (re, ms = 500) => {
    [...document.querySelectorAll("h1,h2,h3,h4,label,p,div")].reverse().find((e) => re.test(e.textContent.trim()))?.scrollIntoView({ block: "start" });
    await wait(ms);
  };
`;

// [nom, appareil, adresse, action facultative (code joué dans la page avant la capture)]
const SHOTS = [
  ["tel-accueil", "tel", "/"],
  ["tel-caisse", "tel", "/caisse?panier=1"],
  ["tel-ticket", "tel", "/ticket/demoK7Q9M4"],
  ["tel-stock", "tel", "/stock"],
  ["tablette-caisse", "tablette", "/caisse?panier=1"],
  ["ordi-rapports", "ordi", "/rapports"],
  ["ordi-journee", "ordi", "/journee"],
  ["ordi-ventes", "ordi", "/ventes"],
  ["ordi-stock", "ordi", "/stock"],

  // Manuel de l'utilisateur (site/src/pages/manuel.astro)
  ["man-installer", "tel", "/?installer=1"],
  ["man-parametres", "tel", "/parametres"],
  ["man-equipe", "tel", "/equipe"],
  ["man-fiche", "tel", "/stock", `await tap(/^Coca-Cola 33 cl/, 900); await reveal(/^Emballages/);`],
  ["man-reception", "tel", "/stock", `await type("input[placeholder^='Nom, code article']", "15449000000993"); await enter("input[placeholder^='Nom, code article']"); await type("[role=dialog] input[inputmode=decimal]", "3");`],
  ["man-journee", "tel", "/journee"],
  ["man-encaisser", "tel", "/caisse?panier=1", `await tap(/^Encaisser$/); await tap(/^25\\s000$/, 500);`],
  ["man-depense", "tel", "/depenses", `await tap(/^Nouvelle dépense$/, 900);`],
  ["man-cloture", "tel", "/journee", `await reveal(/^Clôture$/);`],
  ["man-inventaire", "tel", "/inventaire"],
  ["man-rapports", "tel", "/rapports"],
];

const ONLY = process.argv[2] || "";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  mkdirSync(OUT, { recursive: true });
  mkdirSync(SITE, { recursive: true });
  const profile = join(tmpdir(), `vitepos-capture-${Date.now()}`);
  const chrome = spawn(CHROME, ["--headless=new", "--hide-scrollbars", "--no-first-run", `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, "about:blank"], {
    stdio: "ignore",
  });
  try {
    let version;
    for (let i = 0; i < 50 && !version; i++) {
      try {
        version = await (await fetch(`http://127.0.0.1:${PORT}/json/version`)).json();
      } catch {
        await sleep(200);
      }
    }
    if (!version) throw new Error("Chrome ne répond pas.");

    for (const [name, device, path, run] of SHOTS.filter(([n]) => n.startsWith(ONLY))) {
      const target = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: "PUT" })).json();
      const ws = new WebSocket(target.webSocketDebuggerUrl);
      await new Promise((r) => ws.addEventListener("open", r, { once: true }));
      let id = 0;
      const pending = new Map();
      ws.addEventListener("message", (e) => {
        const msg = JSON.parse(e.data);
        if (msg.id && pending.has(msg.id)) {
          pending.get(msg.id)(msg);
          pending.delete(msg.id);
        }
      });
      const send = (method, params = {}) =>
        new Promise((resolve) => {
          const n = ++id;
          pending.set(n, resolve);
          ws.send(JSON.stringify({ id: n, method, params }));
        });

      await send("Emulation.setDeviceMetricsOverride", DEVICES[device]);
      if (DEVICES[device].mobile) await send("Emulation.setTouchEmulationEnabled", { enabled: true });
      await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: "light" }] });
      await send("Page.enable");
      await send("Page.navigate", { url: BASE + path });
      await sleep(3500);
      if (run) {
        await send("Runtime.evaluate", { expression: `(async () => { ${HELPERS} ${run} })()`, awaitPromise: true });
        await sleep(400);
      }
      const shot = await send("Page.captureScreenshot", { format: "png" });
      writeFileSync(new URL(`${name}.png`, OUT), Buffer.from(shot.result.data, "base64"));
      const light = await send("Page.captureScreenshot", { format: "webp", quality: 82 });
      writeFileSync(new URL(`${name}.webp`, SITE), Buffer.from(light.result.data, "base64"));
      console.log("capturé :", name);
      ws.close();
      await fetch(`http://127.0.0.1:${PORT}/json/close/${target.id}`);
    }
  } finally {
    chrome.kill();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
