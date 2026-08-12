import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { useAuth } from '../lib/auth'
import { formatMoney } from '../lib/utils'

export function StockBasPage() {
  const { boutique } = useAuth()
  const products = useLiveQuery(
    () =>
      boutique
        ? db.products
            .where('boutiqueId')
            .equals(boutique.id)
            .filter((p) => !p.archived && p.stock <= p.alertThreshold)
            .toArray()
        : [],
    [boutique?.id],
  )

  if (!boutique) return null

  const rows = products || []

  return (
    <div className="flex flex-col gap-stack-md w-full max-w-3xl mx-auto pb-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-primary flex items-center gap-2">
          <span className="material-symbols-outlined text-error">warning</span>
          Stock bas
        </h1>
        <Link
          to="/produits"
          className="h-10 px-3 rounded-lg border border-outline-variant font-label-mono text-label-mono text-primary hover:bg-surface-container-low inline-flex items-center"
        >
          Retour stock
        </Link>
      </div>

      {rows.length === 0 && (
        <p className="font-body-md text-body-md text-on-surface-variant">
          Aucune alerte pour le moment.
        </p>
      )}

      <div className="flex flex-col border border-outline-variant rounded-xl bg-surface-container-lowest overflow-hidden">
        {rows.map((p, i) => (
          <div
            key={p.id}
            className={`flex items-center justify-between gap-3 p-4 ${
              i < rows.length - 1 ? 'border-b border-surface-variant' : ''
            }`}
          >
            <div className="min-w-0">
              <p className="font-body-lg text-body-lg font-semibold text-on-surface truncate">
                {p.name}
              </p>
              <p className="font-label-mono text-label-mono text-on-surface-variant">
                Seuil {p.alertThreshold} · {formatMoney(p.sellPrice, boutique.currency)}
              </p>
            </div>
            <span className="font-headline-md text-headline-md text-error shrink-0">{p.stock}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
