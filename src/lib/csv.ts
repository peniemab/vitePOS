/**
 * Import et export CSV du catalogue (Excel → « Enregistrer sous CSV »).
 * Accepte la virgule, le point-virgule ou la tabulation, et des en-têtes en français ou en anglais.
 */
import {
  DEFAULT_ALERT_THRESHOLD,
  DEFAULT_CATEGORY,
  fold,
  isUnit,
  roundQuantity,
  type Product,
  type ProductInput,
  type Unit,
} from "./products";

export interface ImportRow {
  name: string;
  category: string;
  sellPrice: number;
  buyPrice?: number;
  /** Absent : le stock actuel n'est pas touché. */
  stock?: number;
  alertThreshold: number;
  unit: Unit;
  barcode: string;
  favorite: boolean;
}

export interface ParseResult {
  rows: ImportRow[];
  errors: string[];
}

type Column = "name" | "category" | "sellPrice" | "buyPrice" | "stock" | "alertThreshold" | "unit" | "barcode" | "favorite";

const HEADER_ALIASES: Record<string, Column> = {
  nom: "name",
  name: "name",
  produit: "name",
  product: "name",
  designation: "name",
  article: "name",
  categorie: "category",
  category: "category",
  cat: "category",
  famille: "category",
  prix: "sellPrice",
  prix_vente: "sellPrice",
  prix_de_vente: "sellPrice",
  sellprice: "sellPrice",
  sell_price: "sellPrice",
  vente: "sellPrice",
  prix_achat: "buyPrice",
  prix_d_achat: "buyPrice",
  buyprice: "buyPrice",
  buy_price: "buyPrice",
  achat: "buyPrice",
  stock: "stock",
  qte: "stock",
  quantite: "stock",
  quantity: "stock",
  seuil: "alertThreshold",
  seuil_alerte: "alertThreshold",
  alerte: "alertThreshold",
  alertthreshold: "alertThreshold",
  unite: "unit",
  unit: "unit",
  code: "barcode",
  codebarres: "barcode",
  code_barres: "barcode",
  code_barre: "barcode",
  barcode: "barcode",
  ean: "barcode",
  favori: "favorite",
  favorite: "favorite",
};

export const CSV_HEADER = "nom,categorie,prix_vente,prix_achat,stock,seuil,unite,code_barres,favori";

export const CSV_TEMPLATE = `${CSV_HEADER}
Riz 1kg,Alimentation,700,550,40,5,u,,oui
Huile 1L,Alimentation,1500,1200,20,5,u,,oui
Savon,Hygiène,300,200,50,10,u,,non
Lait 1L,Alimentation,900,750,30,5,u,,oui
Sucre vrac,Alimentation,650,500,25,5,kg,,non
`;

function normalizeHeader(h: string): string {
  return fold(h.replace(/^"|"$/g, ""))
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

function detectDelimiter(headerLine: string): string {
  const count = (c: string) => headerLine.split(c).length - 1;
  const tabs = count("\t");
  const semis = count(";");
  const commas = count(",");
  if (tabs > 0 && tabs >= semis && tabs >= commas) return "\t";
  return semis > commas ? ";" : ",";
}

/** Découpe une ligne en respectant les guillemets (« "Riz, 1kg" » reste un seul champ). */
export function splitCsvLine(line: string, delim: string): string[] {
  const out: string[] = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (quoted && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else quoted = !quoted;
    } else if (ch === delim && !quoted) {
      out.push(cur.trim());
      cur = "";
    } else cur += ch;
  }
  out.push(cur.trim());
  return out;
}

/** « 1 500 », « 1500,50 » ou « 1.500,50 » → nombre. */
export function parseNumber(raw: string): number | undefined {
  let s = raw.replace(/[\s  ]/g, "");
  if (!s) return undefined;
  if (s.includes(",") && s.includes(".")) s = s.replace(/\./g, "").replace(",", ".");
  else s = s.replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

function parseBool(raw: string): boolean {
  return ["1", "oui", "o", "true", "yes", "y", "x"].includes(fold(raw));
}

function parseUnit(raw: string): Unit {
  const v = fold(raw);
  if (v === "kg" || v === "kilo") return "kg";
  if (v === "l" || v === "litre" || v === "liter") return "L";
  return isUnit(raw) ? raw : "u";
}

export function parseProductCsv(text: string): ParseResult {
  const lines = text
    .replace(/^﻿/, "")
    .split(/\r?\n/)
    .filter((l) => l.trim());
  if (lines.length < 2) return { rows: [], errors: ["Il faut une ligne d'en-tête et au moins un produit."] };

  const delim = detectDelimiter(lines[0]);
  const columns = splitCsvLine(lines[0], delim).map((h) => HEADER_ALIASES[normalizeHeader(h)] ?? null);
  if (!columns.includes("name") || !columns.includes("sellPrice")) {
    return {
      rows: [],
      errors: [`Colonnes obligatoires manquantes : « nom » et « prix_vente ». Exemple d'en-tête : ${CSV_HEADER}`],
    };
  }

  const rows: ImportRow[] = [];
  const errors: string[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i], delim);
    const get = (c: Column) => {
      const idx = columns.indexOf(c);
      return idx >= 0 ? (cells[idx] ?? "").trim() : "";
    };
    const name = get("name");
    const sellPrice = parseNumber(get("sellPrice"));
    if (!name) {
      errors.push(`Ligne ${i + 1} : nom manquant.`);
      continue;
    }
    if (sellPrice == null || sellPrice < 0) {
      errors.push(`Ligne ${i + 1} (${name}) : prix de vente invalide.`);
      continue;
    }
    const unit = parseUnit(get("unit"));
    const stock = parseNumber(get("stock"));
    const buyPrice = parseNumber(get("buyPrice"));
    const threshold = parseNumber(get("alertThreshold"));
    rows.push({
      name: name.slice(0, 120),
      category: get("category").slice(0, 60) || DEFAULT_CATEGORY,
      sellPrice,
      buyPrice: buyPrice != null && buyPrice >= 0 ? buyPrice : undefined,
      stock: stock != null ? roundQuantity(stock, unit) : undefined,
      alertThreshold: threshold != null && threshold >= 0 ? threshold : DEFAULT_ALERT_THRESHOLD,
      unit,
      barcode: get("barcode").slice(0, 64),
      favorite: parseBool(get("favorite")),
    });
  }
  return { rows, errors };
}

/* ---------- Plan d'import ---------- */

export interface ImportCreate {
  input: ProductInput;
  stock: number;
  buyPrice?: number;
}

export interface ImportUpdate {
  id: string;
  input: ProductInput;
  /** Écart à enregistrer comme mouvement de correction (0 : stock inchangé). */
  stockDelta: number;
  buyPrice?: number;
}

export interface ImportPlan {
  creates: ImportCreate[];
  updates: ImportUpdate[];
}

type Existing = Pick<Product, "id" | "name" | "category" | "barcode" | "stock" | "archived">;

const nameKey = (name: string, category: string) => `${fold(name)}|${fold(category)}`;

/**
 * Rapproche chaque ligne d'un produit existant (même code-barres, sinon même nom et catégorie).
 * Le stock du fichier devient le nouveau stock : l'écart est enregistré comme mouvement.
 */
export function planImport(rows: ImportRow[], existing: Existing[]): ImportPlan {
  const active = existing.filter((p) => !p.archived);
  const byBarcode = new Map(active.filter((p) => p.barcode).map((p) => [p.barcode, p]));
  const byName = new Map(active.map((p) => [nameKey(p.name, p.category), p]));
  const plan: ImportPlan = { creates: [], updates: [] };
  const seen = new Set<string>();

  for (const row of rows) {
    const key = nameKey(row.name, row.category);
    // Une même ligne en double dans le fichier : seule la première compte.
    const dedupe = row.barcode ? `b:${row.barcode}` : `n:${key}`;
    if (seen.has(dedupe)) continue;
    seen.add(dedupe);

    const input: ProductInput = {
      name: row.name,
      category: row.category,
      sellPrice: row.sellPrice,
      unit: row.unit,
      alertThreshold: row.alertThreshold,
      barcode: row.barcode,
      favorite: row.favorite,
    };
    const prev = (row.barcode && byBarcode.get(row.barcode)) || byName.get(key);
    if (prev) {
      const stockDelta = row.stock == null ? 0 : roundQuantity(row.stock - prev.stock, row.unit);
      plan.updates.push({ id: prev.id, input: { ...input, barcode: row.barcode || prev.barcode }, stockDelta, buyPrice: row.buyPrice });
    } else {
      plan.creates.push({ input, stock: row.stock ?? 0, buyPrice: row.buyPrice });
    }
  }
  return plan;
}

/* ---------- Export ---------- */

function quote(v: string): string {
  return /[",\n;]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

export function exportProductsCsv(products: Product[], buyPrices?: Map<string, number>): string {
  const lines = products
    .filter((p) => !p.archived)
    .map((p) =>
      [
        quote(p.name),
        quote(p.category),
        p.sellPrice,
        buyPrices?.get(p.id) ?? "",
        p.stock,
        p.alertThreshold,
        p.unit,
        quote(p.barcode),
        p.favorite ? "oui" : "non",
      ].join(","),
    );
  return [CSV_HEADER, ...lines].join("\n") + "\n";
}
