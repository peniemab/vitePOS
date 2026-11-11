/**
 * Icônes Google Material Symbols (style arrondi), intégrées en SVG : aucune requête réseau, marche hors ligne.
 * Génère src/components/icons.tsx (app) et site/src/data/icons.ts (site).
 * Lancer : node scripts/gen-material-icons.mjs (après avoir changé une correspondance ci-dessous).
 * Liste des icônes : https://fonts.google.com/icons?icon.style=Rounded
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const MS = "node_modules/@material-symbols/svg-400/rounded/";
const SI = "node_modules/simple-icons/icons/";

/** Tracé(s) d'une icône Material (repère 0 -960 960 960). */
function material(name) {
  const svg = readFileSync(`${MS}${name}.svg`, "utf8");
  return [...svg.matchAll(/<path d="([^"]+)"/g)].map((m) => m[1]);
}
function simpleIcon(name) {
  return readFileSync(`${SI}${name}.svg`, "utf8").match(/<path d="([^"]+)"/)[1];
}

/** Logo officiel « G » de Google (couleurs de la marque), pour le bouton de connexion. */
const GOOGLE_G = [
  ["#EA4335", "M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"],
  ["#4285F4", "M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"],
  ["#FBBC05", "M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"],
  ["#34A853", "M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"],
];

// ---------- App : mêmes noms qu'avant (IconXxx), icônes Google ----------
const APP = {
  Archive: "archive", ArchiveOff: "unarchive", ArrowBackUp: "undo", ArrowLeft: "arrow_back", ArrowsExchange: "swap_horiz",
  AlertTriangle: "warning", Barcode: "barcode", Beer: "sports_bar", Bluetooth: "bluetooth", Bolt: "bolt",
  Bottle: "liquor", Bus: "directions_bus", Bread: "bakery_dining", BuildingStore: "storefront", CalendarCheck: "event_available",
  CalendarExclamation: "event_busy", Candle: "candle", Cash: "payments", CashRegister: "point_of_sale",
  ChartBar: "bar_chart", Check: "check", ChevronLeft: "chevron_left", ChevronRight: "chevron_right",
  ClipboardCheck: "fact_check", CloudCheck: "cloud_done", CloudUpload: "cloud_upload", Copy: "content_copy",
  CreditCard: "credit_card", DeviceFloppy: "save", DeviceMobile: "mobile", DeviceMobileDollar: "mobile_hand",
  DeviceMobileDown: "mobile_arrow_down", DeviceMobileSearch: "mobile_loupe", Discount: "percent", Dots: "more_horiz",
  DotsVertical: "more_vert", Download: "download", Droplet: "water_drop", Egg: "egg", FileUpload: "upload_file",
  Grain: "grain", Home: "home", Info: "info", Lightbulb: "lightbulb", LayoutDashboard: "dashboard", Lock: "lock", Logout: "logout", Minus: "remove",
  Moon: "dark_mode", Package: "inventory_2", Phone: "call", PhotoUp: "add_photo_alternate", Plus: "add",
  Printer: "print", Receipt: "receipt_long", ReceiptOff: "receipt_long_off", Scan: "barcode_scanner",
  Search: "search", Settings: "settings", Share: "share", Share2: "ios_share", ShieldCheck: "verified_user",
  ShoppingBag: "shopping_bag", ShoppingCart: "shopping_cart", StarFilled: "star-fill", Sun: "light_mode",
  Tag: "sell", Trash: "delete", Upload: "upload", UserPlus: "person_add", Users: "group", UsersGroup: "groups",
  UsersPlus: "group_add", Wallet: "account_balance_wallet", WifiOff: "wifi_off", X: "close",
};

let app = `/**
 * Icônes Google Material Symbols (arrondies), générées par scripts/gen-material-icons.mjs : ne pas modifier à la main.
 * Mêmes noms et mêmes propriétés (size, color…) que les anciennes icônes Tabler.
 */
import { forwardRef, type ForwardRefExoticComponent, type RefAttributes, type SVGProps } from "react";

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, "ref" | "stroke"> {
  size?: number | string;
  /** Ignoré (gardé pour la compatibilité avec les anciennes icônes). */
  stroke?: number | string;
  /** Version pleine de l'icône (comme l'onglet actif dans les apps Google). */
  filled?: boolean;
}
export type Icon = ForwardRefExoticComponent<IconProps & RefAttributes<SVGSVGElement>>;

function make(name: string, d: string[], full: string[] = d): Icon {
  const C = forwardRef<SVGSVGElement, IconProps>(({ size = 24, stroke: _stroke, filled, color, className, ...rest }, ref) => (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 -960 960 960"
      width={size}
      height={size}
      fill={color ?? "currentColor"}
      className={className ? \`ms-icon \${className}\` : "ms-icon"}
      aria-hidden={rest["aria-label"] ? undefined : true}
      {...rest}
    >
      {(filled ? full : d).map((p, i) => (
        <path key={i} d={p} />
      ))}
    </svg>
  ));
  C.displayName = name;
  return C;
}

`;
for (const [k, file] of Object.entries(APP)) {
  const fill = file.endsWith("-fill") || !existsSync(`${MS}${file}-fill.svg`) ? "" : `, ${JSON.stringify(material(`${file}-fill`))}`;
  app += `export const Icon${k} = make("Icon${k}", ${JSON.stringify(material(file))}${fill});\n`;
}
app += `export const IconBrandWhatsapp = forwardRef<SVGSVGElement, IconProps>(({ size = 24, stroke: _s, filled: _f, color, ...rest }, ref) => (
  <svg ref={ref} xmlns="http://www.w3.org/2000/svg" viewBox="-2 -2 28 28" width={size} height={size} fill={color ?? "currentColor"} aria-hidden={rest["aria-label"] ? undefined : true} {...rest}>
    <path d="${simpleIcon("whatsapp")}" />
  </svg>
));
IconBrandWhatsapp.displayName = "IconBrandWhatsapp";

/** Logo « G » de Google, dans ses couleurs officielles. */
export const IconBrandGoogle = forwardRef<SVGSVGElement, IconProps>(({ size = 24, stroke: _s, filled: _f, color: _c, ...rest }, ref) => (
  <svg ref={ref} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width={size} height={size} aria-hidden={rest["aria-label"] ? undefined : true} {...rest}>
${GOOGLE_G.map(([f, d]) => `    <path fill="${f}" d="${d}" />`).join("\n")}
  </svg>
));
IconBrandGoogle.displayName = "IconBrandGoogle";
`;
writeFileSync("src/components/icons.tsx", app);

// ---------- Site : mêmes groupes et mêmes clés qu'avant ----------
const SITE = {
  icons: { bolt: "bolt", package: "inventory_2", receipt: "receipt_long", users: "group", chartBar: "bar_chart", lock: "lock", clipboardCheck: "fact_check", fileImport: "upload_file" },
  moreIcons: {
    store: "storefront", qr: "qr_code_2", deviceMobile: "mobile", printer: "print", barcode: "barcode_scanner", chevronLeft: "chevron_left",
    chevronRight: "chevron_right", check: "check", wifiOff: "wifi_off", cash: "payments", mapPin: "location_on", pause: "pause",
    play: "play_arrow", arrowRight: "arrow_forward", shieldCheck: "verified_user", users: "group",
    drawer: "point_of_sale", tablet: "tablet_android", receiptRoll: "receipt", truck: "local_shipping",
  },
  alertIcon: "warning",
  navIcons: {
    menu: "menu", close: "close", tag: "sell", download: "download", book: "menu_book",
    features: "widgets", devices: "devices", audiences: "storefront", offline: "wifi_off", pricing: "sell", faq: "help", contact: "chat", equipment: "print", login: "login", language: "translate",
  },
  deviceIcons: { tablet: "tablet_android", laptop: "laptop_windows" },
  contactIcons: { phone: "call", mail: "mail" },
};
const svg = (d) =>
  `<svg width="24" height="24" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="currentColor">${d.map((p) => `<path d="${p}"/>`).join("")}</svg>`;
let site = `/**
 * Icônes Google Material Symbols (arrondies), en SVG intégré : aucune requête réseau en plus.
 * Générées par scripts/gen-material-icons.mjs (à la racine du dépôt) : ne pas modifier à la main.
 */
`;
for (const [group, map] of Object.entries(SITE)) {
  if (typeof map === "string") {
    site += `export const ${group} = ${JSON.stringify(svg(material(map)))};\n\n`;
    continue;
  }
  site += `export const ${group} = {\n`;
  for (const [k, file] of Object.entries(map)) site += `  ${k}: ${JSON.stringify(svg(material(file)))},\n`;
  // Logos des réseaux (Simple Icons) : WhatsApp, Instagram, Facebook.
  if (group === "contactIcons")
    for (const brand of ["whatsapp", "instagram", "facebook"])
      site += `  ${brand}: ${JSON.stringify(`<svg width="24" height="24" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="-2 -2 28 28" fill="currentColor"><path d="${simpleIcon(brand)}"/></svg>`)},\n`;
  site += group === "icons" ? `} as const;\n\nexport type IconName = keyof typeof icons;\n\n` : `};\n\n`;
}
writeFileSync("site/src/data/icons.ts", site);
console.log(`app : ${Object.keys(APP).length + 2} icônes, site : ok`);
