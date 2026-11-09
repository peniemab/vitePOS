/**
 * QR codes des supports imprimés (brochure, dépliant, manuel) et de l'accueil du site.
 * Chacun ouvre sa propre page viteposrdc.com/q/<code> : la mesure d'audience montre ainsi combien de visites vient de chaque support.
 * La liste est dans qr-codes.json (lue aussi par scripts/gen-qr.mjs, qui fait les images public/qr/<code>.svg).
 */
import type { Lang } from "../i18n";
import { APP_URL } from "./content";
import data from "./qr-codes.json";

export type QrSupport = "brochure" | "trifold" | "manual" | "site";
export type QrTarget = "app" | "community";
export interface QrCode {
  code: string;
  lang: Lang;
  target: QrTarget;
}

export const QR_CODES = data.codes as QrCode[];

/** Code du QR d'un support, dans une langue, vers une cible. */
const CODES: Record<Lang, Record<QrSupport, Record<QrTarget, string>>> = {
  fr: {
    brochure: { app: "brochure-commencer", community: "brochure-suivre" },
    trifold: { app: "depliant-commencer", community: "depliant-suivre" },
    manual: { app: "manuel-commencer", community: "manuel-suivre" },
    site: { app: "site-commencer", community: "brochure-suivre" },
  },
  en: {
    brochure: { app: "brochure-en-start", community: "brochure-en-follow" },
    trifold: { app: "leaflet-en-start", community: "leaflet-en-follow" },
    manual: { app: "manual-en-start", community: "manual-en-follow" },
    site: { app: "site-en-start", community: "brochure-en-follow" },
  },
};

/** Image du QR code (SVG) d'un support. */
export function qrImage(lang: Lang, support: QrSupport, target: QrTarget = "app"): string {
  return `/qr/${CODES[lang][support][target]}.svg`;
}

/** Adresse finale d'un QR code. */
export function qrDestination(q: QrCode): string {
  if (q.target === "app") return APP_URL;
  return q.lang === "fr" ? "/communaute" : "/en/community";
}
