// Fait les images des QR codes des supports imprimés : site/public/qr/<code>.svg → https://viteposrdc.com/q/<code>.
// Liste : site/src/data/qr-codes.json. Usage : node scripts/gen-qr.mjs
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync } from "node:fs";

const { codes } = JSON.parse(readFileSync("site/src/data/qr-codes.json", "utf8"));
mkdirSync("site/public/qr", { recursive: true });
for (const { code } of codes) {
  const url = `https://viteposrdc.com/q/${code}`;
  execFileSync(
    "npx",
    ["-y", "qrcode@1.5.4", "-t", "svg", "-d", "#1a2b4c", "-l", "#ffffff", "-q", "1", "-e", "M", "-o", `site/public/qr/${code}.svg`, url],
    { stdio: "inherit", shell: process.platform === "win32" },
  );
  console.log(code, "→", url);
}
