import { useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Role, UserPermissions } from '../db/types'
import { useAuth } from '../lib/auth'
import { addUser } from '../lib/services'
import { TEAM_ROLE_LABELS, canManageUsers, defaultPermissions } from '../lib/roles'

const ROLE_OPTIONS: Role[] = ['vendeur', 'gerant', 'proprietaire']

const PERM_KEYS: { key: keyof UserPermissions; label: string }[] = [
  { key: 'viewReports', label: 'Voir les rapports' },
  { key: 'editPrices', label: 'Modifier les prix' },
  { key: 'closeCash', label: 'Clôturer la caisse' },
  { key: 'manageStock', label: 'Gérer le stock' },
]

const MAX_AVATAR_BYTES = 2 * 1024 * 1024

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
        checked ? 'bg-primary' : 'bg-surface-container-high'
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

export function EquipeCreatePage() {
  const navigate = useNavigate()
  const { boutique, user } = useAuth()
  const fileRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState<Role>('vendeur')
  const [perms, setPerms] = useState<UserPermissions>(() => defaultPermissions('vendeur'))
  const [pin, setPin] = useState('')
  const [avatarDataUrl, setAvatarDataUrl] = useState<string | undefined>()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  if (!boutique || !user) return null
  if (!canManageUsers(user.role)) {
    return (
      <p className="font-body-md text-body-md text-on-surface-variant">
        Accès réservé au propriétaire.
      </p>
    )
  }

  function onRoleChange(next: Role) {
    setRole(next)
    setPerms(defaultPermissions(next))
  }

  function generatePin() {
    setPin(String(Math.floor(1000 + Math.random() * 9000)))
  }

  async function onPickPhoto(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Choisissez une image JPG ou PNG')
      return
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setError('Image trop lourde (max 2 Mo)')
      return
    }
    setError('')
    const reader = new FileReader()
    reader.onload = () => {
      const result = String(reader.result || '')
      if (result.startsWith('data:image')) setAvatarDataUrl(result)
    }
    reader.readAsDataURL(file)
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      if (pin.length !== 4) throw new Error('Le PIN doit contenir 4 chiffres')
      await addUser({
        boutiqueId: boutique!.id,
        name,
        role,
        pin,
        phone,
        avatarDataUrl,
        permissions: perms,
      })
      navigate('/equipe')
    } catch (err) {
      setError(String((err as Error).message || err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form
      onSubmit={(e) => void onSubmit(e)}
      className="max-w-2xl mx-auto w-full flex flex-col gap-stack-md pb-[120px] md:pb-8"
    >
      <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg font-bold text-primary text-center">
        Ajouter un employé
      </h1>

      <section className="bg-surface p-stack-md rounded-xl border border-outline-variant flex flex-col items-center justify-center gap-stack-sm md:flex-row md:justify-start md:gap-gutter">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="w-24 h-24 rounded-full bg-surface-container-high flex items-center justify-center text-outline-variant border-2 border-dashed border-outline-variant relative overflow-hidden group hover:bg-surface-variant transition-colors"
          aria-label="Ajouter une photo"
        >
          {avatarDataUrl ? (
            <img src={avatarDataUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="material-symbols-outlined text-4xl group-hover:scale-110 transition-transform">
              person_add
            </span>
          )}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => void onPickPhoto(e)}
        />
        <div className="text-center md:text-left">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="text-primary font-semibold hover:underline px-4 py-2 rounded-lg hover:bg-primary-fixed transition-colors font-body-md text-body-md"
          >
            {avatarDataUrl ? 'Changer la photo' : 'Ajouter une photo'}
          </button>
          <p className="text-on-surface-variant font-label-mono text-label-mono mt-1">
            Format JPG ou PNG, max 2MB
          </p>
          {avatarDataUrl && (
            <button
              type="button"
              onClick={() => setAvatarDataUrl(undefined)}
              className="mt-1 font-body-md text-body-md text-error hover:underline"
            >
              Retirer
            </button>
          )}
        </div>
      </section>

      <section className="bg-surface p-stack-md rounded-xl border border-outline-variant space-y-stack-md">
        <h2 className="font-headline-md text-headline-md text-primary pb-2 border-b border-outline-variant">
          Informations Personnelles
        </h2>
        <div className="space-y-stack-sm">
          <label className="block font-body-md text-body-md text-on-surface-variant font-medium" htmlFor="nom_complet">
            Nom Complet
          </label>
          <input
            id="nom_complet"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Jean Dupont"
            className="w-full h-[56px] px-4 rounded-lg border border-outline-variant bg-surface-bright text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none font-body-lg text-body-lg"
          />
        </div>
        <div className="space-y-stack-sm">
          <label className="block font-body-md text-body-md text-on-surface-variant font-medium" htmlFor="telephone">
            Numéro de Téléphone
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline-variant">
              phone
            </span>
            <input
              id="telephone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+243 XXX XXX XXX"
              className="w-full h-[56px] pl-12 pr-4 rounded-lg border border-outline-variant bg-surface-bright text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none font-body-lg text-body-lg"
            />
          </div>
        </div>
      </section>

      <section className="bg-surface p-stack-md rounded-xl border border-outline-variant space-y-stack-md">
        <h2 className="font-headline-md text-headline-md text-primary pb-2 border-b border-outline-variant">
          Rôle
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-stack-sm">
          {ROLE_OPTIONS.map((r) => {
            const selected = role === r
            return (
              <button
                key={r}
                type="button"
                onClick={() => onRoleChange(r)}
                className={`h-[56px] flex items-center justify-center rounded-lg border font-body-lg text-body-lg font-medium transition-all ${
                  selected
                    ? 'bg-primary-container text-on-primary-container border-primary'
                    : 'border-outline-variant bg-surface-bright text-on-surface-variant'
                }`}
              >
                {TEAM_ROLE_LABELS[r]}
              </button>
            )
          })}
        </div>
      </section>

      <section className="bg-surface p-stack-md rounded-xl border border-outline-variant space-y-stack-md">
        <h2 className="font-headline-md text-headline-md text-primary pb-2 border-b border-outline-variant">
          Permissions
        </h2>
        <div className="divide-y divide-outline-variant">
          {PERM_KEYS.map((row) => (
            <div
              key={row.key}
              className="flex items-center justify-between py-stack-sm min-h-[56px] gap-3"
            >
              <span className="font-body-lg text-body-lg text-on-surface">{row.label}</span>
              <Toggle
                checked={perms[row.key]}
                onChange={(v) => setPerms((p) => ({ ...p, [row.key]: v }))}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="bg-surface p-stack-md rounded-xl border border-outline-variant space-y-stack-md">
        <h2 className="font-headline-md text-headline-md text-primary pb-2 border-b border-outline-variant">
          Accès Système
        </h2>
        <div className="space-y-stack-sm">
          <label className="block font-body-md text-body-md text-on-surface-variant font-medium" htmlFor="pin">
            Définir un code PIN (4 chiffres)
          </label>
          <div className="flex gap-stack-sm flex-col sm:flex-row">
            <input
              id="pin"
              required
              type="password"
              inputMode="numeric"
              autoComplete="new-password"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="••••"
              className="w-full sm:w-1/2 h-[56px] px-4 rounded-lg border border-outline-variant bg-surface-bright text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none font-body-lg text-body-lg tracking-[0.5em] text-center sm:text-left"
            />
            <button
              type="button"
              onClick={generatePin}
              className="h-[56px] px-gutter bg-surface-container-high text-on-surface font-body-md text-body-md rounded-lg hover:bg-surface-variant transition-colors border border-outline-variant flex-1 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">casino</span>
              Générer un code PIN temporaire
            </button>
          </div>
          {pin.length === 4 && (
            <p className="font-label-mono text-label-mono text-on-surface-variant">
              PIN défini : <span className="tracking-widest text-on-surface">{pin}</span> (notez-le
              pour l&apos;employé)
            </p>
          )}
        </div>
      </section>

      {error && <p className="font-body-md text-body-md text-error">{error}</p>}

      <div className="fixed bottom-0 left-0 md:left-[72px] lg:left-[220px] right-0 bg-surface border-t border-outline-variant p-margin-mobile shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] md:static md:bg-transparent md:border-none md:shadow-none md:p-0 z-40 mb-16 md:mb-0 pb-[max(12px,env(safe-area-inset-bottom))]">
        <div className="max-w-2xl mx-auto flex flex-col sm:flex-row gap-stack-sm md:justify-end">
          <button
            type="button"
            onClick={() => navigate('/equipe')}
            className="w-full sm:w-auto h-[56px] px-gutter bg-surface text-on-surface font-medium rounded-lg border border-outline-variant hover:bg-surface-variant transition-colors order-2 sm:order-1 font-body-lg text-body-lg"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={busy}
            className="w-full sm:w-auto h-[56px] px-gutter bg-primary text-on-primary font-bold rounded-lg hover:bg-primary-container transition-colors shadow-md flex items-center justify-center gap-2 order-1 sm:order-2 disabled:opacity-60 font-body-lg text-body-lg"
          >
            <span className="material-symbols-outlined">person_add</span>
            Créer le profil
          </button>
        </div>
      </div>
    </form>
  )
}
