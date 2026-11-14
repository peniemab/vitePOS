// Remet à zéro le mot de passe d'un compte (support : « j'ai oublié mon mot de passe »).
// Utile surtout pour les comptes par numéro de téléphone, qui n'ont pas d'e-mail pour le lien habituel.
//
// Usage : node scripts/reset-password.mjs <numéro ou e-mail> <nouveau mot de passe>
//   ex. node scripts/reset-password.mjs "0812 345 678" kin2026
//
// Clé du compte de service Firebase (console Firebase → Paramètres du projet → Comptes de service →
// « Générer une nouvelle clé privée ») : dans .secrets/service-account.json (ignoré par Git),
// ou dans la variable GOOGLE_APPLICATION_CREDENTIALS. Ne jamais la mettre dans le dépôt.
import { existsSync, readFileSync } from "node:fs";
import { initializeApp, cert, applicationDefault } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const PROJECT = "vitepos-be79c";
const PHONE_DOMAIN = "tel.viteposrdc.com"; // même règle que src/lib/login.ts

/** Même conversion que l'app : un numéro congolais devient 243XXXXXXXXX@tel.viteposrdc.com. */
function loginEmail(raw) {
  const v = raw.trim();
  if (v.includes("@")) return v.toLowerCase();
  let d = v.replace(/\D/g, "");
  if (d.startsWith("00243")) d = d.slice(2);
  if (d.length === 12 && d.startsWith("243")) d = d.slice(3);
  else if (d.length === 10 && d.startsWith("0")) d = d.slice(1);
  if (!(d.length === 9 && /^[89]/.test(d))) return null;
  return `243${d}@${PHONE_DOMAIN}`;
}

const [who, password] = process.argv.slice(2);
if (!who || !password) {
  console.error('Usage : node scripts/reset-password.mjs <numéro ou e-mail> <nouveau mot de passe>');
  process.exit(1);
}
if (password.length < 6) {
  console.error("Le mot de passe doit contenir au moins 6 caractères.");
  process.exit(1);
}
const email = loginEmail(who);
if (!email) {
  console.error(`« ${who} » n'est ni un e-mail ni un numéro congolais valide.`);
  process.exit(1);
}

const keyFile = new URL("../.secrets/service-account.json", import.meta.url);
const credential = process.env.GOOGLE_APPLICATION_CREDENTIALS
  ? applicationDefault()
  : existsSync(keyFile)
    ? cert(JSON.parse(readFileSync(keyFile, "utf8")))
    : null;
if (!credential) {
  console.error("Clé introuvable : placez-la dans .secrets/service-account.json (voir l'en-tête du script).");
  process.exit(1);
}

initializeApp({ credential, projectId: PROJECT });
try {
  const user = await getAuth().getUserByEmail(email);
  await getAuth().updateUser(user.uid, { password });
  // Déconnecte les autres appareils : l'ancien mot de passe ne sert plus nulle part.
  await getAuth().revokeRefreshTokens(user.uid);
  console.log(`Mot de passe changé pour ${who} (${user.displayName || user.uid}).`);
  console.log("Envoyez-le au client par WhatsApp et conseillez-lui de le noter.");
} catch (e) {
  if (e?.code === "auth/user-not-found") console.error(`Aucun compte pour ${who}.`);
  else console.error(e?.message ?? e);
  process.exit(1);
}
