/**
 * Adresses du site et de l'app : un seul endroit à changer quand le nom de domaine sera choisi.
 * Les textes, eux, sont dans `src/i18n/` (français et anglais).
 */

export const APP_URL = "https://getvitepos.web.app";
export const SIGNUP_URL = `${APP_URL}/inscription`;
export const LOGIN_URL = `${APP_URL}/connexion`;

/** Adresses écrites en clair (brochure, manuel) : sans « https:// ». */
export const APP_HOST = "getvitepos.web.app";
export const SITE_HOST = "vitepos-rdc.web.app";

/**
 * Éditeur de vitePOS, cité dans les conditions d'utilisation et la politique de confidentialité.
 * Un champ vide s'affiche « à compléter » en rouge : à remplir avant de publier ces pages.
 */
export const LEGAL = {
  /** Personne ou entreprise qui édite vitePOS (avec sa forme : « Jean Dupont, entrepreneur individuel », « vitePOS SARL »). */
  editor: "",
  /** Numéro RCCM, si l'entreprise est enregistrée. */
  rccm: "",
  address: "Kinshasa, République démocratique du Congo",
  email: "viteposrdc@gmail.com",
  whatsapp: "+243 839 892 822",
  /** Date de la dernière mise à jour des deux textes. */
  updated: { fr: "26 octobre 2026", en: "26 October 2026" },
};

/** Les pages légales ne sont publiées (et leurs liens affichés) que lorsque toutes les coordonnées de l'éditeur sont remplies. */
export const LEGAL_READY = [LEGAL.editor, LEGAL.rccm, LEGAL.email, LEGAL.whatsapp].every((v) => v.trim() !== "");

/** Joindre l'équipe vitePOS : WhatsApp d'abord (le plus utilisé à Kinshasa), appel, et e-mail quand il sera rempli dans `LEGAL`. */
export const CONTACT = {
  /** Numéro affiché, au format international. */
  phone: LEGAL.whatsapp,
  /** Lien d'appel : chiffres seulement, avec l'indicatif. */
  tel: `tel:+${LEGAL.whatsapp.replace(/\D/g, "")}`,
  email: LEGAL.email,
};

/** Lien WhatsApp vers l'équipe vitePOS, avec un message déjà écrit. */
export function whatsappUrl(text: string): string {
  return `https://wa.me/${LEGAL.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
}
