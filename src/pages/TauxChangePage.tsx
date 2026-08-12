import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from '../lib/auth'
import { updateBoutiqueFxRate } from '../lib/services'
import { formatDateTime, formatMoney } from '../lib/utils'
import { USD_BILLS, usdToCdf } from '../lib/fx'

function formatFc(n: number) {
  return `${new Intl.NumberFormat('fr-FR').format(Math.round(n))} FC`
}

export function TauxChangePage() {
  const { boutique } = useAuth()
  const [rate, setRate] = useState(boutique?.usdRateCdf || 2800)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (boutique?.usdRateCdf) setRate(boutique.usdRateCdf)
  }, [boutique?.usdRateCdf])

  if (!boutique) return null

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setMsg('')
    setBusy(true)
    try {
      await updateBoutiqueFxRate(boutique!.id, Number(rate))
      setMsg('Taux mis à jour')
    } catch (err) {
      setError(String((err as Error).message || err))
    } finally {
      setBusy(false)
    }
  }

  const previewBills = USD_BILLS.length ? USD_BILLS : [1, 5, 10, 20, 50, 100]

  return (
    <form
      onSubmit={onSubmit}
      className="max-w-3xl mx-auto w-full flex flex-col gap-gutter pb-8"
    >
      <div className="mb-1">
        <h1 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-primary">
          Taux de change
        </h1>
        {boutique.usdRateUpdatedAt && (
          <p className="font-label-mono text-label-mono text-on-surface-variant mt-1">
            Dernière MAJ : {formatDateTime(boutique.usdRateUpdatedAt)}
            {boutique.usdRateCdf
              ? ` · actuel 1 $ = ${formatMoney(boutique.usdRateCdf, 'CDF')}`
              : ''}
          </p>
        )}
      </div>

      <div className="bg-surface-container-low border border-outline-variant rounded-lg p-stack-md flex items-start gap-stack-sm">
        <span className="material-symbols-outlined text-primary mt-1 shrink-0">info</span>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Ce taux sera utilisé pour tous les calculs de conversion à la caisse et dans le tableau de
          bord. Les modifications sont appliquées immédiatement.
        </p>
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-stack-md md:p-gutter flex flex-col gap-stack-md">
        <h2 className="font-headline-md text-headline-md text-on-surface">
          Taux du jour USD / FC
        </h2>
        <div className="flex flex-col gap-stack-sm">
          <label
            className="font-body-md text-body-md text-on-surface-variant"
            htmlFor="exchange-rate"
          >
            1 USD (Dollar Américain) équivaut à :
          </label>
          <div className="relative flex items-center">
            <input
              id="exchange-rate"
              type="number"
              min={1}
              step={1}
              required
              value={rate || ''}
              onChange={(e) => setRate(Number(e.target.value) || 0)}
              onFocus={(e) => e.currentTarget.select()}
              className="w-full h-14 pl-4 pr-16 bg-surface border border-outline rounded-lg font-headline-lg-mobile text-headline-lg-mobile text-on-surface focus:border-primary focus:ring-2 focus:ring-primary-container outline-none transition-all"
            />
            <div className="absolute right-4 font-headline-md text-headline-md text-on-surface-variant pointer-events-none">
              FC
            </div>
          </div>
        </div>
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-stack-md md:p-gutter">
        <div className="flex items-center gap-2 mb-stack-md">
          <span className="material-symbols-outlined text-on-surface-variant">calculate</span>
          <h3 className="font-headline-md text-headline-md text-on-surface">Aperçu rapide</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-stack-md">
          {previewBills.map((usd) => (
            <div
              key={usd}
              className="flex flex-col p-stack-sm bg-surface rounded-lg border border-outline-variant"
            >
              <span className="font-label-mono text-label-mono text-on-surface-variant mb-1">
                {usd} $
              </span>
              <span className="font-headline-md text-headline-md text-on-surface">
                {rate > 0 ? formatFc(usdToCdf(usd, rate)) : '—'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {msg && (
        <p className="font-body-md text-body-md text-on-tertiary-container flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          {msg}
        </p>
      )}
      {error && (
        <p className="font-body-md text-body-md text-error flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">error</span>
          {error}
        </p>
      )}

      <div className="pt-gutter">
        <button
          type="submit"
          disabled={busy || !rate}
          className="w-full h-[56px] bg-primary text-on-primary font-headline-md text-headline-md rounded-lg flex items-center justify-center gap-2 hover:bg-primary-container transition-colors active:scale-[0.98] disabled:opacity-50"
        >
          <span className="material-symbols-outlined">save</span>
          {busy ? 'Enregistrement…' : 'Mettre à jour le taux'}
        </button>
      </div>
    </form>
  )
}
