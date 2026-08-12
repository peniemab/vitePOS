import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import type { Role, UserPermissions } from '../db/types'
import { useAuth } from '../lib/auth'
import { updateUser, updateUserPin } from '../lib/services'
import {
  TEAM_ROLE_LABELS,
  canManageUsers,
  defaultPermissions,
  resolvePermissions,
} from '../lib/roles'

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function employeeCode(id: string) {
  const tail = id.replace(/^user_/, '').slice(-4).toUpperCase()
  return `EMP-${tail || '0000'}`
}

const ROLE_OPTIONS: Role[] = ['vendeur', 'gerant', 'proprietaire']

const PERM_ROWS: {
  key: keyof UserPermissions
  label: string
  hint: string
}[] = [
  { key: 'viewReports', label: 'Voir les rapports', hint: 'Accès aux ventes du jour' },
  { key: 'editPrices', label: 'Modifier les prix', hint: 'Pendant une transaction' },
  { key: 'closeCash', label: 'Clôturer la caisse', hint: 'Fermeture de shift' },
  { key: 'manageStock', label: 'Gérer le stock', hint: "Ajout/Retrait d'inventaire" },
]

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${
        checked ? 'bg-primary' : 'bg-surface-variant'
      }`}
    >
      <span
        className={`absolute top-[2px] left-[2px] h-5 w-5 rounded-full bg-white border border-outline-variant transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  )
}

export function EquipeEditPage() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const { boutique, user: currentUser } = useAuth()

  const existing = useLiveQuery(
    () => (userId ? db.users.get(userId) : undefined),
    [userId],
  )

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState<Role>('vendeur')
  const [perms, setPerms] = useState<UserPermissions>(() => defaultPermissions('vendeur'))
  const [avatarDataUrl, setAvatarDataUrl] = useState<string | undefined>()
  const [tempPin, setTempPin] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!existing) return
    setName(existing.name)
    setPhone(existing.phone || '')
    setRole(existing.role)
    setPerms(resolvePermissions(existing))
    setAvatarDataUrl(existing.avatarDataUrl)
    setLoaded(true)
  }, [existing])

  function onRoleChange(next: Role) {
    setRole(next)
    setPerms(defaultPermissions(next))
  }

  function setPerm(key: keyof UserPermissions, value: boolean) {
    setPerms((p) => ({ ...p, [key]: value }))
  }

  async function onSave(e?: FormEvent) {
    e?.preventDefault()
    if (!existing) return
    setError('')
    setBusy(true)
    try {
      await updateUser({
        id: existing.id,
        name,
        role,
        phone: phone || null,
        avatarDataUrl: avatarDataUrl || null,
        permissions: perms,
      })
      navigate('/equipe')
    } catch (err) {
      setError(String((err as Error).message || err))
    } finally {
      setBusy(false)
    }
  }

  async function onResetPin() {
    if (!existing) return
    setError('')
    setBusy(true)
    try {
      const generated = String(Math.floor(1000 + Math.random() * 9000))
      await updateUserPin(existing.id, generated)
      setTempPin(generated)
    } catch (err) {
      setError(String((err as Error).message || err))
    } finally {
      setBusy(false)
    }
  }

  async function onDeactivate() {
    if (!existing) return
    if (!window.confirm(`Désactiver le compte de ${existing.name} ?`)) return
    setError('')
    setBusy(true)
    try {
      await updateUser({ id: existing.id, active: false })
      navigate('/equipe')
    } catch (err) {
      setError(String((err as Error).message || err))
    } finally {
      setBusy(false)
    }
  }

  async function onReactivate() {
    if (!existing) return
    setBusy(true)
    try {
      await updateUser({ id: existing.id, active: true })
    } catch (err) {
      setError(String((err as Error).message || err))
    } finally {
      setBusy(false)
    }
  }

  if (!boutique || !currentUser) return null
  if (!canManageUsers(currentUser.role)) {
    return (
      <p className="font-body-md text-body-md text-on-surface-variant">
        Accès réservé au propriétaire.
      </p>
    )
  }
  if (loaded && !existing) {
    return <p className="font-body-md text-body-md text-error">Employé introuvable.</p>
  }
  if (!loaded || !existing) {
    return <p className="font-body-md text-body-md text-on-surface-variant">Chargement…</p>
  }

  return (
    <form
      onSubmit={(e) => void onSave(e)}
      className="max-w-xl mx-auto w-full flex flex-col gap-stack-md pb-[140px]"
    >
      <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface text-center">
        Édition d&apos;Employé
      </h1>

      <section className="flex flex-col items-center py-stack-md gap-stack-sm">
        <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-outline-variant bg-surface-container-high flex items-center justify-center">
          {avatarDataUrl ? (
            <img src={avatarDataUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="font-headline-lg text-headline-lg text-on-surface-variant">
              {initials(name || '?')}
            </span>
          )}
        </div>
        <p className="font-label-mono text-label-mono text-outline uppercase tracking-wider">
          ID: {employeeCode(existing.id)}
        </p>
      </section>

      <section className="bg-surface-container-lowest rounded-xl border border-outline-variant p-stack-md flex flex-col gap-stack-md">
        <h2 className="font-headline-md text-headline-md text-on-surface">
          Informations Personnelles
        </h2>
        <div className="flex flex-col gap-base">
          <label className="font-label-mono text-label-mono text-on-surface-variant" htmlFor="emp-name">
            Nom Complet
          </label>
          <div className="h-touch-target-min border border-outline-variant rounded-lg px-3 flex items-center focus-within:border-primary focus-within:ring-1 focus-within:ring-primary bg-surface transition-all">
            <span className="material-symbols-outlined text-outline-variant mr-2">person</span>
            <input
              id="emp-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Marie Dupont"
              className="w-full h-full bg-transparent border-none outline-none font-body-lg text-body-lg text-on-surface"
            />
          </div>
        </div>
        <div className="flex flex-col gap-base">
          <label className="font-label-mono text-label-mono text-on-surface-variant" htmlFor="emp-phone">
            Numéro de Téléphone
          </label>
          <div className="h-touch-target-min border border-outline-variant rounded-lg px-3 flex items-center focus-within:border-primary focus-within:ring-1 focus-within:ring-primary bg-surface transition-all">
            <span className="material-symbols-outlined text-outline-variant mr-2">call</span>
            <input
              id="emp-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+243 …"
              className="w-full h-full bg-transparent border-none outline-none font-body-lg text-body-lg text-on-surface font-mono"
            />
          </div>
        </div>
      </section>

      <section className="bg-surface-container-lowest rounded-xl border border-outline-variant p-stack-md flex flex-col gap-stack-md">
        <div className="flex items-center justify-between">
          <h2 className="font-headline-md text-headline-md text-on-surface">Rôle</h2>
          <span className="material-symbols-outlined text-primary">badge</span>
        </div>
        <div className="flex flex-wrap gap-stack-sm">
          {ROLE_OPTIONS.map((r) => {
            const selected = role === r
            return (
              <button
                key={r}
                type="button"
                onClick={() => onRoleChange(r)}
                className={`h-10 px-4 rounded-full border flex items-center justify-center font-body-md text-body-md transition-colors shadow-sm ${
                  selected
                    ? 'bg-secondary-container text-on-secondary-container border-transparent font-bold'
                    : 'border-outline-variant bg-surface text-on-surface-variant'
                }`}
              >
                {TEAM_ROLE_LABELS[r]}
              </button>
            )
          })}
        </div>
      </section>

      <section className="bg-surface-container-lowest rounded-xl border border-outline-variant p-stack-md flex flex-col">
        <div className="flex items-center gap-2 mb-stack-md pb-stack-sm border-b border-outline-variant">
          <span className="material-symbols-outlined text-primary">admin_panel_settings</span>
          <h2 className="font-headline-md text-headline-md text-on-surface">Autorisations</h2>
        </div>
        <div className="flex flex-col divide-y divide-outline-variant">
          {PERM_ROWS.map((row) => (
            <div key={row.key} className="py-3 flex items-center justify-between gap-3">
              <div className="flex flex-col min-w-0">
                <span className="font-body-lg text-body-lg text-on-surface">{row.label}</span>
                <span className="font-label-mono text-label-mono text-outline">{row.hint}</span>
              </div>
              <Toggle checked={perms[row.key]} onChange={(v) => setPerm(row.key, v)} />
            </div>
          ))}
        </div>
      </section>

      <section className="bg-error-container rounded-xl border border-error/20 p-stack-md flex flex-col gap-stack-sm">
        <h2 className="font-headline-md text-headline-md text-on-error-container">Sécurité</h2>
        <p className="font-body-md text-body-md text-on-error-container/80 mb-2">
          Si l&apos;employé a oublié son code PIN d&apos;accès rapide, vous pouvez générer un code
          temporaire.
        </p>
        {tempPin ? (
          <p className="font-label-mono text-label-mono text-on-error-container bg-surface/60 rounded-lg p-3 text-center">
            Nouveau PIN temporaire : <strong className="text-lg tracking-widest">{tempPin}</strong>
            <br />
            <span className="opacity-80">Communiquez-le puis demandez un changement.</span>
          </p>
        ) : (
          <button
            type="button"
            disabled={busy || !existing.active}
            onClick={() => void onResetPin()}
            className="h-touch-target-min w-full bg-surface text-error border border-error rounded-lg font-headline-md text-headline-md flex items-center justify-center gap-2 active:bg-error-container transition-colors disabled:opacity-50"
          >
            <span className="material-symbols-outlined">lock_reset</span>
            Réinitialiser le PIN
          </button>
        )}
      </section>

      {error && <p className="font-body-md text-body-md text-error">{error}</p>}

      <div className="fixed bottom-0 left-0 md:left-[72px] lg:left-[220px] right-0 w-full bg-surface border-t border-outline-variant p-margin-mobile z-40 shadow-[0_-4px_16px_rgba(0,0,0,0.05)] pb-[max(12px,env(safe-area-inset-bottom))] mb-16 md:mb-0">
        <div className="md:max-w-xl md:mx-auto w-full flex flex-col gap-stack-sm">
          <button
            type="submit"
            disabled={busy}
            className="h-touch-target-min w-full bg-primary text-on-primary rounded-lg font-headline-md text-headline-md flex items-center justify-center shadow-sm active:scale-[0.98] transition-transform disabled:opacity-60"
          >
            Enregistrer les modifications
          </button>
          {existing.active ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void onDeactivate()}
              className="h-[40px] w-full text-error font-body-lg text-body-lg flex items-center justify-center active:bg-error-container/50 rounded-lg transition-colors"
            >
              Désactiver le compte
            </button>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={() => void onReactivate()}
              className="h-[40px] w-full text-primary font-body-lg text-body-lg flex items-center justify-center"
            >
              Réactiver le compte
            </button>
          )}
        </div>
      </div>
    </form>
  )
}
