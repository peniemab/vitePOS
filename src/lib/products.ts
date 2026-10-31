/** Produits et mouvements de stock : logique pure (recherche, tri, alertes, sens des mouvements). */
import { MAX_WARRANTY_MONTHS } from "./serials";

export type Unit = "u" | "kg" | "L";

export const UNITS: Record<Unit, string> = { u: "Pièce", kg: "Kg", L: "Litre" };

/**
 * Emballage vendu ou reçu d'un bloc (« Paquet de 24 ») : il a son propre code-barres et son propre prix,
 * mais le stock reste toujours compté à l'unité (24 bouteilles).
 */
export interface Pack {
  id: string;
  name: string;
  barcode: string;
  /** Nombre d'unités du produit dans l'emballage (24). */
  units: number;
  /** Prix de vente de l'emballage entier, fixé par la boutique (prix de gros). */
  price: number;
}

export const MAX_PACKS = 5;

export interface Product {
  id: string;
  /** Code article unique dans la boutique (« LAI-002 ») : retrouve un produit parmi d'autres qui se ressemblent. */
  sku: string;
  name: string;
  category: string;
  sellPrice: number;
  unit: Unit;
  stock: number;
  alertThreshold: number;
  barcode: string;
  /** Emballages (paquet, carton…), du plus petit au plus grand. */
  packs: Pack[];
  /** Une date de péremption est notée à chaque arrivage (pharmacies, alimentation…). */
  tracksExpiry: boolean;
  /** Chaque appareil a son numéro de série ou IMEI, noté à l'arrivage et obligatoire à la vente. */
  serialTracked: boolean;
  /** Garantie donnée au client, en mois à partir du jour de la vente (0 : aucune). */
  warrantyMonths: number;
  favorite: boolean;
  archived: boolean;
  updatedAtMs: number;
}

/**
 * Champs modifiables d'une fiche produit (le stock passe toujours par un mouvement).
 * `packs` absent : les emballages ne sont pas touchés (import CSV).
 */
export type ProductInput = Pick<
  Product,
  "sku" | "name" | "category" | "sellPrice" | "unit" | "alertThreshold" | "barcode" | "favorite"
> & { packs?: Pack[]; tracksExpiry?: boolean; serialTracked?: boolean; warrantyMonths?: number };

export type StockMovementType = "reappro" | "casse" | "don" | "correction" | "vente" | "annulation" | "inventaire";

/** Mouvements saisis à la main depuis l'écran Stock. */
export type ManualMovementType = "reappro" | "casse" | "don" | "correction";

export const MOVEMENT_LABELS: Record<StockMovementType, string> = {
  reappro: "Réapprovisionnement",
  casse: "Casse",
  don: "Don",
  correction: "Correction",
  vente: "Vente",
  annulation: "Annulation de vente",
  inventaire: "Inventaire",
};

export const DEFAULT_CATEGORY = "Divers";
export const DEFAULT_ALERT_THRESHOLD = 5;

export const SUGGESTED_CATEGORIES = [
  "Alimentation",
  "Boissons",
  "Hygiène",
  "Ménager",
  "Épicerie",
  "Frais",
  "Confiserie",
  "Vêtements",
  "Chaussures",
  "Accessoires",
  "Électronique",
  "Téléphonie",
  "Cosmétiques",
  "Pharmacie",
  "Quincaillerie",
  "Librairie",
  "Jouets",
  DEFAULT_CATEGORY,
];

export function isUnit(v: unknown): v is Unit {
  return v === "u" || v === "kg" || v === "L";
}

/** Arrondi d'une quantité : entière pour les pièces, au gramme ou au millilitre sinon. */
export function roundQuantity(q: number, unit: Unit): number {
  const f = unit === "u" ? 1 : 1000;
  return Math.round((q + Number.EPSILON) * f) / f;
}

/**
 * Variation de stock signée selon le type de mouvement : un réapprovisionnement ajoute,
 * une casse ou un don retire, une correction garde le signe saisi.
 */
export function signedDelta(type: ManualMovementType, quantity: number, unit: Unit): number {
  const q = roundQuantity(Math.abs(quantity), unit);
  if (type === "reappro") return q;
  if (type === "casse" || type === "don") return -q;
  return roundQuantity(quantity, unit);
}

export type StockLevel = "empty" | "low" | "ok";

export function stockLevel(p: Pick<Product, "stock" | "alertThreshold">): StockLevel {
  if (p.stock <= 0) return "empty";
  if (p.stock <= p.alertThreshold) return "low";
  return "ok";
}

export function needsRestock(p: Pick<Product, "stock" | "alertThreshold" | "archived">): boolean {
  return !p.archived && stockLevel(p) !== "ok";
}

/** Minuscules sans accents, pour chercher « epicerie » ou « Épicerie » indifféremment. */
export function fold(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

type Codes = Pick<Product, "barcode"> & { sku?: string; packs?: Pick<Pack, "barcode">[] };

export function matchProduct(p: Pick<Product, "name" | "category"> & Codes, query: string): boolean {
  const q = fold(query);
  if (!q) return true;
  const words = q.split(/\s+/);
  const packCodes = (p.packs ?? []).map((k) => k.barcode).join(" ");
  const haystack = fold(`${p.sku ?? ""} ${p.name} ${p.category} ${p.barcode} ${packCodes}`);
  return words.every((w) => haystack.includes(w));
}

/** Produit portant ce code-barres, sur l'unité ou sur un de ses emballages. */
export function findByBarcode<T extends Pick<Product, "archived"> & Codes>(products: T[], code: string): T | undefined {
  const c = code.trim();
  if (!c) return undefined;
  return products.find((p) => !p.archived && (p.barcode === c || !!p.packs?.some((k) => k.barcode === c)));
}

/**
 * Ce que désigne un code scanné : le produit, et l'emballage s'il s'agit du code d'un paquet ou d'un carton
 * (`pack` vaut `null` pour le code de l'unité ou le code article).
 */
export function findScan<T extends Pick<Product, "archived"> & Codes>(
  products: T[],
  code: string,
): { product: T; pack: NonNullable<T["packs"]>[number] | null } | undefined {
  const c = code.trim();
  if (!c) return undefined;
  for (const p of products) {
    if (p.archived) continue;
    if (p.barcode === c) return { product: p, pack: null };
    const pack = p.packs?.find((k) => k.barcode === c);
    if (pack) return { product: p, pack };
  }
  const sku = normalizeSku(c);
  const bySku = sku ? products.find((p) => !p.archived && p.sku === sku) : undefined;
  return bySku ? { product: bySku, pack: null } : undefined;
}

/** Produit dont un code-barres ou le code article correspond exactement (scan, ou code tapé puis Entrée). */
export function findByCode<T extends Pick<Product, "archived"> & Codes>(products: T[], code: string): T | undefined {
  return findScan(products, code)?.product;
}

/** Libellé d'un emballage : « Paquet de 24 », « Sac de 25 kg ». */
export function packLabel(pack: Pick<Pack, "name" | "units">, unit: Unit): string {
  const n = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 3 }).format(pack.units);
  return `${pack.name} de ${n}${unit === "u" ? "" : ` ${unit}`}`;
}

/** Nettoie les emballages d'une fiche ; renvoie un message d'erreur si l'un d'eux est incomplet. */
export function validatePacks(packs: Pack[], unit: Unit, unitBarcode: string): { value: Pack[] } | { error: string } {
  if (packs.length > MAX_PACKS) return { error: `${MAX_PACKS} emballages au plus par produit.` };
  const seen = new Set(unitBarcode ? [unitBarcode] : []);
  const out: Pack[] = [];
  for (const k of packs) {
    const name = k.name.trim().slice(0, 40);
    if (!name) return { error: "Donnez un nom à chaque emballage (Paquet, Carton…)." };
    const units = roundQuantity(k.units, unit);
    if (!Number.isFinite(units) || units <= 0 || (unit === "u" && units < 2))
      return { error: `« ${name} » : indiquez combien d'unités il contient (au moins 2).` };
    if (!Number.isFinite(k.price) || k.price < 0) return { error: `« ${name} » : le prix n'est pas valide.` };
    const barcode = k.barcode.trim();
    if (barcode.length > 64) return { error: `« ${name} » : le code-barres est trop long.` };
    if (barcode && seen.has(barcode)) return { error: `Le code-barres ${barcode} est utilisé deux fois sur ce produit.` };
    if (barcode) seen.add(barcode);
    out.push({ id: k.id || Math.random().toString(36).slice(2, 10), name, barcode, units, price: k.price });
  }
  return { value: out.sort((a, b) => a.units - b.units) };
}

/* ---------- Codes article ---------- */

export const SKU_MAX = 20;

/** Code article saisi à la main : majuscules, lettres, chiffres et tirets seulement. */
export function normalizeSku(input: string): string {
  return fold(input)
    .toUpperCase()
    .replace(/\s+/g, "-")
    .replace(/[^A-Z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, SKU_MAX);
}

/** Préfixe tiré de la catégorie : les 3 premières lettres (« Lait » → LAI, « Téléphonie » → TEL). */
export function skuPrefix(category: string): string {
  const letters = fold(category).toUpperCase().replace(/[^A-Z]/g, "");
  if (!letters) return "ART";
  return (letters + "XX").slice(0, 3);
}

/** Prochain code libre pour cette catégorie : LAI-001, LAI-002… (après le plus grand numéro déjà pris). */
export function nextSku(category: string, taken: Iterable<string>): string {
  const prefix = skuPrefix(category);
  const re = new RegExp(`^${prefix}-(\\d+)$`);
  let max = 0;
  for (const s of taken) {
    const m = re.exec(s);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return `${prefix}-${String(max + 1).padStart(3, "0")}`;
}

export function collectCategories(products: Pick<Product, "category" | "archived">[]): string[] {
  const set = new Set<string>();
  for (const p of products) if (!p.archived && p.category) set.add(p.category);
  return [...set].sort((a, b) => a.localeCompare(b, "fr"));
}

/** Couleurs des rayons à la caisse : chaque rayon garde toujours la même. */
export const CATEGORY_COLORS = ["#3987e5", "#1f9d55", "#e8890c", "#9c36b5", "#0ca678", "#e03131", "#1971c2", "#c2255c"];
const NO_CATEGORY_COLOR = "#7a8599";

export function categoryColor(category: string): string {
  const key = fold(category);
  if (!key) return NO_CATEGORY_COLOR;
  let h = 0;
  for (const ch of key) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return CATEGORY_COLORS[h % CATEGORY_COLORS.length];
}

/** Deux lettres pour la vignette d'un article : « Huile Mama 1 L » → « HM », « Sucre » → « SU ». */
export function initials(name: string): string {
  const words = fold(name)
    .toUpperCase()
    .split(/[^A-Z0-9]+/)
    .filter((w) => /[A-Z]/.test(w));
  if (!words.length) return "?";
  if (words.length === 1) return words[0].slice(0, 2);
  return words[0][0] + words[1][0];
}

export function sortByName<T extends Pick<Product, "name">>(products: T[]): T[] {
  return [...products].sort((a, b) => a.name.localeCompare(b.name, "fr"));
}

/** Ordre de la caisse : favoris d'abord, ruptures à la fin, puis par nom. */
export function sortForCheckout<T extends Pick<Product, "name" | "favorite" | "stock">>(products: T[]): T[] {
  return [...products].sort((a, b) => {
    if (a.favorite !== b.favorite) return a.favorite ? -1 : 1;
    if (a.stock <= 0 !== b.stock <= 0) return a.stock <= 0 ? 1 : -1;
    return a.name.localeCompare(b.name, "fr");
  });
}

/** Nettoie une fiche avant enregistrement ; renvoie un message d'erreur si elle est invalide. */
export function validateProduct(input: ProductInput): { value: ProductInput } | { error: string } {
  const name = input.name.trim();
  if (!name) return { error: "Le nom du produit est obligatoire." };
  if (name.length > 120) return { error: "Le nom du produit est trop long (120 caractères au plus)." };
  if (!Number.isFinite(input.sellPrice) || input.sellPrice < 0) return { error: "Le prix de vente n'est pas valide." };
  if (!Number.isFinite(input.alertThreshold) || input.alertThreshold < 0)
    return { error: "Le seuil d'alerte n'est pas valide." };
  const barcode = input.barcode.trim();
  if (barcode.length > 64) return { error: "Le code-barres est trop long." };
  const sku = normalizeSku(input.sku);
  if (!sku) return { error: "Le code article est obligatoire (par exemple LAI-001)." };
  const unit = isUnit(input.unit) ? input.unit : "u";
  let packs: Pack[] | undefined;
  if (input.packs) {
    const checked = validatePacks(input.packs, unit, barcode);
    if ("error" in checked) return checked;
    packs = checked.value;
  }
  const serialTracked = input.serialTracked === true;
  if (serialTracked && unit !== "u") return { error: "Le suivi par IMEI ne marche que pour les articles vendus à la pièce." };
  if (serialTracked && (packs ?? input.packs ?? []).length)
    return { error: "Un article suivi par IMEI se vend à l'unité : retirez ses paquets ou cartons." };
  const warrantyMonths = Math.trunc(input.warrantyMonths ?? 0);
  if (!Number.isFinite(warrantyMonths) || warrantyMonths < 0 || warrantyMonths > MAX_WARRANTY_MONTHS)
    return { error: `La garantie doit être comprise entre 0 et ${MAX_WARRANTY_MONTHS} mois.` };
  return {
    value: {
      sku,
      name,
      category: input.category.trim().slice(0, 60) || DEFAULT_CATEGORY,
      sellPrice: input.sellPrice,
      unit,
      alertThreshold: roundQuantity(input.alertThreshold, input.unit),
      barcode,
      favorite: input.favorite,
      ...(packs ? { packs } : {}),
      ...(input.tracksExpiry !== undefined ? { tracksExpiry: input.tracksExpiry === true } : {}),
      ...(input.serialTracked !== undefined ? { serialTracked, warrantyMonths: serialTracked ? warrantyMonths : 0 } : {}),
    },
  };
}
