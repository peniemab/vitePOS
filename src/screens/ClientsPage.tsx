import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { useAuth } from '../lib/auth'
import { upsertClient } from '../lib/services'
import { formatDateTime, formatMoney } from '../lib/utils'
import { useCart } from '../lib/cart'

export function ClientsPage() {
  const { boutique } = useAuth()
  const cart = useCart()
  const clients = useLiveQuery(
    () =>
      boutique
        ? db.clients.where('boutiqueId').equals(boutique.id).reverse().sortBy('updatedAt')
        : [],
    [boutique?.id],
  )
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')

  if (!boutique) return null

  async function onCreate(e: FormEvent) {
    e.preventDefault()
    await upsertClient({ boutiqueId: boutique!.id, name, phone })
    setName('')
    setPhone('')
  }

  return (
    <div className="flex flex-col gap-stack-md w-full max-w-3xl mx-auto pb-4">
      <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary">
        Clients
      </h1>

      <form
        onSubmit={onCreate}
        className="bg-surface-container-lowest border border-outline-variant rounded-xl p-stack-md flex flex-col gap-stack-md"
      >
        <h2 className="font-headline-md text-headline-md text-primary flex items-center gap-2">
          <span className="material-symbols-outlined">person_add</span>
          Nouveau client
        </h2>
        <label className="flex flex-col gap-1">
          <span className="font-label-mono text-label-mono text-on-surface-variant">Nom</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="h-12 px-4 rounded-lg border border-outline-variant bg-surface text-on-surface outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-label-mono text-label-mono text-on-surface-variant">Téléphone</span>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="h-12 px-4 rounded-lg border border-outline-variant bg-surface text-on-surface outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </label>
        <button
          type="submit"
          className="h-12 bg-primary text-on-primary rounded-lg font-headline-md text-headline-md"
        >
          Ajouter
        </button>
      </form>

      <div className="flex flex-col gap-2 border border-outline-variant rounded-xl bg-surface-container-lowest overflow-hidden">
        {(clients || []).length === 0 && (
          <p className="p-4 font-body-md text-body-md text-on-surface-variant">Aucun client.</p>
        )}
        {(clients || []).map((c, i) => (
          <div
            key={c.id}
            className={`flex items-center justify-between gap-3 p-4 ${
              i < (clients || []).length - 1 ? 'border-b border-surface-variant' : ''
            }`}
          >
            <Link to={`/clients/${c.id}`} className="min-w-0 flex-1">
              <p className="font-body-lg text-body-lg font-semibold text-on-surface truncate">
                {c.name}
              </p>
              <p className="font-label-mono text-label-mono text-on-surface-variant">
                {c.purchaseCount} achat{c.purchaseCount > 1 ? 's' : ''} ·{' '}
                {formatMoney(c.totalSpent, boutique.currency)}
              </p>
            </Link>
            <button
              type="button"
              onClick={() => cart.setClientId(c.id)}
              className="shrink-0 h-10 px-3 rounded-lg border border-outline-variant font-label-mono text-label-mono text-primary hover:bg-surface-container-low"
            >
              Lier caisse
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export function ClientDetailPage() {
  const { id } = useParams()
  const { boutique } = useAuth()
  const client = useLiveQuery(() => (id ? db.clients.get(id) : undefined), [id])
  const sales = useLiveQuery(
    () =>
      boutique && id
        ? db.sales
            .where('boutiqueId')
            .equals(boutique.id)
            .filter((s) => s.clientId === id)
            .reverse()
            .sortBy('createdAt')
        : [],
    [boutique?.id, id],
  )

  if (!client || !boutique) {
    return <p className="font-body-md text-body-md text-on-surface-variant">Chargement…</p>
  }

  return (
    <div className="flex flex-col gap-stack-md w-full max-w-3xl mx-auto pb-4">
      <Link
        to="/clients"
        className="font-body-md text-body-md text-on-surface-variant inline-flex items-center gap-1"
      >
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        Clients
      </Link>
      <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-primary">{client.name}</h1>
      <p className="font-body-md text-body-md text-on-surface-variant">
        {client.phone || 'Pas de téléphone'}
      </p>
      <p className="font-body-lg text-body-lg text-on-surface">
        {client.purchaseCount} achats · total {formatMoney(client.totalSpent, boutique.currency)}
      </p>
      {client.notes && (
        <p className="font-body-md text-body-md text-on-surface-variant">{client.notes}</p>
      )}

      <h2 className="font-headline-md text-headline-md text-primary">Historique</h2>
      <div className="flex flex-col border border-outline-variant rounded-xl bg-surface-container-lowest overflow-hidden">
        {(sales || []).length === 0 && (
          <p className="p-4 font-body-md text-body-md text-on-surface-variant">Aucune vente.</p>
        )}
        {(sales || []).map((s, i) => (
          <Link
            key={s.id}
            to={`/ticket/${s.id}`}
            className={`p-4 hover:bg-surface-container-low ${
              i < (sales || []).length - 1 ? 'border-b border-surface-variant' : ''
            }`}
          >
            <p className="font-headline-md text-headline-md text-on-surface">
              {formatMoney(s.total, boutique.currency)}
            </p>
            <p className="font-label-mono text-label-mono text-on-surface-variant">
              {formatDateTime(s.createdAt)} · {s.status}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}
