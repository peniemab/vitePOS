import type { Product } from '../db/types'

export function collectCategories(products: Product[]): string[] {
  const set = new Set<string>()
  for (const p of products) {
    if (!p.archived && p.category) set.add(p.category)
  }
  return [...set].sort((a, b) => a.localeCompare(b, 'fr'))
}

export function matchProductQuery(p: Product, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return (
    p.name.toLowerCase().includes(q) ||
    p.category.toLowerCase().includes(q) ||
    (!!p.barcode && p.barcode.toLowerCase().includes(q))
  )
}

/** Exact barcode match (scanners / saisie complète) */
export function findByBarcode(products: Product[], code: string): Product | undefined {
  const c = code.trim()
  if (!c) return undefined
  return products.find((p) => !p.archived && p.barcode && p.barcode === c)
}

export function sortForCaisse(products: Product[]): Product[] {
  return [...products].sort((a, b) => {
    if (a.favorite !== b.favorite) return a.favorite ? -1 : 1
    if (a.stock <= 0 !== b.stock <= 0) return a.stock <= 0 ? 1 : -1
    return a.name.localeCompare(b.name, 'fr')
  })
}
