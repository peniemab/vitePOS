import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { formatMoney } from '../lib/utils'
import { activateKinshasaMode, todayStats } from '../lib/services'
import { cdfToUsd, hasValidUsdRate, roundUsd } from '../lib/fx'

function todayLabel() {
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date())
}

export function AccueilPage() {
  const { boutique } = useAuth()
  const [stats, setStats] = useState<Awaited<ReturnType<typeof todayStats>> | null>(null)
  const [fxMsg, setFxMsg] = useState('')

  useEffect(() => {
    if (!boutique) return
    void todayStats(boutique.id).then(setStats)
    const t = setInterval(() => void todayStats(boutique.id).then(setStats), 4000)
    return () => clearInterval(t)
  }, [boutique?.id])

  if (!boutique || !stats) {
    return <p className="font-body-md text-body-md text-on-surface-variant">Chargement…</p>
  }

  const rate = boutique.usdRateCdf || 0
  const usdApprox =
    hasValidUsdRate(rate) && boutique.currency === 'CDF'
      ? roundUsd(cdfToUsd(stats.ca, rate))
      : null

  const needsKinshasaSetup =
    boutique.currency !== 'CDF' || !hasValidUsdRate(boutique.usdRateCdf)

  async function onActivateKinshasa() {
    await activateKinshasaMode(boutique!.id, boutique!.usdRateCdf || 2800)
    setFxMsg('Mode Kinshasa activé : FC (CDF) + taux USD')
  }

  return (
    <div className="flex flex-col gap-stack-md w-full">
      {needsKinshasaSetup && (
        <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-stack-md flex flex-col gap-stack-sm">
          <h2 className="font-headline-md text-headline-md text-primary">Kinshasa : FC + Dollar</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Boutique encore en {boutique.currency}. Activez le mode Kinshasa pour le franc
            congolais et l’encaissement USD.
          </p>
          <button
            type="button"
            className="h-12 bg-primary text-on-primary rounded-xl font-headline-md text-headline-md"
            onClick={() => void onActivateKinshasa()}
          >
            Activer CDF + USD
          </button>
          {fxMsg && <p className="font-body-md text-body-md text-on-tertiary-container">{fxMsg}</p>}
        </section>
      )}

      <section className="flex flex-col gap-base">
        <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary">
          Vue d&apos;ensemble
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant capitalize">
          Aujourd&apos;hui, {todayLabel()}
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-stack-md flex flex-col gap-stack-sm col-span-1 md:col-span-2 relative overflow-hidden">
          <div className="flex justify-between items-start z-10 relative">
            <span className="font-label-mono text-label-mono text-on-surface-variant uppercase">
              Chiffre d&apos;affaires
            </span>
            <span className="material-symbols-outlined text-tertiary-fixed-dim">trending_up</span>
          </div>
          <div className="flex flex-col gap-base z-10 relative mt-2">
            <span className="font-display-price text-display-price text-primary">
              {formatMoney(stats.ca, boutique.currency)}
            </span>
            {usdApprox != null && (
              <span className="font-body-lg text-body-lg text-on-surface-variant font-medium">
                ~ {formatMoney(usdApprox, 'USD')}
              </span>
            )}
          </div>
          <div className="absolute -bottom-6 -right-6 opacity-5 z-0 pointer-events-none">
            <span className="material-symbols-outlined text-[120px]">payments</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-stack-md flex flex-col gap-stack-sm col-span-1">
          <div className="flex justify-between items-start">
            <span className="font-label-mono text-label-mono text-on-surface-variant uppercase">
              Ventes
            </span>
            <span className="material-symbols-outlined text-primary-container">receipt_long</span>
          </div>
          <div className="flex flex-col gap-base mt-2">
            <span className="font-display-price text-display-price text-primary">{stats.count}</span>
            <span className="font-body-md text-body-md text-on-surface-variant">
              {stats.vsYesterday == null
                ? 'Pas de référence hier'
                : `${stats.vsYesterday >= 0 ? '+' : ''}${stats.vsYesterday}% vs hier`}
            </span>
          </div>
        </div>

        {stats.lowStock > 0 ? (
          <Link
            to="/stock-bas"
            className="bg-error-container border border-error rounded-xl p-stack-md flex flex-col gap-stack-sm col-span-1 md:col-span-3"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-error">warning</span>
              <span className="font-headline-md text-headline-md text-error">
                Alertes Stock Bas
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {stats.lowStockProducts.map((p) => (
                <div
                  key={p.id}
                  className="flex justify-between items-center bg-surface-container-lowest/50 p-2 rounded"
                >
                  <span className="font-body-md text-body-md font-semibold text-on-surface">
                    {p.name}
                  </span>
                  <span className="font-label-mono text-label-mono text-error font-bold">
                    Reste: {p.stock}
                  </span>
                </div>
              ))}
            </div>
          </Link>
        ) : (
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-stack-md col-span-1 md:col-span-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-on-tertiary-container">check_circle</span>
            <span className="font-body-md text-body-md text-on-surface-variant">
              Aucune alerte stock pour le moment
            </span>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-stack-sm mt-stack-md">
        <h2 className="font-label-mono text-label-mono text-on-surface-variant uppercase mb-2">
          Actions Rapides
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
          <Link
            to="/caisse"
            className="bg-secondary text-on-primary h-[56px] rounded-lg font-headline-md text-headline-md flex items-center justify-center gap-2 hover:bg-on-secondary-fixed-variant transition-colors shadow-sm active:scale-95"
          >
            <span className="material-symbols-outlined">point_of_sale</span>
            Nouvelle Vente
          </Link>
          <Link
            to="/inventaire"
            className="bg-primary-container text-on-primary-container h-[56px] rounded-lg font-headline-md text-headline-md flex items-center justify-center gap-2 hover:bg-surface-tint transition-colors border border-outline-variant shadow-sm"
          >
            <span className="material-symbols-outlined">inventory_2</span>
            Inventaire
          </Link>
          <Link
            to="/produits"
            className="bg-surface-container-high text-on-surface h-[56px] rounded-lg font-headline-md text-headline-md flex items-center justify-center gap-2 hover:bg-surface-variant transition-colors border border-outline-variant shadow-sm"
          >
            <span className="material-symbols-outlined">local_shipping</span>
            Arrivage Stock
          </Link>
        </div>
      </section>
    </div>
  )
}
