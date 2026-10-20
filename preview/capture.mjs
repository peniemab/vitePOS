// Captures d'écran de l'aperçu, avec la vraie taille d'un téléphone, d'une tablette ou d'un ordinateur.
// Pilote Chrome par son protocole de développement (comme l'outil « appareil mobile » du navigateur).
// Usage : node preview/capture.mjs   (l'aperçu doit tourner : npx vite --config preview/vite.config.ts)
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
];

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

    for (const [name, device, path] of SHOTS) {
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
