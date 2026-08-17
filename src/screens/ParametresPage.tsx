import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { useAuth } from '../lib/auth'
import { activateKinshasaMode, updateBoutiqueCurrency, updateBoutiquePrinterSettings } from '../lib/services'
import { canManageUsers } from '../lib/roles'
import { syncNow } from '../lib/sync'
import { formatDateTime, formatMoney } from '../lib/utils'
import {
  connectThermalPrinter,
  disconnectThermalPrinter,
  isThermalPrinterConnected,
  isWebSerialSupported,
  sendRawToPrinter,
} from '../lib/thermal-print'

const sectionClass =
  'bg-surface-container-lowest border border-outline-variant rounded-xl p-stack-md flex flex-col gap-stack-md'
const labelClass = 'flex flex-col gap-1'
const labelText = 'font-label-mono text-label-mono text-on-surface-variant'
const inputClass =
  'h-12 px-4 rounded-lg border border-outline-variant bg-surface text-on-surface outline-none focus:ring-2 focus:ring-primary focus:border-primary'
const btnPrimary =
  'h-12 px-4 bg-primary text-on-primary rounded-lg font-headline-md text-headline-md inline-flex items-center justify-center'
const btnGhost =
  'h-12 px-4 rounded-lg border border-outline-variant font-label-mono text-label-mono text-primary hover:bg-surface-container-low inline-flex items-center justify-center'

export function PlusPage() {
  const links = [
    { to: '/journee', label: 'Clôture de caisse', icon: 'lock', desc: 'Ouvrir / clôturer la journée' },
    { to: '/journee/rapport', label: 'Rapport journalier', icon: 'description', desc: 'PDF récapitulatif de clôture' },
    { to: '/ventes', label: 'Ventes', icon: 'receipt_long', desc: 'Historique des tickets' },
    { to: '/depenses', label: 'Dépenses', icon: 'payments', desc: 'Transport, fournitures, loyer…' },
    { to: '/analytics', label: 'Analytics', icon: 'analytics', desc: 'CA, dépenses et tendances du mois' },
    { to: '/equipe', label: 'Équipe', icon: 'badge', desc: 'Membres, rôles et PIN' },
    { to: '/clients', label: 'Clients', icon: 'group', desc: 'Fiches et crédits' },
    { to: '/inventaire', label: 'Inventaire', icon: 'inventory', desc: 'Comptage guidé' },
    { to: '/parametres/taux', label: 'Taux de change', icon: 'currency_exchange', desc: 'USD ↔ FC du jour' },
    { to: '/parametres', label: 'Paramètres', icon: 'settings', desc: 'Imprimante, équipe, sync' },
  ] as const

  return (
    <div className="flex flex-col gap-stack-md w-full">
      <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-primary">Plus</h1>
      <div className="flex flex-col gap-2">
        {links.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            className="flex items-center gap-3 bg-surface-container-lowest border border-outline-variant rounded-xl p-stack-md hover:bg-surface-container-low transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center text-primary">
              <span className="material-symbols-outlined">{l.icon}</span>
            </div>
            <div className="min-w-0">
              <p className="font-body-lg text-body-lg font-semibold text-on-surface">{l.label}</p>
              <p className="font-body-md text-body-md text-on-surface-variant">{l.desc}</p>
            </div>
            <span className="material-symbols-outlined text-on-surface-variant ml-auto">
              chevron_right
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}

export function ParametresPage() {
  const { boutique, user, logout } = useAuth()
  const meta = useLiveQuery(() => db.meta.get('app'), [])
  const [currency, setCurrency] = useState(boutique?.currency || 'CDF')
  const [usdRate, setUsdRate] = useState(boutique?.usdRateCdf || 2800)
  const [paperWidth, setPaperWidth] = useState<58 | 80>(boutique?.paperWidthMm || 58)
  const [autoPrint, setAutoPrint] = useState(!!boutique?.autoPrintTicket)
  const [printerReady, setPrinterReady] = useState(isThermalPrinterConnected())
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (boutique?.currency) setCurrency(boutique.currency)
    if (boutique?.usdRateCdf) setUsdRate(boutique.usdRateCdf)
    if (boutique?.paperWidthMm) setPaperWidth(boutique.paperWidthMm)
    setAutoPrint(!!boutique?.autoPrintTicket)
  }, [boutique?.currency, boutique?.usdRateCdf, boutique?.paperWidthMm, boutique?.autoPrintTicket])

  if (!boutique || !user) return null

  async function onCurrency(e: FormEvent) {
    e.preventDefault()
    await updateBoutiqueCurrency(boutique!.id, currency)
    setMsg('Devise mise à jour')
  }

  async function onPrinterSettings(e: FormEvent) {
    e.preventDefault()
    await updateBoutiquePrinterSettings(boutique!.id, {
      paperWidthMm: paperWidth,
      autoPrintTicket: autoPrint,
    })
    setMsg('Réglages ticket enregistrés')
  }

  async function onConnectPrinter() {
    setError('')
    try {
      await connectThermalPrinter()
      setPrinterReady(true)
      setMsg('Imprimante thermique connectée')
    } catch (err) {
      setError(String((err as Error).message || err))
      setPrinterReady(false)
    }
  }

  async function onDisconnectPrinter() {
    await disconnectThermalPrinter()
    setPrinterReady(false)
    setMsg('Imprimante déconnectée')
  }

  async function onTestPrint() {
    setError('')
    try {
      const bytes = Uint8Array.from(
        `\x1b@\x1ba\x01${boutique!.name}\nTest ticket ${paperWidth}mm\n\x1ba\x00OK\n\n\n\x1dV\x00`,
        (c) => c.charCodeAt(0) & 0xff,
      )
      await sendRawToPrinter(bytes)
      setMsg('Page de test envoyée')
    } catch (err) {
      setError(String((err as Error).message || err))
    }
  }

  async function onSync() {
    const res = await syncNow()
    setMsg(res.ok ? 'Synchronisation OK' : res.message || 'Échec sync')
  }

  return (
    <div className="flex flex-col gap-stack-md w-full max-w-3xl mx-auto pb-4">
      <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary">
        Paramètres
      </h1>

      <section className={`${sectionClass} border-l-4 border-l-secondary`}>
        <h2 className="font-headline-md text-headline-md text-primary flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary">flag</span>
          Mode Kinshasa (FC + USD)
        </h2>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Devise des prix en <strong className="text-on-surface">Franc congolais (CDF)</strong> +
          taux du dollar pour encaisser en $.
        </p>
        <p className="font-body-lg text-body-lg text-on-surface">
          Actuel : <strong>{boutique.currency}</strong>
          {boutique.usdRateCdf
            ? ` · 1 $ = ${formatMoney(boutique.usdRateCdf, 'CDF')}`
            : ' · taux non défini'}
        </p>
        <button
          type="button"
          className={btnPrimary}
          onClick={() =>
            void activateKinshasaMode(boutique.id, usdRate || boutique.usdRateCdf || 2800).then(
              () => setMsg('Mode Kinshasa activé (CDF + USD)'),
            )
          }
        >
          Activer / réappliquer CDF + USD
        </button>
      </section>

      <section className={sectionClass}>
        <h2 className="font-headline-md text-headline-md text-primary flex items-center gap-2">
          <span className="material-symbols-outlined">storefront</span>
          Boutique
        </h2>
        <p className="font-body-lg text-body-lg font-semibold text-on-surface">{boutique.name}</p>
        <p className="font-body-md text-body-md text-on-surface">
          Code invitation :{' '}
          <code className="font-label-mono text-label-mono bg-surface-container-low px-2 py-1 rounded-lg text-primary">
            {boutique.inviteCode}
          </code>
        </p>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Partagez ce code pour qu’un gérant / vendeur rejoigne depuis un autre appareil (après
          sync).
        </p>
        <form onSubmit={onCurrency} className="flex flex-col gap-stack-md">
          <label className={labelClass}>
            <span className={labelText}>Devise des prix</span>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className={inputClass}
            >
              <option value="CDF">CDF — Franc congolais (FC)</option>
              <option value="USD">USD — Dollar</option>
              <option value="XOF">XOF (FCFA)</option>
              <option value="XAF">XAF (FCFA)</option>
              <option value="EUR">EUR</option>
            </select>
          </label>
          <button type="submit" className={btnGhost}>
            Enregistrer devise
          </button>
        </form>
      </section>

      <section className={sectionClass}>
        <h2 className="font-headline-md text-headline-md text-primary flex items-center gap-2">
          <span className="material-symbols-outlined">currency_exchange</span>
          Taux du dollar (Kinshasa)
        </h2>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Actuel :{' '}
          {boutique.usdRateCdf
            ? `1 $ = ${formatMoney(boutique.usdRateCdf, 'CDF')}`
            : 'non défini'}
          {boutique.usdRateUpdatedAt
            ? ` · MAJ ${formatDateTime(boutique.usdRateUpdatedAt)}`
            : ''}
        </p>
        <Link to="/parametres/taux" className={btnPrimary}>
          Régler le taux de change
        </Link>
      </section>

      <section className={sectionClass}>
        <h2 className="font-headline-md text-headline-md text-primary flex items-center gap-2">
          <span className="material-symbols-outlined">print</span>
          Impression tickets
        </h2>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Imprimante thermique USB ESC/POS (58 ou 80 mm) via Web Serial — Chrome / Edge recommandé.
        </p>
        <form onSubmit={onPrinterSettings} className="flex flex-col gap-stack-md">
          <label className={labelClass}>
            <span className={labelText}>Largeur papier</span>
            <select
              value={paperWidth}
              onChange={(e) => setPaperWidth(Number(e.target.value) as 58 | 80)}
              className={inputClass}
            >
              <option value={58}>58 mm</option>
              <option value={80}>80 mm</option>
            </select>
          </label>
          <label className="flex items-center gap-3 font-body-md text-body-md text-on-surface">
            <input
              type="checkbox"
              checked={autoPrint}
              onChange={(e) => setAutoPrint(e.target.checked)}
              className="w-5 h-5 accent-primary"
            />
            Imprimer automatiquement après encaissement
          </label>
          <button type="submit" className={btnGhost}>
            Enregistrer
          </button>
        </form>
        {isWebSerialSupported() ? (
          <div className="flex flex-wrap gap-2">
            <button type="button" className={btnPrimary} onClick={() => void onConnectPrinter()}>
              {printerReady ? 'Changer d’imprimante' : 'Connecter imprimante'}
            </button>
            {printerReady && (
              <>
                <button type="button" className={btnGhost} onClick={() => void onTestPrint()}>
                  Test impression
                </button>
                <button
                  type="button"
                  className={btnGhost}
                  onClick={() => void onDisconnectPrinter()}
                >
                  Déconnecter
                </button>
              </>
            )}
          </div>
        ) : (
          <p className="font-body-md text-body-md text-on-surface-variant">
            Ce navigateur ne gère pas Web Serial. L’impression passera par le dialogue navigateur
            (mise en page ticket {paperWidth} mm).
          </p>
        )}
      </section>

      <section className={sectionClass}>
        <h2 className="font-headline-md text-headline-md text-primary flex items-center gap-2">
          <span className="material-symbols-outlined">cloud_sync</span>
          Synchronisation
        </h2>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Dernière sync : {meta?.lastSyncAt ? formatDateTime(meta.lastSyncAt) : 'jamais'}
        </p>
        <button type="button" className={btnPrimary} onClick={() => void onSync()}>
          Synchroniser maintenant
        </button>
      </section>

      {canManageUsers(user.role) && (
        <section className={sectionClass}>
          <h2 className="font-headline-md text-headline-md text-primary flex items-center gap-2">
            <span className="material-symbols-outlined">badge</span>
            Équipe
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Gérer les membres, rôles, PIN et comptes actifs.
          </p>
          <Link to="/equipe" className={btnPrimary}>
            Ouvrir la gestion d&apos;équipe
          </Link>
        </section>
      )}

      {msg && (
        <p className="font-body-md text-body-md text-on-tertiary-container font-semibold">{msg}</p>
      )}
      {error && <p className="font-body-md text-body-md text-error font-semibold">{error}</p>}

      <button type="button" className={btnGhost} onClick={() => void logout()}>
        Changer d’utilisateur (PIN)
      </button>
    </div>
  )
}
