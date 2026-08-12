import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { useAuth } from '../lib/auth'
import { ROLE_LABELS, TEAM_ROLE_LABELS, canManageUsers } from '../lib/roles'

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function EquipePage() {
  const { boutique, user } = useAuth()
  const navigate = useNavigate()
  const users = useLiveQuery(
    () =>
      boutique
        ? db.users.where('boutiqueId').equals(boutique.id).sortBy('createdAt')
        : [],
    [boutique?.id],
  )
  const [query, setQuery] = useState('')
  const canManage = user ? canManageUsers(user.role) : false

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const rows = [...(users || [])].sort((a, b) => {
      if (a.id === user?.id) return -1
      if (b.id === user?.id) return 1
      if (a.active !== b.active) return a.active ? -1 : 1
      return a.name.localeCompare(b.name, 'fr')
    })
    if (!q) return rows
    return rows.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        TEAM_ROLE_LABELS[u.role].toLowerCase().includes(q) ||
        ROLE_LABELS[u.role].toLowerCase().includes(q) ||
        (u.phone || '').toLowerCase().includes(q),
    )
  }, [users, query, user?.id])

  if (!boutique || !user) return null

  if (!canManage) {
    return (
      <div className="max-w-lg mx-auto flex flex-col gap-stack-md pb-4">
        <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-primary">Équipe</h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Seul le propriétaire peut gérer les membres. Connectez-vous avec un compte propriétaire.
        </p>
        <Link to="/parametres" className="font-body-md text-body-md text-primary underline">
          Retour aux paramètres
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto w-full space-y-stack-md pb-24 md:pb-4 relative">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-primary">badge</span>
        <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary">
          Équipe
        </h1>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">
            search
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un membre…"
            className="w-full h-touch-target-min pl-12 pr-4 bg-surface-container rounded-lg border-none focus:ring-2 focus:ring-primary outline-none font-body-lg text-body-lg text-on-surface placeholder:text-on-surface-variant"
          />
        </div>
        <button
          type="button"
          onClick={() => navigate('/equipe/nouveau')}
          className="hidden md:flex w-full sm:w-auto h-touch-target-min bg-primary text-on-primary items-center justify-center gap-2 px-6 rounded-lg font-headline-md text-headline-md hover:bg-primary-container transition-colors active:scale-95"
        >
          <span className="material-symbols-outlined">person_add</span>
          Ajouter un membre
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
        {filtered.map((u) => {
          const isSelf = u.id === user.id
          const inactive = !u.active
          return (
            <div
              key={u.id}
              className={`rounded-xl p-4 flex flex-col gap-4 relative overflow-hidden transition-colors ${
                isSelf
                  ? 'bg-surface border-2 border-primary'
                  : inactive
                    ? 'bg-surface-container-low border border-outline-variant/50 opacity-75'
                    : 'bg-surface border border-outline-variant'
              }`}
            >
              {isSelf && (
                <div className="absolute top-0 right-0 bg-primary text-on-primary px-3 py-1 rounded-bl-lg font-label-mono text-label-mono">
                  VOUS
                </div>
              )}
              <div className="flex items-start gap-4">
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center border border-outline-variant flex-shrink-0 overflow-hidden ${
                    inactive ? 'bg-surface-variant' : 'bg-surface-container-high'
                  }`}
                >
                  {u.avatarDataUrl ? (
                    <img src={u.avatarDataUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span
                      className={`font-headline-lg text-headline-lg ${
                        inactive ? 'text-outline' : 'text-on-surface-variant'
                      }`}
                    >
                      {initials(u.name)}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3
                    className={`font-headline-md text-headline-md truncate ${
                      isSelf
                        ? 'text-primary'
                        : inactive
                          ? 'text-on-surface-variant'
                          : 'text-on-surface'
                    }`}
                  >
                    {u.name}
                  </h3>
                  <p
                    className={`font-body-md text-body-md ${
                      inactive ? 'text-outline' : 'text-on-surface-variant'
                    }`}
                  >
                    {TEAM_ROLE_LABELS[u.role]}
                  </p>
                  <div
                    className={`mt-2 inline-flex items-center gap-1 px-2 py-1 rounded-full font-label-mono text-label-mono ${
                      inactive
                        ? 'bg-surface-variant text-on-surface-variant'
                        : 'bg-tertiary-container/10 text-tertiary-container'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        inactive ? 'bg-outline' : 'bg-tertiary-fixed-dim'
                      }`}
                    />
                    {inactive ? 'Inactif' : 'Actif'}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-auto pt-4 border-t border-surface-variant">
                <button
                  type="button"
                  onClick={() => navigate(`/equipe/${u.id}`)}
                  className={`flex-1 h-10 border border-outline rounded-lg font-body-md text-body-md hover:bg-surface-container-high transition-colors flex items-center justify-center gap-2 ${
                    isSelf ? 'text-primary' : inactive ? 'text-on-surface-variant' : 'text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">edit</span> Modifier
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/equipe/${u.id}`)}
                  disabled={inactive}
                  className={`flex-1 h-10 border border-outline rounded-lg font-body-md text-body-md hover:bg-surface-container-high transition-colors flex items-center justify-center gap-2 disabled:opacity-50 ${
                    isSelf ? 'text-primary' : inactive ? 'text-on-surface-variant' : 'text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">password</span> PIN
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <p className="font-body-md text-body-md text-on-surface-variant text-center py-8">
          Aucun membre trouvé.
        </p>
      )}

      <button
        type="button"
        onClick={() => navigate('/equipe/nouveau')}
        className="md:hidden fixed bottom-24 right-4 w-14 h-14 bg-primary text-on-primary rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform z-40"
        aria-label="Ajouter un membre"
      >
        <span className="material-symbols-outlined text-3xl">person_add</span>
      </button>
    </div>
  )
}
