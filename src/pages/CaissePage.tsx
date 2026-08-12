import { useDeferredValue, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import type { Product } from '../db/types'
import { useAuth } from '../lib/auth'
import { useCart } from '../lib/cart'
import { formatMoney } from '../lib/utils'
import { canApplyDiscount } from '../lib/roles'
import { BarcodeScanField } from '../components/BarcodeScanField'
import {
  collectCategories,
  findByBarcode,
  matchProductQuery,
  sortForCaisse,
} from '../lib/product-search'

const VISIBLE_LIMIT = 120

function productIcon(category: string) {
  const c = category.toLowerCase()
  if (c.includes('boisson')) return 'water_drop'
  if (c.includes('boulang') || c.includes('pain')) return 'bakery_dining'
  if (c.includes('hygiène') || c.includes('hygiene') || c.includes('savon')) return 'soap'
  if (c.includes('condiment') || c.includes('aliment') || c.includes('épicerie')) return 'grocery'
  if (
    c.includes('basket') ||
    c.includes('chaussure') ||
    c.includes('sneaker') ||
    c.includes('soulier')
  )
    return 'steps'
  if (
    c.includes('vêt') ||
    c.includes('vetement') ||
    c.includes('habit') ||
    c.includes('mode') ||
    c.includes('t-shirt') ||
    c.includes('pantalon')
  )
    return 'checkroom'
  if (c.includes('sac') || c.includes('accessoire')) return 'shopping_bag'
  if (c.includes('électro') || c.includes('electron') || c.includes('téléphon') || c.includes('phone'))
    return 'devices'
  if (c.includes('cosmétique') || c.includes('beauté') || c.includes('beaute')) return 'spa'
  if (c.includes('pharmac')) return 'medication'
  if (c.includes('quincaill') || c.includes('outil')) return 'construction'
  if (c.includes('livre') || c.includes('librair')) return 'menu_book'
  if (c.includes('jouet')) return 'toys'
  return 'inventory_2'
}

/** Tableau style Excel / Word */
const th =
  'border border-[#b4b4b4] bg-[#e7e6e6] px-2 py-1.5 text-left font-semibold text-[12px] text-[#1f1f1f] sticky top-0 z-10'
const td = 'border border-[#b4b4b4] px-2 py-1.5 text-[13px] text-[#1f1f1f] align-middle'
const tdRight = `${td} text-right tabular-nums`
const tdCenter = `${td} text-center tabular-nums`

export function CaissePage() {
  const { boutique, user } = useAuth()
  const cart = useCart()
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const deferredQ = useDeferredValue(q)
  const [category, setCategory] = useState<string>('all')
  const [scanMsg, setScanMsg] = useState('')
  const [cartOpen, setCartOpen] = useState(false)

  const products = useLiveQuery(
    () =>
      boutique
        ? db.products
            .where('boutiqueId')
            .equals(boutique.id)
            .filter((p) => !p.archived)
            .toArray()
        : [],
    [boutique?.id],
  )

  const categories = useMemo(() => collectCategories(products || []), [products])

  const filtered = useMemo(() => {
    let list = products || []
    if (category !== 'all' && category !== 'fav') {
      list = list.filter((p) => p.category === category)
    }
    if (category === 'fav') list = list.filter((p) => p.favorite)
    list = list.filter((p) => matchProductQuery(p, deferredQ))
    return sortForCaisse(list)
  }, [products, deferredQ, category])

  const visible = filtered.slice(0, VISIBLE_LIMIT)
  const articleCount = cart.lines.reduce((s, l) => s + l.quantity, 0)

  if (!boutique || !user) return null

  function handleScan(code: string) {
    const list = products || []
    const exact = findByBarcode(list, code)
    if (exact) {
      if (exact.stock <= 0) {
        setScanMsg(`Stock épuisé : ${exact.name}`)
        return
      }
      cart.addProduct(exact)
      setScanMsg(`+ ${exact.name}`)
      setQ('')
      return
    }
    setQ(code)
    setScanMsg(list.some((p) => matchProductQuery(p, code)) ? '' : 'Aucun produit trouvé')
  }

  function addLine(p: Product) {
    if (p.stock <= 0) {
      setScanMsg(`Stock épuisé : ${p.name}`)
      return
    }
    cart.addProduct(p)
    setScanMsg(`+ ${p.name}`)
  }

  const categoryChips = (
    <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
      <button
        type="button"
        onClick={() => setCategory('all')}
        className={`shrink-0 px-3 h-8 rounded-full font-label-mono text-label-mono border transition-colors ${
          category === 'all'
            ? 'bg-primary text-on-primary border-primary'
            : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant'
        }`}
      >
        Tous ({products?.length || 0})
      </button>
      <button
        type="button"
        onClick={() => setCategory('fav')}
        className={`shrink-0 px-3 h-8 rounded-full font-label-mono text-label-mono border transition-colors ${
          category === 'fav'
            ? 'bg-primary text-on-primary border-primary'
            : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant'
        }`}
      >
        Favoris
      </button>
      {categories.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => setCategory(c)}
          className={`shrink-0 px-3 h-8 rounded-full font-label-mono text-label-mono border transition-colors ${
            category === c
              ? 'bg-primary text-on-primary border-primary'
              : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant'
          }`}
        >
          {c}
        </button>
      ))}
    </div>
  )

  const productListMobile = (
    <div className="flex flex-col gap-2 lg:hidden">
      {visible.map((p) => {
        const low = p.stock <= p.alertThreshold
        return (
          <div
            key={p.id}
            className={`flex items-center justify-between bg-surface-container-lowest border border-surface-variant p-3 rounded-lg min-h-[64px] active:bg-surface-variant transition-colors ${
              p.stock <= 0 ? 'opacity-50' : ''
            }`}
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-11 h-11 rounded-md bg-surface-container flex-shrink-0 flex items-center justify-center border border-outline-variant">
                <span className="material-symbols-outlined text-outline">
                  {productIcon(p.category)}
                </span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-body-md text-body-md font-semibold text-on-surface truncate">
                  {p.favorite ? '★ ' : ''}
                  {p.name}
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-label-mono text-label-mono text-on-surface-variant truncate">
                    {p.category}
                  </span>
                  <span
                    className={`font-label-mono text-label-mono shrink-0 ${
                      p.stock <= 0
                        ? 'text-error'
                        : low
                          ? 'text-secondary'
                          : 'text-on-tertiary-container'
                    }`}
                  >
                    · {p.stock}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 pl-2 flex-shrink-0">
              <span className="font-headline-md text-[16px] text-on-surface whitespace-nowrap">
                {formatMoney(p.sellPrice, boutique.currency)}
              </span>
              <button
                type="button"
                aria-label={`Ajouter ${p.name}`}
                disabled={p.stock <= 0}
                onClick={() => addLine(p)}
                className="w-10 h-10 rounded-lg bg-primary-container text-on-primary-container flex items-center justify-center active:scale-95 disabled:opacity-40"
              >
                <span className="material-symbols-outlined">add</span>
              </button>
            </div>
          </div>
        )
      })}
      {!visible.length && (
        <p className="font-body-md text-body-md text-on-surface-variant py-8 text-center">
          Aucun produit — affinez la recherche ou changez de catégorie.
        </p>
      )}
    </div>
  )

  const catalogTable = (
    <div className="hidden lg:block flex-1 min-h-0 overflow-auto border border-[#b4b4b4] bg-white">
      <table className="w-full border-collapse table-fixed">
        <thead>
          <tr>
            <th className={`${th} w-[12%] text-right`}>Stock</th>
            <th className={`${th} w-[42%]`}>Désignation</th>
            <th className={`${th} w-[18%]`}>Catégorie</th>
            <th className={`${th} w-[18%] text-right`}>Prix unit.</th>
            <th className={`${th} w-[10%] text-center`}>Ajout</th>
          </tr>
        </thead>
        <tbody>
          {visible.map((p, i) => {
            const low = p.stock <= p.alertThreshold
            return (
              <tr
                key={p.id}
                className={`${i % 2 === 1 ? 'bg-[#f2f2f2]' : 'bg-white'} ${
                  p.stock <= 0 ? 'opacity-45' : 'hover:bg-[#fff2cc] cursor-pointer'
                }`}
                onClick={() => {
                  if (p.stock > 0) addLine(p)
                }}
              >
                <td
                  className={`${tdRight} ${
                    p.stock <= 0 ? 'text-error' : low ? 'text-secondary font-semibold' : ''
                  }`}
                >
                  {p.stock}
                </td>
                <td className={`${td} truncate font-medium`}>
                  {p.favorite ? '★ ' : ''}
                  {p.name}
                </td>
                <td className={`${td} truncate text-[#595959]`}>{p.category}</td>
                <td className={tdRight}>{formatMoney(p.sellPrice, boutique.currency)}</td>
                <td className={tdCenter}>
                  <button
                    type="button"
                    disabled={p.stock <= 0}
                    aria-label={`Ajouter ${p.name}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      addLine(p)
                    }}
                    className="inline-flex items-center justify-center w-8 h-7 border border-[#b4b4b4] bg-[#e7e6e6] hover:bg-primary hover:text-on-primary hover:border-primary disabled:opacity-40"
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span>
                  </button>
                </td>
              </tr>
            )
          })}
          {!visible.length && (
            <tr>
              <td colSpan={5} className={`${td} text-center text-[#595959] py-10`}>
                Aucun produit — affinez la recherche.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      {filtered.length > VISIBLE_LIMIT && (
        <p className="text-[12px] text-[#595959] text-center py-2 border-t border-[#b4b4b4] bg-[#fafafa]">
          {VISIBLE_LIMIT} affichés sur {filtered.length} — affinez la recherche
        </p>
      )}
    </div>
  )

  const cartTable = (
    <div className="flex-1 min-h-0 overflow-auto">
      <table className="w-full border-collapse table-fixed">
        <colgroup>
          <col className="w-[8%]" />
          <col className="w-[32%]" />
          <col className="w-[28%]" />
          <col className="w-[15%]" />
          <col className="w-[17%]" />
        </colgroup>
        <thead>
          <tr>
            <th className={`${th} text-center`}>N°</th>
            <th className={th}>Article</th>
            <th className={`${th} text-center`}>Qté</th>
            <th className={`${th} text-right`}>P.U.</th>
            <th className={`${th} text-right`}>Montant</th>
          </tr>
        </thead>
        <tbody>
          {cart.lines.length === 0 && (
            <tr>
              <td colSpan={5} className={`${td} text-center text-[#595959] py-8`}>
                Aucune ligne
              </td>
            </tr>
          )}
          {cart.lines.map((l, i) => {
            const product = (products || []).find((p) => p.id === l.productId)
            const maxStock = product?.stock ?? 99999
            return (
              <tr key={l.productId} className={i % 2 === 1 ? 'bg-[#f2f2f2]' : 'bg-white'}>
                <td className={tdCenter}>{i + 1}</td>
                <td className={`${td} truncate`}>{l.productName}</td>
                <td className={`${td} !px-1`}>
                  <div className="flex items-center justify-center gap-1 min-w-0">
                    <button
                      type="button"
                      className="shrink-0 w-6 h-6 border border-[#b4b4b4] bg-[#e7e6e6] text-[13px] leading-none hover:bg-[#d0d0d0]"
                      onClick={() => cart.setQty(l.productId, l.quantity - 1)}
                      aria-label="Diminuer"
                    >
                      −
                    </button>
                    <input
                      className="w-8 min-w-0 h-6 text-center border border-[#b4b4b4] bg-white text-[12px] tabular-nums outline-none focus:border-primary"
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={maxStock}
                      value={l.quantity}
                      onFocus={(e) => e.currentTarget.select()}
                      onChange={(e) => {
                        const raw = e.target.value
                        if (raw === '') return
                        let n = Math.floor(Number(raw))
                        if (!Number.isFinite(n) || n < 1) n = 1
                        if (n > maxStock) {
                          n = maxStock
                          setScanMsg(`Stock max : ${maxStock}`)
                        }
                        cart.setQty(l.productId, n)
                      }}
                    />
                    <button
                      type="button"
                      disabled={l.quantity >= maxStock}
                      className="shrink-0 w-6 h-6 border border-[#b4b4b4] bg-[#e7e6e6] text-[13px] leading-none hover:bg-[#d0d0d0] disabled:opacity-40"
                      onClick={() => cart.setQty(l.productId, Math.min(maxStock, l.quantity + 1))}
                      aria-label="Augmenter"
                    >
                      +
                    </button>
                  </div>
                </td>
                <td className={`${tdRight} whitespace-nowrap`}>
                  {formatMoney(l.unitPrice, boutique.currency)}
                </td>
                <td className={`${tdRight} font-semibold whitespace-nowrap`}>
                  {formatMoney(l.lineTotal, boutique.currency)}
                </td>
              </tr>
            )
          })}
        </tbody>
        {cart.lines.length > 0 && (
          <tfoot>
            {cart.discountPercent > 0 && (
              <tr className="bg-[#fafafa]">
                <td colSpan={4} className={`${td} text-right text-[#595959]`}>
                  Remise ({cart.discountPercent} %)
                </td>
                <td className={`${tdRight} text-secondary`}>
                  −{formatMoney(cart.discount, boutique.currency)}
                </td>
              </tr>
            )}
            <tr className="bg-[#e7e6e6]">
              <td colSpan={4} className={`${td} text-right font-bold`}>
                TOTAL
              </td>
              <td className={`${tdRight} font-bold text-primary`}>
                {formatMoney(cart.total, boutique.currency)}
              </td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  )

  const discountBlock =
    canApplyDiscount(user) && cart.lines.length > 0 ? (
      <div className="flex items-center gap-2 flex-wrap shrink-0">
        <span className="text-[12px] font-semibold text-[#595959]">Remise %</span>
        {[0, 5, 10, 15, 20].map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => cart.setDiscountPercent(p)}
            className={`h-7 min-w-8 px-2 text-[12px] border border-[#b4b4b4] ${
              cart.discountPercent === p
                ? 'bg-primary text-on-primary border-primary'
                : 'bg-white hover:bg-[#f2f2f2]'
            }`}
          >
            {p}
          </button>
        ))}
      </div>
    ) : null

  return (
    <div className="relative flex flex-col lg:flex-row gap-stack-md -mx-margin-mobile md:-mx-margin-desktop px-margin-mobile md:px-margin-desktop pb-[150px] lg:pb-4 lg:min-h-[calc(100dvh-4.5rem)] lg:items-stretch">
      <section className="flex flex-col gap-stack-md flex-1 min-w-0 lg:overflow-hidden">
        <BarcodeScanField value={q} onChange={setQ} onScan={handleScan} autoFocus />

        {scanMsg && (
          <p className="font-label-mono text-label-mono text-on-tertiary-container -mt-2">
            {scanMsg}
          </p>
        )}

        {categoryChips}

        {productListMobile}
        {catalogTable}

        {filtered.length > VISIBLE_LIMIT && (
          <p className="lg:hidden font-label-mono text-label-mono text-on-surface-variant text-center">
            {VISIBLE_LIMIT} affichés sur {filtered.length} — affinez la recherche
          </p>
        )}
      </section>

      {/* Panier desktop = tableau Excel */}
      <aside className="hidden lg:flex w-full max-w-[460px] xl:max-w-[500px] shrink-0 flex-col gap-2 sticky top-[calc(3.5rem+1rem)] max-h-[calc(100dvh-5.5rem)]">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-[14px] font-bold text-primary">
            Bon de caisse · {articleCount} art.
          </h2>
          {cart.lines.length > 0 && (
            <button
              type="button"
              onClick={() => cart.clear()}
              className="h-7 px-2 text-[12px] border border-[#b4b4b4] bg-white hover:bg-[#f2f2f2]"
            >
              Vider
            </button>
          )}
        </div>

        <div className="flex flex-col flex-1 min-h-0 border border-[#b4b4b4] bg-white overflow-hidden">
          {cartTable}
        </div>

        {discountBlock}

        <button
          type="button"
          disabled={!cart.lines.length}
          onClick={() => navigate('/caisse/paiement')}
          className="w-full h-12 bg-secondary text-on-secondary text-[14px] font-semibold flex items-center justify-center gap-2 disabled:opacity-40 shrink-0"
        >
          Encaisser {formatMoney(cart.total, boutique.currency)}
          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
        </button>
      </aside>

      {/* Barre flottante mobile */}
      <div className="lg:hidden fixed bottom-[72px] md:bottom-4 left-0 md:left-[72px] right-0 px-margin-mobile md:px-margin-desktop z-40 pointer-events-none">
        <div className="bg-surface-container-lowest border border-outline-variant shadow-[0_-4px_16px_rgba(0,0,0,0.05)] rounded-lg p-3 flex items-center justify-between pointer-events-auto max-w-7xl mx-auto">
          <button
            type="button"
            className="flex flex-col text-left"
            onClick={() => setCartOpen(true)}
          >
            <span className="font-label-mono text-label-mono text-on-surface-variant uppercase tracking-wider">
              Panier
            </span>
            <span className="font-headline-md text-headline-md font-bold text-primary">
              {articleCount} article{articleCount !== 1 ? 's' : ''}
            </span>
          </button>
          <button
            type="button"
            disabled={!cart.lines.length}
            onClick={() => navigate('/caisse/paiement')}
            className="bg-secondary text-on-secondary h-[56px] px-5 sm:px-6 rounded-lg font-headline-md text-headline-md font-semibold flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-sm min-w-0 sm:min-w-[160px] disabled:opacity-40"
          >
            <span className="hidden sm:inline">Encaisser</span>
            <span>{formatMoney(cart.total, boutique.currency)}</span>
            <span className="material-symbols-outlined ml-1">arrow_forward</span>
          </button>
        </div>
      </div>

      {cartOpen && (
        <div className="lg:hidden fixed inset-0 z-[70] flex flex-col justify-end md:justify-center md:items-end md:p-6">
          <button
            type="button"
            className="absolute inset-0 bg-on-surface/40"
            aria-label="Fermer le panier"
            onClick={() => setCartOpen(false)}
          />
          <div className="relative bg-white border border-[#b4b4b4] rounded-t-2xl md:rounded max-h-[80vh] md:max-h-[85vh] md:w-[420px] overflow-hidden p-3 pb-6 flex flex-col gap-3 shadow-lg">
            <div className="flex items-center justify-between shrink-0">
              <h2 className="text-[14px] font-bold text-primary">Bon de caisse</h2>
              <button
                type="button"
                className="w-10 h-10 flex items-center justify-center"
                onClick={() => setCartOpen(false)}
                aria-label="Fermer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="border border-[#b4b4b4] flex-1 min-h-0 overflow-hidden flex flex-col">
              {cartTable}
            </div>
            {discountBlock}

            <button
              type="button"
              disabled={!cart.lines.length}
              onClick={() => {
                setCartOpen(false)
                navigate('/caisse/paiement')
              }}
              className="w-full h-12 bg-secondary text-on-secondary text-[14px] font-semibold flex items-center justify-center gap-2 disabled:opacity-40 shrink-0"
            >
              Encaisser {formatMoney(cart.total, boutique.currency)}
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
