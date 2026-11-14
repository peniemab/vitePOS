/**
 * Connexion par numéro de téléphone et mot de passe, sans SMS (logique pure).
 *
 * Beaucoup de commerçants n'ont pas d'e-mail, mais tous ont un numéro. Le numéro est transformé
 * en adresse technique « 243812345678@tel.viteposrdc.com » pour le compte e-mail et mot de passe
 * de Firebase : gratuit (pas de SMS), et la personne ne voit jamais cette adresse.
 * Contrepartie : pas d'e-mail pour un mot de passe oublié, c'est le support qui le remet à zéro.
 */
import { formatPhone } from "./clients";

export const PHONE_LOGIN_DOMAIN = "tel.viteposrdc.com";

/** Numéro congolais en chiffres internationaux (« 243812345678 »), ou `null` s'il n'en est pas un. */
export function phoneDigits(raw: string): string | null {
  let d = raw.replace(/\D/g, "");
  if (raw.trim().startsWith("+") && !d.startsWith("243")) return null;
  if (d.startsWith("00243")) d = d.slice(2);
  if (d.length === 12 && d.startsWith("243")) d = d.slice(3);
  else if (d.length === 10 && d.startsWith("0")) d = d.slice(1);
  // Numéro local sans le 0 : 9 chiffres, commençant par 8 ou 9 (Vodacom, Airtel, Orange, Africell).
  return d.length === 9 && /^[89]/.test(d) ? `243${d}` : null;
}

/** Ce qu'on tape dans « Téléphone ou e-mail » : un e-mail reste tel quel, un numéro devient l'adresse technique. */
export function loginEmail(raw: string): { email: string; phone: boolean } | { error: string } {
  const v = raw.trim();
  if (!v) return { error: "Entrez votre numéro de téléphone ou votre e-mail." };
  if (v.includes("@")) return { email: v.toLowerCase(), phone: false };
  const digits = phoneDigits(v);
  if (!digits) return { error: "Ce numéro n'est pas valide. Exemple : 0812 345 678." };
  return { email: `${digits}@${PHONE_LOGIN_DOMAIN}`, phone: true };
}

export function isPhoneLogin(email: string | null | undefined): boolean {
  return !!email && email.toLowerCase().endsWith(`@${PHONE_LOGIN_DOMAIN}`);
}

/** Identifiant à montrer : « 0812 345 678 » pour un compte par téléphone, sinon l'e-mail. */
export function displayLogin(email: string | null | undefined): string {
  if (!email) return "";
  return isPhoneLogin(email) ? formatPhone(email.split("@")[0]!) : email;
}
