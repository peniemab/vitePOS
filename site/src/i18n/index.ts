/**
 * Langues du site : le français à la racine (/, /manuel, /brochure), l'anglais sous /en/.
 * Chaque page a son équivalent dans l'autre langue, pour le bouton FR / EN.
 */
import { fr, type Dict } from "./fr";
import { en } from "./en";

export type Lang = "fr" | "en";
export type PageKey = "home" | "manual" | "brochure";

export const dicts: Record<Lang, Dict> = { fr, en };

const ROUTES: Record<Lang, Record<PageKey, string>> = {
  fr: { home: "/", manual: "/manuel", brochure: "/brochure" },
  en: { home: "/en/", manual: "/en/manual", brochure: "/en/brochure" },
};

/** Fichiers PDF, un par langue. */
export const PDF: Record<Lang, { manual: string; brochure: string }> = {
  fr: { manual: "/manuel-vitepos.pdf", brochure: "/brochure-vitepos.pdf" },
  en: { manual: "/vitepos-manual-en.pdf", brochure: "/vitepos-brochure-en.pdf" },
};

export function route(lang: Lang, page: PageKey): string {
  return ROUTES[lang][page];
}

export const otherLang = (lang: Lang): Lang => (lang === "fr" ? "en" : "fr");

export type { Dict };
