import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { useAuth } from '../lib/auth'
import {
  cancelInventory,
  countInventoryLine,
  startInventory,
  validateInventory,
} from '../lib/services'
import { canValidateInventory } from '../lib/roles'
import { formatDateTime } from '../lib/utils'
import type { Product } from '../db/types'

function statusLabel(status: string) {
  return status.replace('_', ' ')
}

export function InventairePage() {
  const { boutique, user } = useAuth()
  const sessions = useLiveQuery(
    () =>
      boutique
        ? db.inventorySessions
            .where('boutiqueId')
            .equals(boutique.id)
            .reverse()
            .sortBy('createdAt')
        : [],
    [boutique?.id],
  )

  if (!boutique || !user) return null

  const rows = sessions || []

  return (
    <div className="flex flex-col gap-stack-md w-full max-w-3xl mx-auto pb-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-primary">Inventaire</h1>
        {canValidateInventory(user) && (
          <button
            type="button"
            className="h-12 px-4 bg-primary text-on-primary rounded-lg font-headline-md text-headline-md"
            onClick={() => void startInventory(boutique.id, user.id)}
          >
            Nouvelle session
          </button>
        )}
      </div>

      {rows.length === 0 && (
        <p className="font-body-md text-body-md text-on-surface-variant">
          Aucune session d’inventaire.
        </p>
      )}

      <div className="flex flex-col border border-outline-variant rounded-xl bg-surface-container-lowest overflow-hidden">
        {rows.map((s, i) => (
          <Link
            key={s.id}
            to={`/inventaire/${s.id}`}
            className={`flex items-center justify-between gap-3 p-4 hover:bg-surface-container-low ${
              i < rows.length - 1 ? 'border-b border-surface-variant' : ''
            }`}
          >
            <div>
              <p className="font-body-lg text-body-lg font-semibold text-on-surface">
                {formatDateTime(s.createdAt)}
              </p>
              <p className="font-label-mono text-label-mono text-on-surface-variant capitalize">
                {statusLabel(s.status)}
              </p>
            </div>
            <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
          </Link>
        ))}
      </div>
    </div>
  )
}

export function InventaireSessionPage() {
  const { id } = useParams()
  const { boutique, user } = useAuth()
  const [filter, setFilter] = useState<'all' | 'todo' | string>('todo')
  const [error, setError] = useState('')

  const session = useLiveQuery(() => (id ? db.inventorySessions.get(id) : undefined), [id])
  const lines = useLiveQuery(
    () => (id ? db.inventoryLines.where('sessionId').equals(id).toArray() : []),
    [id],
  )
  const products = useLiveQuery(
    () => (boutique ? db.products.where('boutiqueId').equals(boutique.id).toArray() : []),
    [boutique?.id],
  )

  const productMap = useMemo(() => {
    const m = new Map<string, Product>()
    for (const p of products || []) m.set(p.id, p)
    return m
  }, [products])

  const categories = useMemo(() => {
    const set = new Set<string>()
    for (const l of lines || []) {
      const p = productMap.get(l.productId)
      if (p) set.add(p.category)
    }
    return [...set]
  }, [lines, productMap])

  const visible = useMemo(() => {
    let list = lines || []
    if (filter === 'todo') list = list.filter((l) => !l.counted)
    else if (filter !== 'all')
      list = list.filter((l) => productMap.get(l.productId)?.category === filter)
    return list
  }, [lines, filter, productMap])

  if (!session || !boutique || !user) {
    return <p className="font-body-md text-body-md text-on-surface-variant">Chargement…</p>
  }

  async function onValidate() {
    try {
      await validateInventory(session!.id, user!.id)
    } catch (err) {
      setError(String((err as Error).message || err))
    }
  }

  const chips: { key: string; label: string }[] = [
    { key: 'todo', label: 'Non comptés' },
    { key: 'all', label: 'Tous' },
    ...categories.map((c) => ({ key: c, label: c })),
  ]

  return (
    <div className="flex flex-col gap-stack-md w-full max-w-3xl mx-auto pb-4">
      <div>
        <Link
          to="/inventaire"
          className="font-body-md text-body-md text-on-surface-variant inline-flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Inventaires
        </Link>
        <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-primary mt-2">
          Comptage
        </h1>
        <p className="font-label-mono text-label-mono text-on-surface-variant capitalize">
          {statusLabel(session.status)} · {formatDateTime(session.createdAt)}
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
        {chips.map((c) => {
          const active = filter === c.key
          return (
            <button
              key={c.key}
              type="button"
              onClick={() => setFilter(c.key)}
              className={`shrink-0 h-10 px-3 rounded-full font-label-mono text-label-mono transition-colors ${
                active
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container-low text-on-surface-variant border border-outline-variant'
              }`}
            >
              {c.label}
            </button>
          )
        })}
      </div>

      <div className="flex flex-col border border-outline-variant rounded-xl bg-surface-container-lowest overflow-hidden">
        {visible.length === 0 && (
          <p className="p-4 font-body-md text-body-md text-on-surface-variant">
            Aucun article dans ce filtre.
          </p>
        )}
        {visible.map((l, i) => {
          const p = productMap.get(l.productId)
          const showTheo = canValidateInventory(user)
          const ecart = (l.countedQty ?? l.theoreticalQty) - l.theoreticalQty
          return (
            <div
              key={l.id}
              className={`flex items-center justify-between gap-3 p-4 ${
                i < visible.length - 1 ? 'border-b border-surface-variant' : ''
              }`}
            >
              <div className="min-w-0 flex-1">
                <p className="font-body-lg text-body-lg font-semibold text-on-surface truncate">
                  {p?.name || 'Produit'}
                </p>
                <p className="font-label-mono text-label-mono text-on-surface-variant">
                  {showTheo ? `Théorique ${l.theoreticalQty}` : 'Comptage'}
                  {l.counted ? ` · compté ${l.countedQty}` : ''}
                </p>
              </div>
              {session.status === 'en_cours' && (
                <input
                  type="number"
                  defaultValue={l.countedQty ?? ''}
                  placeholder="Qté"
                  className="w-20 h-12 px-2 text-center rounded-lg border border-outline-variant bg-surface text-on-surface outline-none focus:ring-2 focus:ring-primary"
                  onBlur={(e) => {
                    const v = Number(e.target.value)
                    if (Number.isFinite(v)) void countInventoryLine(l.id, v)
                  }}
                />
              )}
              {session.status === 'valide' && (
                <span
                  className={`font-headline-md text-headline-md shrink-0 ${
                    ecart !== 0 ? 'text-error' : 'text-on-tertiary-container'
                  }`}
                >
                  écart {ecart}
                </span>
              )}
            </div>
          )
        })}
      </div>

      {error && <p className="font-body-md text-body-md text-error font-semibold">{error}</p>}

      {session.status === 'en_cours' && canValidateInventory(user) && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="h-12 px-4 rounded-lg border border-outline-variant font-label-mono text-label-mono text-primary hover:bg-surface-container-low"
            onClick={() => void cancelInventory(session.id)}
          >
            Annuler
          </button>
          <button
            type="button"
            className="h-12 px-4 bg-primary text-on-primary rounded-lg font-headline-md text-headline-md"
            onClick={() => void onValidate()}
          >
            Valider & ajuster stock
          </button>
        </div>
      )}
    </div>
  )
}
