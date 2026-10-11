/** Produits et mouvements de stock : logique pure (recherche, tri, alertes, sens des mouvements). */

export type Unit = "u" | "kg" | "L";

export const UNITS: Record<Unit, string> = { u: "Pièce", kg: "Kg", L: "Litre" };

export interface Product {
  id: string;
  name: string;
  category: string;
  sellPrice: number;
  unit: Unit;
  stock: number;
  alertThreshold: number;
  barcode: string;
  favorite: boolean;
  archived: boolean;
  updatedAtMs: number;
}

/** Champs modifiables d'une fiche produit (le stock passe toujours par un mouvement). */
export type ProductInput = Pick<
  Product,
  "name" | "category" | "sellPrice" | "unit" | "alertThreshold" | "barcode" | "favorite"
>;

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

export function matchProduct(p: Pick<Product, "name" | "category" | "barcode">, query: string): boolean {
  const q = fold(query);
  if (!q) return true;
  const words = q.split(/\s+/);
  const haystack = fold(`${p.name} ${p.category} ${p.barcode}`);
  return words.every((w) => haystack.includes(w));
}

export function findByBarcode<T extends Pick<Product, "barcode" | "archived">>(products: T[], code: string): T | undefined {
  const c = code.trim();
  if (!c) return undefined;
  return products.find((p) => !p.archived && p.barcode === c);
}

export function collectCategories(products: Pick<Product, "category" | "archived">[]): string[] {
  const set = new Set<string>();
  for (const p of products) if (!p.archived && p.category) set.add(p.category);
  return [...set].sort((a, b) => a.localeCompare(b, "fr"));
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
  return {
    value: {
      name,
      category: input.category.trim().slice(0, 60) || DEFAULT_CATEGORY,
      sellPrice: input.sellPrice,
      unit: isUnit(input.unit) ? input.unit : "u",
      alertThreshold: roundQuantity(input.alertThreshold, input.unit),
      barcode,
      favorite: input.favorite,
    },
  };
}
