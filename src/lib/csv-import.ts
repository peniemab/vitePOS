import type { Product } from '../db/types'

export type ImportRow = {
  name: string
  category?: string
  sellPrice: number
  buyPrice?: number
  stock?: number
  alertThreshold?: number
  unit?: string
  barcode?: string
  favorite?: boolean
}

export type ParseResult = {
  rows: ImportRow[]
  errors: string[]
}

const HEADER_ALIASES: Record<string, keyof ImportRow | 'skip'> = {
  nom: 'name',
  name: 'name',
  produit: 'name',
  product: 'name',
  categorie: 'category',
  category: 'category',
  cat: 'category',
  prix: 'sellPrice',
  prix_vente: 'sellPrice',
  sellprice: 'sellPrice',
  vente: 'sellPrice',
  prix_achat: 'buyPrice',
  buyprice: 'buyPrice',
  achat: 'buyPrice',
  stock: 'stock',
  qte: 'stock',
  quantite: 'stock',
  seuil: 'alertThreshold',
  alert: 'alertThreshold',
  alertthreshold: 'alertThreshold',
  unite: 'unit',
  unit: 'unit',
  code: 'barcode',
  codebarres: 'barcode',
  code_barres: 'barcode',
  barcode: 'barcode',
  ean: 'barcode',
  favori: 'favorite',
  favorite: 'favorite',
}

function normalizeHeader(h: string) {
  return h
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
}

function parseCsvLine(line: string): string[] {
  const out: string[] = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
      continue
    }
    if (ch === ',' && !inQuotes) {
      out.push(cur.trim())
      cur = ''
      continue
    }
    if ((ch === ';' || ch === '\t') && !inQuotes) {
      out.push(cur.trim())
      cur = ''
      continue
    }
    cur += ch
  }
  out.push(cur.trim())
  return out
}

function detectDelimiter(headerLine: string) {
  const commas = (headerLine.match(/,/g) || []).length
  const semis = (headerLine.match(/;/g) || []).length
  const tabs = (headerLine.match(/\t/g) || []).length
  if (tabs >= commas && tabs >= semis) return '\t'
  if (semis > commas) return ';'
  return ','
}

function parseNumber(raw: string): number | undefined {
  if (!raw || !raw.trim()) return undefined
  const cleaned = raw.replace(/\s/g, '').replace(',', '.')
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : undefined
}

function parseBool(raw: string): boolean {
  const v = raw.trim().toLowerCase()
  return v === '1' || v === 'oui' || v === 'true' || v === 'yes' || v === 'o'
}

/** Parse CSV / TSV / Excel-export text into product rows */
export function parseProductCsv(text: string): ParseResult {
  const cleaned = text.replace(/^\uFEFF/, '').trim()
  if (!cleaned) return { rows: [], errors: ['Fichier vide'] }

  const lines = cleaned.split(/\r?\n/).filter((l) => l.trim())
  if (lines.length < 2) return { rows: [], errors: ['Il faut une ligne d’en-tête et au moins 1 produit'] }

  const delim = detectDelimiter(lines[0])
  const headers = (delim === ',' ? parseCsvLine(lines[0]) : lines[0].split(delim)).map((h) =>
    normalizeHeader(h.replace(/^"|"$/g, '')),
  )

  const map: Array<keyof ImportRow | null> = headers.map((h) => {
    const key = HEADER_ALIASES[h]
    return key && key !== 'skip' ? key : null
  })

  if (!map.includes('name') || !map.includes('sellPrice')) {
    return {
      rows: [],
      errors: [
        'Colonnes obligatoires manquantes : nom (ou name) et prix / prix_vente. Exemple : nom,categorie,prix_vente,stock,code_barres',
      ],
    }
  }

  const rows: ImportRow[] = []
  const errors: string[] = []

  for (let i = 1; i < lines.length; i++) {
    const cols =
      delim === ',' ? parseCsvLine(lines[i]) : lines[i].split(delim).map((c) => c.replace(/^"|"$/g, '').trim())
    const row: Partial<ImportRow> = {}
    map.forEach((key, idx) => {
      if (!key) return
      const raw = (cols[idx] || '').trim()
      if (key === 'name' || key === 'category' || key === 'unit' || key === 'barcode') {
        if (raw) (row as Record<string, string>)[key] = raw
      } else if (key === 'favorite') {
        row.favorite = parseBool(raw)
      } else {
        const n = parseNumber(raw)
        if (n != null) (row as Record<string, number>)[key] = n
      }
    })

    if (!row.name) {
      errors.push(`Ligne ${i + 1} : nom manquant`)
      continue
    }
    if (row.sellPrice == null || row.sellPrice < 0) {
      errors.push(`Ligne ${i + 1} (${row.name}) : prix de vente invalide`)
      continue
    }
    rows.push({
      name: row.name,
      category: row.category || 'Divers',
      sellPrice: row.sellPrice,
      buyPrice: row.buyPrice,
      stock: row.stock ?? 0,
      alertThreshold: row.alertThreshold ?? 5,
      unit: row.unit || 'u',
      barcode: row.barcode,
      favorite: row.favorite ?? false,
    })
  }

  return { rows, errors }
}

export const CSV_TEMPLATE = `nom,categorie,prix_vente,prix_achat,stock,seuil,unite,code_barres,favori
Riz 1kg,Alimentation,700,550,40,5,u,,oui
Huile 1L,Alimentation,1500,1200,20,5,u,,oui
Savon,Hygiene,300,200,50,10,u,,non
Lait 1L,Alimentation,900,750,30,5,u,,oui
Sucre 1kg,Alimentation,650,500,25,5,u,,non
`

export function downloadCsvTemplate() {
  const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'modele-produits-boutique.csv'
  a.click()
  URL.revokeObjectURL(url)
}

export function exportProductsCsv(products: Product[]) {
  const header = 'nom,categorie,prix_vente,prix_achat,stock,seuil,unite,code_barres,favori'
  const lines = products
    .filter((p) => !p.archived)
    .map((p) =>
      [
        quote(p.name),
        quote(p.category),
        p.sellPrice,
        p.buyPrice ?? '',
        p.stock,
        p.alertThreshold,
        p.unit,
        p.barcode ?? '',
        p.favorite ? 'oui' : 'non',
      ].join(','),
    )
  return [header, ...lines].join('\n')
}

function quote(v: string) {
  if (/[",\n;]/.test(v)) return `"${v.replace(/"/g, '""')}"`
  return v
}

export const SUGGESTED_CATEGORIES = [
  // Épicerie / quartier
  'Alimentation',
  'Boissons',
  'Hygiène',
  'Ménager',
  'Épicerie',
  'Frais',
  'Confiserie',
  // Mode / chaussures
  'Vêtements',
  'Chaussures',
  'Baskets',
  'Accessoires',
  'Sacs',
  // Autres commerces
  'Électronique',
  'Téléphonie',
  'Cosmétiques',
  'Pharmacie',
  'Quincaillerie',
  'Librairie',
  'Jouets',
  'Divers',
]
