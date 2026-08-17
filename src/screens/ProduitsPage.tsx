import { useCallback, useDeferredValue, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { useAuth } from '../lib/auth'
import { adjustStock, archiveProduct, upsertProduct } from '../lib/services'
import { canEditPrices, canEditStock, canSeeBuyPrice } from '../lib/roles'
import { formatMoney } from '../lib/utils'
import { collectCategories, matchProductQuery } from '../lib/product-search'
import { exportProductsCsv, SUGGESTED_CATEGORIES } from '../lib/csv-import'
import { Modal } from '../components/Modal'

const PAGE_SIZE = 40

const UNIT_OPTIONS = [
  { value: 'u', label: 'Pièce' },
  { value: 'kg', label: 'Kg' },
  { value: 'L', label: 'Litre' },
] as const

const emptyForm = {
  name: '',
  category: 'Divers',
  sellPrice: 0,
  buyPrice: 0,
  stock: 0,
  alertThreshold: 5,
  unit: 'u',
  barcode: '',
  favorite: false,
}

export function ProduitsPage() {
  const { boutique, user } = useAuth()
  const products = useLiveQuery(
    () =>
      boutique
        ? db.products.where('boutiqueId').equals(boutique.id).reverse().sortBy('updatedAt')
        : [],
    [boutique?.id],
  )
  const [q, setQ] = useState('')
  const deferredQ = useDeferredValue(q)
  const [category, setCategory] = useState<string>('all')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | undefined>()
  const [form, setForm] = useState(emptyForm)
  const [initialStock, setInitialStock] = useState(0)
  const [saving, setSaving] = useState(false)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [showMove, setShowMove] = useState(false)
  const [stockDelta, setStockDelta] = useState({
    productId: '',
    delta: 0,
    type: 'reappro',
    reason: '',
  })

  const active = useMemo(() => (products || []).filter((p) => !p.archived), [products])
  const categories = useMemo(() => collectCategories(active), [active])
  const categoryOptions = useMemo(() => {
    const set = new Set([...SUGGESTED_CATEGORIES, ...categories])
    return [...set].sort((a, b) => a.localeCompare(b, 'fr'))
  }, [categories])

  const filtered = useMemo(() => {
    let list = active
    if (category !== 'all') list = list.filter((p) => p.category === category)
    list = list.filter((p) => matchProductQuery(p, deferredQ))
    return list
  }, [active, deferredQ, category])

  const visible = filtered.slice(0, visibleCount)

  const closeForm = useCallback(() => {
    setShowForm(false)
    setEditingId(undefined)
  }, [])

  if (!boutique || !user) return null

  const boutiqueId = boutique.id
  const currentUser = user
  const currencyLabel = boutique.currency === 'CDF' ? 'FC' : boutique.currency

  function openCreate() {
    setEditingId(undefined)
    setInitialStock(0)
    setForm({
      ...emptyForm,
      category: category !== 'all' ? category : 'Divers',
    })
    setShowForm(true)
  }

  function openEdit(id: string) {
    const p = products?.find((x) => x.id === id)
    if (!p) return
    setEditingId(id)
    setInitialStock(p.stock)
    setForm({
      name: p.name,
      category: p.category,
      sellPrice: p.sellPrice,
      buyPrice: p.buyPrice || 0,
      stock: p.stock,
      alertThreshold: p.alertThreshold,
      unit: p.unit,
      barcode: p.barcode || '',
      favorite: p.favorite,
    })
    setShowForm(true)
  }

  async function onSave(e: FormEvent) {
    e.preventDefault()
    if (!canEditPrices(currentUser)) return
    setSaving(true)
    try {
      const product = await upsertProduct({
        id: editingId,
        boutiqueId,
        name: form.name,
        category: form.category,
        sellPrice: form.sellPrice,
        buyPrice: canSeeBuyPrice(currentUser) ? form.buyPrice : undefined,
        stock: editingId ? undefined : form.stock,
        alertThreshold: form.alertThreshold,
        unit: form.unit,
        barcode: form.barcode || undefined,
        favorite: form.favorite,
      })

      if (editingId && canEditStock(currentUser) && form.stock !== initialStock) {
        const delta = form.stock - initialStock
        if (delta !== 0) {
          await adjustStock({
            boutiqueId,
            productId: product.id,
            delta,
            type: 'correction',
            userId: currentUser.id,
            reason: 'Ajustement fiche produit',
          })
        }
      }
      closeForm()
    } finally {
      setSaving(false)
    }
  }

  async function onDelete() {
    if (!editingId || !canEditPrices(currentUser)) return
    if (!window.confirm('Archiver ce produit ? Il disparaîtra du stock et de la caisse.')) return
    setSaving(true)
    try {
      await archiveProduct(editingId)
      closeForm()
    } finally {
      setSaving(false)
    }
  }

  async function onMove(e: FormEvent) {
    e.preventDefault()
    if (!canEditStock(currentUser)) return
    const type = stockDelta.type as 'reappro' | 'casse' | 'don' | 'correction'
    let delta = stockDelta.delta
    if ((type === 'casse' || type === 'don') && delta > 0) delta = -delta
    if (type === 'reappro' && delta < 0) delta = Math.abs(delta)
    await adjustStock({
      boutiqueId,
      productId: stockDelta.productId,
      delta,
      type,
      userId: currentUser.id,
      reason: stockDelta.reason,
    })
    setStockDelta({ productId: '', delta: 0, type: 'reappro', reason: '' })
    setShowMove(false)
  }

  function onExport() {
    const csv = exportProductsCsv(active)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `produits-${boutique!.name.replace(/\s+/g, '-')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function setCategoryFilter(next: string) {
    setCategory(next)
    setVisibleCount(PAGE_SIZE)
  }

  return (
    <div className="flex flex-col gap-stack-md w-full max-w-5xl mx-auto">
      {/* Action & Search */}
      <section className="flex flex-col md:flex-row gap-stack-md w-full items-start md:items-center">
        <div className="relative w-full md:w-1/2">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
            search
          </span>
          <input
            className="w-full pl-10 pr-4 py-3 rounded-lg border border-outline-variant bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-body-md text-body-md text-on-surface"
            placeholder="Rechercher un produit, SKU..."
            type="search"
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              setVisibleCount(PAGE_SIZE)
            }}
          />
        </div>
        <div className="flex gap-stack-sm w-full md:w-auto md:ml-auto flex-wrap">
          <Link
            to="/stock-bas"
            className="h-[48px] md:h-[56px] px-4 bg-surface-container-lowest text-on-surface font-body-md text-body-md rounded-lg flex items-center justify-center gap-2 border border-outline-variant hover:bg-surface-container"
          >
            <span className="material-symbols-outlined">warning</span>
            Alertes
          </Link>
          {canEditPrices(currentUser) && (
            <>
              <Link
                to="/produits/import"
                className="flex-1 md:flex-none h-[48px] md:h-[56px] px-6 bg-surface-container-high text-on-surface font-headline-md text-headline-md rounded-lg flex items-center justify-center gap-2 hover:bg-surface-container-highest transition-colors border border-outline-variant"
              >
                <span className="material-symbols-outlined">upload_file</span>
                Import CSV
              </Link>
              <button
                type="button"
                onClick={onExport}
                className="h-[48px] md:h-[56px] px-4 bg-surface-container-lowest text-on-surface rounded-lg border border-outline-variant hover:bg-surface-container flex items-center gap-1 font-body-md text-body-md"
              >
                <span className="material-symbols-outlined">download</span>
                Export
              </button>
              <button
                type="button"
                onClick={openCreate}
                className="flex-1 md:flex-none h-[48px] md:h-[56px] px-6 bg-primary text-on-primary font-headline-md text-headline-md rounded-lg flex items-center justify-center gap-2 hover:bg-primary-container transition-colors shadow-sm"
              >
                <span className="material-symbols-outlined">add</span>
                Ajouter
              </button>
            </>
          )}
          {canEditStock(currentUser) && (
            <button
              type="button"
              onClick={() => setShowMove(true)}
              className="h-[48px] md:h-[56px] px-4 bg-surface-container-lowest text-on-surface rounded-lg border border-outline-variant hover:bg-surface-container flex items-center gap-1 font-body-md text-body-md"
            >
              <span className="material-symbols-outlined">swap_vert</span>
              Mouvement
            </button>
          )}
        </div>
      </section>

      {/* Category filters */}
      <section className="flex gap-stack-sm overflow-x-auto pb-2 w-full scrollbar-hide">
        <button
          type="button"
          onClick={() => setCategoryFilter('all')}
          className={`px-4 py-2 rounded-full border font-body-md text-body-md whitespace-nowrap transition-colors ${
            category === 'all'
              ? 'border-primary bg-primary text-on-primary'
              : 'border-outline-variant bg-surface-container-lowest text-on-surface hover:bg-surface-container'
          }`}
        >
          Tous
        </button>
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategoryFilter(c)}
            className={`px-4 py-2 rounded-full border font-body-md text-body-md whitespace-nowrap transition-colors ${
              category === c
                ? 'border-primary bg-primary text-on-primary'
                : 'border-outline-variant bg-surface-container-lowest text-on-surface hover:bg-surface-container'
            }`}
          >
            {c}
          </button>
        ))}
      </section>

      <p className="font-label-mono text-label-mono text-on-surface-variant -mt-2">
        {filtered.length} produit{filtered.length !== 1 ? 's' : ''}
        {category !== 'all' ? ` · ${category}` : ''}
      </p>

      {/* Dense stock list */}
      <section className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden flex flex-col mt-2">
        <div className="hidden md:grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-4 p-4 border-b border-outline-variant bg-surface-container-low font-label-mono text-label-mono text-on-surface-variant uppercase">
          <div>Produit</div>
          <div>Catégorie</div>
          <div>Stock (Qté)</div>
          <div>Prix ({currencyLabel})</div>
          <div className="w-8" />
        </div>

        <div className="flex flex-col">
          {visible.map((p) => {
            const low = p.stock > 0 && p.stock <= p.alertThreshold
            const empty = p.stock <= 0
            return (
              <div
                key={p.id}
                className={`grid grid-cols-[1fr_auto] md:grid-cols-[1fr_1fr_1fr_1fr_auto] gap-2 md:gap-4 p-4 border-b border-outline-variant hover:bg-surface-container-low active:bg-surface-container transition-colors items-center h-auto md:h-[56px] ${
                  empty ? 'opacity-75' : ''
                }`}
              >
                <div className="flex flex-col justify-center min-w-0">
                  <span className="font-body-md text-body-md font-semibold text-on-surface truncate">
                    {p.favorite ? '★ ' : ''}
                    {p.name}
                  </span>
                  <span className="font-label-mono text-label-mono text-on-surface-variant md:hidden truncate">
                    {p.barcode || p.category}
                  </span>
                </div>

                <div className="hidden md:flex font-body-md text-body-md text-on-surface-variant items-center truncate">
                  {p.category}
                </div>

                <div
                  className={`flex items-center gap-2 font-headline-md text-headline-md row-start-2 col-start-1 md:row-auto md:col-auto ${
                    empty ? 'text-secondary' : low ? 'text-error' : 'text-on-surface'
                  }`}
                >
                  {empty && (
                    <span className="material-symbols-outlined text-sm">block</span>
                  )}
                  {low && !empty && (
                    <span className="material-symbols-outlined text-sm">warning</span>
                  )}
                  {p.stock}
                </div>

                <div className="font-headline-md text-headline-md text-on-surface row-start-1 col-start-2 text-right md:text-left md:row-auto md:col-auto flex items-center justify-end md:justify-start">
                  {formatMoney(p.sellPrice, boutique.currency).replace(/\s*[A-Z]{3}$/, '').trim() ||
                    formatMoney(p.sellPrice, boutique.currency)}
                </div>

                <div className="flex justify-end row-start-2 col-start-2 md:row-auto md:col-auto">
                  <button
                    type="button"
                    aria-label={`Modifier ${p.name}`}
                    onClick={() => openEdit(p.id)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-variant hover:text-primary transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px]">edit</span>
                  </button>
                </div>
              </div>
            )
          })}

          {!visible.length && (
            <p className="p-8 text-center font-body-md text-body-md text-on-surface-variant">
              Aucun produit dans ce filtre.
            </p>
          )}
        </div>

        {filtered.length > visibleCount && (
          <div className="p-4 flex justify-center border-t border-outline-variant bg-surface-container-low">
            <button
              type="button"
              className="text-primary font-headline-md text-headline-md hover:underline"
              onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
            >
              Charger plus de produits…
            </button>
          </div>
        )}
      </section>

      {/* Product form modal */}
      <Modal
        open={showForm && canEditPrices(currentUser)}
        title={editingId ? 'Modifier le produit' : 'Nouveau produit'}
        icon="edit_square"
        onClose={closeForm}
        footer={
          <div className="flex flex-col-reverse md:flex-row justify-between gap-3">
            {editingId ? (
              <button
                type="button"
                onClick={() => void onDelete()}
                disabled={saving}
                className="h-[56px] px-6 border border-error text-error rounded font-headline-md text-headline-md flex items-center justify-center gap-2 hover:bg-error-container hover:text-on-error-container transition-colors disabled:opacity-50"
              >
                <span className="material-symbols-outlined">delete</span>
                Supprimer
              </button>
            ) : (
              <button
                type="button"
                onClick={closeForm}
                className="h-[56px] px-6 border border-outline-variant text-on-surface rounded font-headline-md text-headline-md"
              >
                Annuler
              </button>
            )}
            <button
              type="submit"
              form="product-form"
              disabled={saving}
              className="h-[56px] px-8 bg-primary text-on-primary rounded font-headline-md text-headline-md flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors shadow-sm active:scale-[0.98] disabled:opacity-60 md:ml-auto"
            >
              <span className="material-symbols-outlined">save</span>
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        }
      >
        <form id="product-form" className="space-y-stack-md" onSubmit={onSave}>
          {/* Identité */}
          <section className="bg-surface p-4 rounded-lg border border-outline-variant space-y-4">
            <h3 className="font-label-mono text-label-mono text-primary tracking-wider uppercase mb-2">
              Identité
            </h3>
            <div>
              <label className="block font-label-mono text-label-mono text-on-surface-variant mb-1">
                Nom du produit
              </label>
              <input
                className="w-full bg-surface border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary rounded h-12 px-3 font-body-lg text-body-lg text-on-surface outline-none"
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                placeholder="Ex. Farine de Manioc"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-label-mono text-label-mono text-on-surface-variant mb-1">
                  Catégorie
                </label>
                <input
                  className="w-full bg-surface border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary rounded h-12 px-3 font-body-md text-body-md text-on-surface outline-none"
                  list="category-list"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  placeholder="Ex. Baskets, Vêtements, Boissons…"
                />
                <p className="mt-1 font-label-mono text-[11px] text-on-surface-variant">
                  Libre : tapez votre catégorie (ex. Baskets). Elle apparaîtra ensuite en filtre
                  caisse / stock.
                </p>
                <datalist id="category-list">
                  {categoryOptions.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="block font-label-mono text-label-mono text-on-surface-variant mb-1">
                  Code-barres (SKU)
                </label>
                <div className="relative">
                  <input
                    className="w-full bg-surface border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary rounded h-12 px-3 pl-10 font-label-mono text-label-mono text-on-surface outline-none"
                    type="text"
                    value={form.barcode}
                    onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                    placeholder="890123456789"
                  />
                  <span className="material-symbols-outlined absolute left-3 top-3 text-on-surface-variant text-xl">
                    barcode_scanner
                  </span>
                </div>
              </div>
            </div>
            <label className="flex items-center gap-2 font-body-md text-body-md pt-1">
              <input
                type="checkbox"
                checked={form.favorite}
                onChange={(e) => setForm({ ...form, favorite: e.target.checked })}
                className="rounded border-outline-variant"
              />
              Favori en caisse
            </label>
          </section>

          {/* Tarification */}
          <section className="bg-surface p-4 rounded-lg border border-outline-variant space-y-4">
            <h3 className="font-label-mono text-label-mono text-primary tracking-wider uppercase mb-2">
              Tarification
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {canSeeBuyPrice(currentUser) && (
                <div>
                  <label className="block font-label-mono text-label-mono text-on-surface-variant mb-1">
                    Prix d&apos;achat ({currencyLabel})
                  </label>
                  <input
                    className="w-full bg-surface border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary rounded h-12 px-3 font-body-lg text-body-lg text-on-surface outline-none"
                    type="number"
                    min={0}
                    value={form.buyPrice || ''}
                    onChange={(e) => setForm({ ...form, buyPrice: Number(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
              )}
              <div className={canSeeBuyPrice(currentUser) ? '' : 'col-span-2'}>
                <label className="block font-label-mono text-label-mono text-on-surface-variant mb-1 font-bold">
                  Prix de vente ({currencyLabel})
                </label>
                <input
                  className="w-full bg-surface-container-lowest border-primary border-2 focus:ring-0 rounded h-12 px-3 font-headline-md text-headline-md text-primary outline-none"
                  type="number"
                  min={0}
                  value={form.sellPrice || ''}
                  onChange={(e) => setForm({ ...form, sellPrice: Number(e.target.value) || 0 })}
                  required
                  placeholder="0"
                />
              </div>
            </div>
            <div>
              <label className="block font-label-mono text-label-mono text-on-surface-variant mb-1">
                Unité de vente
              </label>
              <div className="flex gap-2">
                {UNIT_OPTIONS.map((u) => (
                  <button
                    key={u.value}
                    type="button"
                    onClick={() => setForm({ ...form, unit: u.value })}
                    className={`flex-1 py-2 border font-body-md text-body-md rounded transition-colors ${
                      form.unit === u.value
                        ? 'border-primary bg-primary-container text-on-primary-container'
                        : 'border-outline-variant bg-surface text-on-surface hover:bg-surface-container'
                    }`}
                  >
                    {u.label}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Stock */}
          <section className="bg-surface p-4 rounded-lg border border-outline-variant space-y-4">
            <h3 className="font-label-mono text-label-mono text-primary tracking-wider uppercase mb-2">
              Gestion du Stock
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-label-mono text-label-mono text-on-surface-variant mb-1">
                  {editingId ? 'Stock Actuel' : 'Stock Initial'}
                </label>
                <div className="flex items-center">
                  <button
                    type="button"
                    aria-label="Diminuer stock"
                    disabled={editingId ? !canEditStock(currentUser) : false}
                    onClick={() =>
                      setForm({ ...form, stock: Math.max(0, form.stock - 1) })
                    }
                    className="h-12 w-12 border border-outline-variant rounded-l bg-surface-container hover:bg-surface-container-high flex items-center justify-center disabled:opacity-40"
                  >
                    <span className="material-symbols-outlined">remove</span>
                  </button>
                  <input
                    className="w-full text-center border-y border-outline-variant border-x-0 h-12 font-headline-md text-headline-md focus:ring-0 outline-none bg-surface"
                    type="number"
                    min={0}
                    value={form.stock}
                    disabled={editingId ? !canEditStock(currentUser) : false}
                    onChange={(e) =>
                      setForm({ ...form, stock: Math.max(0, Number(e.target.value) || 0) })
                    }
                    onFocus={(e) => e.currentTarget.select()}
                  />
                  <button
                    type="button"
                    aria-label="Augmenter stock"
                    disabled={editingId ? !canEditStock(currentUser) : false}
                    onClick={() => setForm({ ...form, stock: form.stock + 1 })}
                    className="h-12 w-12 border border-outline-variant rounded-r bg-surface-container hover:bg-surface-container-high flex items-center justify-center disabled:opacity-40"
                  >
                    <span className="material-symbols-outlined">add</span>
                  </button>
                </div>
              </div>
              <div>
                <label className="block font-label-mono text-label-mono text-on-surface-variant mb-1">
                  Seuil d&apos;alerte
                </label>
                <input
                  className="w-full bg-surface border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary rounded h-12 px-3 font-body-lg text-body-lg text-on-surface outline-none"
                  type="number"
                  min={0}
                  value={form.alertThreshold}
                  onChange={(e) =>
                    setForm({ ...form, alertThreshold: Number(e.target.value) || 0 })
                  }
                />
              </div>
            </div>
          </section>
        </form>
      </Modal>

      {/* Stock movement modal */}
      <Modal
        open={showMove && canEditStock(currentUser)}
        title="Mouvement de stock"
        icon="swap_vert"
        onClose={() => setShowMove(false)}
        footer={
          <div className="flex flex-col-reverse md:flex-row justify-between gap-3">
            <button
              type="button"
              className="h-[56px] px-6 border border-outline-variant rounded font-headline-md text-headline-md"
              onClick={() => setShowMove(false)}
            >
              Annuler
            </button>
            <button
              type="submit"
              form="stock-move-form"
              className="h-[56px] px-8 bg-primary text-on-primary rounded font-headline-md text-headline-md flex items-center justify-center gap-2 md:ml-auto"
            >
              <span className="material-symbols-outlined">check</span>
              Appliquer
            </button>
          </div>
        }
      >
        <form id="stock-move-form" className="flex flex-col gap-stack-md" onSubmit={onMove}>
          <label className="flex flex-col gap-1">
            <span className="font-label-mono text-label-mono text-on-surface-variant">PRODUIT</span>
            <select
              className="bl-input"
              value={stockDelta.productId}
              onChange={(e) => setStockDelta({ ...stockDelta, productId: e.target.value })}
              required
            >
              <option value="">Choisir…</option>
              {filtered.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.stock})
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-label-mono text-label-mono text-on-surface-variant">TYPE</span>
            <select
              className="bl-input"
              value={stockDelta.type}
              onChange={(e) => setStockDelta({ ...stockDelta, type: e.target.value })}
            >
              <option value="reappro">Réappro (+)</option>
              <option value="casse">Casse (−)</option>
              <option value="don">Don (−)</option>
              <option value="correction">Correction (+/−)</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-label-mono text-label-mono text-on-surface-variant">
              QUANTITÉ
            </span>
            <input
              className="bl-input"
              type="number"
              value={stockDelta.delta || ''}
              onChange={(e) =>
                setStockDelta({ ...stockDelta, delta: Number(e.target.value) || 0 })
              }
              required
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-label-mono text-label-mono text-on-surface-variant">MOTIF</span>
            <input
              className="bl-input"
              value={stockDelta.reason}
              onChange={(e) => setStockDelta({ ...stockDelta, reason: e.target.value })}
            />
          </label>
        </form>
      </Modal>
    </div>
  )
}
