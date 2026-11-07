// Film de démonstration de l'app pour le site (« Voir comment ça marche ») : pilote l'aperçu dans Chrome comme
// un vrai utilisateur (taille téléphone) et enregistre l'écran image par image, avec le texte affiché à chaque moment.
// Usage : l'aperçu tourne (npx vite --config preview/vite.config.ts), puis
//   node preview/video.mjs            → images dans design/video/frames + design/video/timeline.json
//   python design/video/compose.py    → design/video/out/demo-fr.mp4 (puis copié dans site/public/video/)
import { spawn } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CHROME = process.env.CHROME ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = "http://localhost:5183";
const DIR = new URL("../design/video/", import.meta.url);
const FRAMES = new URL("frames/", DIR);
const PORT = 9334;
const DEVICE = { width: 390, height: 844, deviceScaleFactor: 2, mobile: true };

/** Gestes joués dans la page : un rond montre où le doigt touche, puis on clique. */
const HELPERS = `
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const find = (re, scope = document) => [...scope.querySelectorAll("button, a, label, [role=button]")].find((b) => re.test(b.textContent.trim()));
  const finger = (el) => {
    const r = el.getBoundingClientRect();
    const d = document.createElement("div");
    d.style.cssText = "position:fixed;z-index:99999;pointer-events:none;width:46px;height:46px;margin:-23px 0 0 -23px;border-radius:50%;" +
      "background:rgba(255,77,82,.35);border:3px solid rgba(255,77,82,.9);transition:transform .35s ease,opacity .35s ease;" +
      "left:" + (r.left + r.width / 2) + "px;top:" + (r.top + r.height / 2) + "px";
    document.body.appendChild(d);
    setTimeout(() => { d.style.transform = "scale(1.6)"; d.style.opacity = "0"; }, 380);
    setTimeout(() => d.remove(), 800);
  };
  const tap = async (re, ms = 900, scope) => {
    const el = find(re, scope && document.querySelector(scope));
    if (!el) throw new Error("introuvable : " + re);
    el.scrollIntoView({ block: "nearest" });
    finger(el); await wait(330); el.click(); await wait(ms);
  };
  const go = async (path, ms = 1200) => { history.pushState({}, "", path); dispatchEvent(new PopStateEvent("popstate")); await wait(ms); };
  const glide = async (y, ms = 1000) => { window.scrollTo({ top: y, behavior: "smooth" }); await wait(ms); };
`;

// [texte affiché, durée minimale en secondes, gestes]
const SCENES = [
  ["Votre téléphone devient la caisse de votre business", 3.2, ``],
  ["1. Touchez les articles vendus", 6, `
    await tap(/^Caisse$/, 1400);
    await tap(/^Coca-Cola 33 cl/, 700); await tap(/^À l'unité/, 800);
    await tap(/^HM\\s*Huile Mama 1 L/, 900);
    await tap(/^Riz parfumé 1 kg/, 900);`],
  ["2. Le client paie en FC, en $ ou en mobile money", 4.5, `
    await tap(/^Encaisser$/, 1300);
    await tap(/^en \\$$/, 1200, "[role=dialog]");`],
  ["La monnaie à rendre est calculée pour vous", 3.8, `
    await tap(/^5,00$/, 2200, "[role=dialog]");`],
  ["3. La vente est enregistrée, le ticket est prêt", 4.5, `
    await tap(/^Valider la vente$/, 1800);
    await glide(260, 1400);`],
  ["Le stock baisse tout seul, à chaque vente", 4.2, `
    window.scrollTo(0, 0);
    await go("/stock", 2600);`],
  ["Pas de réseau ? Vous continuez à vendre", 6, `
    Object.defineProperty(navigator, "onLine", { configurable: true, get: () => false });
    dispatchEvent(new Event("offline"));
    await go("/caisse", 1500);
    await tap(/^Eau 1,5 L/, 900);
    await tap(/^Encaisser$/, 1300);
    await tap(/^1 500$/, 900, "[role=dialog]");
    await tap(/^Valider la vente$/, 1800);`],
  ["Le soir, vous savez ce qui doit être dans la caisse", 5, `
    Object.defineProperty(navigator, "onLine", { configurable: true, get: () => true });
    dispatchEvent(new Event("online"));
    window.scrollTo(0, 0);
    await go("/journee", 2500);
    await glide(200, 1500);`],
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  rmSync(FRAMES, { recursive: true, force: true });
  mkdirSync(FRAMES, { recursive: true });
  const profile = join(tmpdir(), `vitepos-video-${Date.now()}`);
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
    const target = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: "PUT" })).json();
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((r) => ws.addEventListener("open", r, { once: true }));
    let id = 0;
    const pending = new Map();
    const frames = [];
    const t0 = Date.now();
    const now = () => (Date.now() - t0) / 1000;
    ws.addEventListener("message", (e) => {
      const msg = JSON.parse(e.data);
      if (msg.id && pending.has(msg.id)) {
        pending.get(msg.id)(msg);
        pending.delete(msg.id);
      } else if (msg.method === "Page.screencastFrame") {
        const n = frames.length;
        const file = `f${String(n).padStart(5, "0")}.jpg`;
        writeFileSync(new URL(file, FRAMES), Buffer.from(msg.params.data, "base64"));
        frames.push({ t: now(), file });
        ws.send(JSON.stringify({ id: ++id, method: "Page.screencastFrameAck", params: { sessionId: msg.params.sessionId } }));
      }
    });
    const send = (method, params = {}) =>
      new Promise((resolve) => {
        const n = ++id;
        pending.set(n, resolve);
        ws.send(JSON.stringify({ id: n, method, params }));
      });

    await send("Emulation.setDeviceMetricsOverride", DEVICE);
    await send("Emulation.setTouchEmulationEnabled", { enabled: true });
    await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: "light" }] });
    await send("Page.enable");
    await send("Page.navigate", { url: BASE + "/" });
    await sleep(4000);

    const captions = [];
    const start = now();
    // Photos d'écran en continu, en pleine définition (le « screencast » de Chrome sans interface reste en basse définition).
    let filming = true;
    const film = (async () => {
      while (filming) {
        const t = now();
        const shot = await send("Page.captureScreenshot", { format: "jpeg", quality: 88 });
        const file = `f${String(frames.length).padStart(5, "0")}.jpg`;
        writeFileSync(new URL(file, FRAMES), Buffer.from(shot.result.data, "base64"));
        frames.push({ t, file });
      }
    })();
    for (const [text, min, run] of SCENES) {
      const from = now();
      captions.push({ from: from - start, text });
      if (run) {
        const r = await send("Runtime.evaluate", { expression: `(async () => { ${HELPERS} ${run} })()`, awaitPromise: true });
        if (r.result?.exceptionDetails) throw new Error(`${text} : ${r.result.exceptionDetails.exception?.description}`);
      }
      const left = min - (now() - from);
      if (left > 0) await sleep(left * 1000);
      console.log("scène :", text);
    }
    const end = now() - start;
    filming = false;
    await film;
    const kept = frames.filter((f) => f.t >= start).map((f) => ({ ...f, t: f.t - start }));
    // Image de départ : la dernière reçue avant le début (l'écran n'envoie rien tant qu'il ne bouge pas).
    const before = frames.filter((f) => f.t < start).at(-1);
    if (before) kept.unshift({ ...before, t: 0 });
    writeFileSync(new URL("timeline.json", DIR), JSON.stringify({ duration: end, captions, frames: kept }, null, 1));
    console.log(`${kept.length} images, ${end.toFixed(1)} s`);
    ws.close();
  } finally {
    chrome.kill();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
