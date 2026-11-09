/** Plan du site pour Google (Search Console) : toutes les pages, en français et en anglais. Les pages légales n'y sont qu'une fois publiées. */
import type { APIRoute } from "astro";
import { LEGAL_READY } from "../data/content";
import { route, type Lang, type PageKey } from "../i18n";

const PAGES: PageKey[] = ["home", "manual", "brochure", "trifold", "equipment", "community", ...(LEGAL_READY ? (["terms", "privacy"] as PageKey[]) : [])];
const LANGS: Lang[] = ["fr", "en"];

export const GET: APIRoute = ({ site }) => {
  const abs = (p: string) => new URL(p, site).href;
  const urls = PAGES.flatMap((page) =>
    LANGS.map(
      (lang) =>
        `  <url><loc>${abs(route(lang, page))}</loc>${LANGS.map((l) => `<xhtml:link rel="alternate" hreflang="${l}" href="${abs(route(l, page))}"/>`).join("")}</url>`,
    ),
  );
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join("\n")}\n</urlset>\n`;
  return new Response(xml, { headers: { "Content-Type": "application/xml" } });
};
