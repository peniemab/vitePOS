import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { useAuth } from '../lib/auth'
import { closeCashSession, getOpenCashSession, openCashSession, todayStats } from '../lib/services'
import { canCloseCash } from '../lib/roles'
import { formatDateTime, formatMoney } from '../lib/utils'
import { cdfToUsd, hasValidUsdRate, roundUsd, usdToCdf } from '../lib/fx'

function nowLabel() {
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date())
}

export function JourneePage() {
  const { boutique, user } = useAuth()
  const navigate = useNavigate()
  const sessions = useLiveQuery(
    () =>
      boutique
        ? db.cashSessions.where('boutiqueId').equals(boutique.id).reverse().sortBy('openedAt')
        : [],
    [boutique?.id],
  )
  const [open, setOpen] = useState<Awaited<ReturnType<typeof getOpenCashSession>>>(undefined)
  const [stats, setStats] = useState<Awaited<ReturnType<typeof todayStats>> | null>(null)
  const [floatAmt, setFloatAmt] = useState(0)
  const [countedFc, setCountedFc] = useState(0)
  const [countedUsd, setCountedUsd] = useState(0)
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [prefilled, setPrefilled] = useState(false)

  useEffect(() => {
    if (!boutique) return
    void getOpenCashSession(boutique.id).then(setOpen)
    void todayStats(boutique.id).then(setStats)
  }, [boutique?.id, sessions])

  const rate = boutique?.usdRateCdf || 0

  const sessionPayments = useMemo(() => {
    let cashFc = 0
    let cashUsd = 0
    let mobileMoney = 0
    if (!open || !stats) {
      return stats?.payments || { cashFc: 0, cashUsd: 0, mobileMoney: 0 }
    }
    for (const sale of stats.sales) {
      if (sale.cashSessionId !== open.id) continue
      for (const p of sale.payments) {
        if (p.method === 'mobile_money') {
          mobileMoney += p.amount
          continue
        }
        if (p.method === 'especes') {
          if (sale.payCurrency === 'USD') cashUsd += sale.totalInPayCurrency ?? p.amount
          else cashFc += p.amount
        }
      }
    }
    return { cashFc, cashUsd, mobileMoney }
  }, [open, stats])

  const expectedFc = (open?.openingFloat || 0) + sessionPayments.cashFc
  const expectedUsd = (open?.openingFloatUsd || 0) + sessionPayments.cashUsd
  const varianceFc = countedFc - expectedFc
  const varianceUsd = countedUsd - expectedUsd
  const varianceTotalFc =
    varianceFc + (hasValidUsdRate(rate) ? usdToCdf(varianceUsd, rate) : 0)

  // Préremplit une fois les montants attendus (comme sur la maquette)
  useEffect(() => {
    if (!open || prefilled) return
    setCountedFc(expectedFc)
    setCountedUsd(expectedUsd)
    setPrefilled(true)
  }, [open, expectedFc, expectedUsd, prefilled])

  useEffect(() => {
    if (!open) setPrefilled(false)
  }, [open])

  if (!boutique || !user) return null

  async function onOpen(e: FormEvent) {
    e.preventDefault()
    setError('')
    try {
      const s = await openCashSession(boutique!.id, user!.id, floatAmt)
      setOpen(s)
      setPrefilled(false)
    } catch (err) {
      setError(String((err as Error).message || err))
    }
  }

  async function onClose(e: FormEvent) {
    e.preventDefault()
    if (!open) return
    setError('')
    setBusy(true)
    try {
      const closed = await closeCashSession(open.id, user!.id, countedFc, notes, countedUsd)
      setOpen(undefined)
      setStats(await todayStats(boutique!.id))
      setCountedFc(0)
      setCountedUsd(0)
      setNotes('')
      setPrefilled(false)
      navigate(`/journee/rapport/${closed.id}`)
    } catch (err) {
      setError(String((err as Error).message || err))
    } finally {
      setBusy(false)
    }
  }

  const usdApprox =
    hasValidUsdRate(rate) && stats ? roundUsd(cdfToUsd(stats.ca, rate)) : null

  const canReconcile = !!open && canCloseCash(user)

  return (
    <div className="flex flex-col gap-stack-md w-full max-w-3xl mx-auto pb-28 md:pb-8">
      <div className="mb-stack-sm">
        <h2 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-on-surface">
          Clôture de caisse
        </h2>
        <p className="font-body-md text-body-md text-on-surface-variant mt-1 capitalize">
          {nowLabel()}
        </p>
      </div>

      {stats && (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-stack-md">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-stack-md flex flex-col gap-stack-sm">
            <div className="flex items-center gap-2 text-on-surface-variant">
              <span className="material-symbols-outlined text-primary">account_balance_wallet</span>
              <span className="font-body-lg text-body-lg font-semibold">
                Chiffre d&apos;affaires total
              </span>
            </div>
            <div className="flex flex-col">
              <span className="font-display-price text-display-price text-primary">
                {formatMoney(stats.ca, boutique.currency)}
              </span>
              {usdApprox != null && (
                <span className="font-body-md text-body-md text-on-surface-variant mt-1">
                  ~ {formatMoney(usdApprox, 'USD')}
                </span>
              )}
            </div>
          </div>
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-stack-md flex flex-col gap-stack-sm">
            <div className="flex items-center gap-2 text-on-surface-variant">
              <span className="material-symbols-outlined text-primary">receipt_long</span>
              <span className="font-body-lg text-body-lg font-semibold">Transactions</span>
            </div>
            <div className="flex flex-col justify-end h-full">
              <span className="font-display-price text-display-price text-primary">
                {stats.count}
              </span>
              <span className="font-body-md text-body-md text-on-surface-variant mt-1">
                Tickets émis aujourd&apos;hui
              </span>
            </div>
          </div>
        </section>
      )}

      {stats && (
        <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-stack-md mt-stack-sm">
          <h3 className="font-headline-md text-headline-md text-on-surface mb-stack-md border-b border-surface-variant pb-2">
            Ventilation par mode
          </h3>
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center py-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface-variant">
                  <span className="material-symbols-outlined">payments</span>
                </div>
                <span className="font-body-lg text-body-lg text-on-surface">Espèces FC</span>
              </div>
              <span className="font-body-lg text-body-lg font-semibold text-on-surface">
                {formatMoney(sessionPayments.cashFc || 0, 'CDF')}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-t border-surface-variant">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface-variant">
                  <span className="material-symbols-outlined">attach_money</span>
                </div>
                <span className="font-body-lg text-body-lg text-on-surface">Espèces USD</span>
              </div>
              <div className="text-right">
                <span className="font-body-lg text-body-lg font-semibold text-on-surface block">
                  {formatMoney(sessionPayments.cashUsd || 0, 'USD')}
                </span>
                {hasValidUsdRate(rate) && (
                  <span className="font-label-mono text-label-mono text-on-surface-variant">
                    {formatMoney(usdToCdf(sessionPayments.cashUsd || 0, rate), 'CDF')}
                  </span>
                )}
              </div>
            </div>
            <div className="flex justify-between items-center py-2 border-t border-surface-variant">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface-variant">
                  <span className="material-symbols-outlined">send_to_mobile</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-body-lg text-body-lg text-on-surface">Mobile Money</span>
                  <span className="font-label-mono text-label-mono text-on-surface-variant">
                    M-Pesa, Airtel
                  </span>
                </div>
              </div>
              <span className="font-body-lg text-body-lg font-semibold text-on-surface">
                {formatMoney(sessionPayments.mobileMoney || 0, boutique.currency)}
              </span>
            </div>
          </div>
        </section>
      )}

      {!open && canCloseCash(user) && (
        <form
          onSubmit={onOpen}
          className="bg-surface-container-lowest border border-outline-variant rounded-xl p-stack-md flex flex-col gap-stack-md"
        >
          <h3 className="font-headline-md text-headline-md text-on-surface">Ouvrir la caisse</h3>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Démarrez la session pour rattacher les ventes et clôturer en fin de journée.
          </p>
          <label className="flex flex-col gap-2">
            <span className="font-label-mono text-label-mono text-on-surface-variant">
              FOND DE CAISSE (FC)
            </span>
            <div className="relative">
              <input
                type="number"
                min={0}
                className="w-full h-14 bg-surface-container-lowest border-2 border-outline-variant rounded-lg px-4 font-headline-md text-headline-md text-on-surface focus:border-primary focus:outline-none"
                value={floatAmt || ''}
                onChange={(e) => setFloatAmt(Number(e.target.value) || 0)}
                placeholder="0"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 font-label-mono text-label-mono text-on-surface-variant">
                FC
              </span>
            </div>
          </label>
          {error && <p className="font-body-md text-body-md text-error">{error}</p>}
          <button
            type="submit"
            className="h-14 bg-primary text-on-primary font-headline-md text-headline-md font-bold rounded-xl flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined">lock_open</span>
            Ouvrir la caisse
          </button>
        </form>
      )}

      {canReconcile && (
        <form
          id="close-cash-form"
          onSubmit={onClose}
          className="bg-surface-container-low border border-outline-variant rounded-xl p-stack-md mt-stack-sm shadow-sm relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
          <h3 className="font-headline-md text-headline-md text-on-surface mb-stack-md">
            Réconciliation Espèces
          </h3>
          <p className="font-body-md text-body-md text-on-surface-variant mb-stack-md">
            Session ouverte depuis {formatDateTime(open!.openedAt)}. Saisissez le montant physique
            compté dans le tiroir-caisse.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-stack-md">
            <div className="flex flex-col gap-2">
              <label
                className="font-label-mono text-label-mono text-on-surface-variant"
                htmlFor="counted-fc"
              >
                MONTANT COMPTÉ (FC)
              </label>
              <div className="relative">
                <input
                  id="counted-fc"
                  type="number"
                  min={0}
                  className="w-full h-14 bg-surface-container-lowest border-2 border-outline-variant rounded-lg px-4 font-headline-md text-headline-md text-on-surface focus:border-primary focus:ring-0 focus:outline-none transition-colors"
                  value={countedFc || ''}
                  onChange={(e) => setCountedFc(Number(e.target.value) || 0)}
                  onFocus={(e) => e.currentTarget.select()}
                  placeholder="0"
                  required
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-label-mono text-label-mono text-on-surface-variant">
                  FC
                </span>
              </div>
              <p className="font-label-mono text-label-mono text-on-surface-variant">
                Attendu : {formatMoney(expectedFc, 'CDF')}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <label
                className="font-label-mono text-label-mono text-on-surface-variant"
                htmlFor="counted-usd"
              >
                MONTANT COMPTÉ (USD)
              </label>
              <div className="relative">
                <input
                  id="counted-usd"
                  type="number"
                  min={0}
                  step="0.01"
                  className="w-full h-14 bg-surface-container-lowest border-2 border-outline-variant rounded-lg px-4 font-headline-md text-headline-md text-on-surface focus:border-primary focus:ring-0 focus:outline-none transition-colors"
                  value={countedUsd || ''}
                  onChange={(e) => setCountedUsd(Number(e.target.value) || 0)}
                  onFocus={(e) => e.currentTarget.select()}
                  placeholder="0.00"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-label-mono text-label-mono text-on-surface-variant">
                  USD
                </span>
              </div>
              <p className="font-label-mono text-label-mono text-on-surface-variant">
                Attendu : {formatMoney(expectedUsd, 'USD')}
              </p>
            </div>
          </div>

          {Math.abs(varianceTotalFc) >= 1 && (
            <div
              className={`mt-stack-md p-stack-sm rounded-lg border flex items-center justify-between ${
                varianceTotalFc < 0
                  ? 'bg-error-container text-on-error-container border-error'
                  : 'bg-surface-container-lowest border-outline-variant text-on-surface'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-error">warning</span>
                <span className="font-body-lg text-body-lg font-semibold">
                  {varianceTotalFc < 0 ? 'Manquant détecté' : 'Excédent détecté'}
                </span>
              </div>
              <span className="font-headline-md text-headline-md font-bold">
                {varianceTotalFc > 0 ? '+ ' : '− '}
                {formatMoney(Math.abs(varianceTotalFc), 'CDF')}
              </span>
            </div>
          )}

          <div className="mt-stack-sm flex flex-col gap-2">
            <label
              className="font-label-mono text-label-mono text-on-surface-variant"
              htmlFor="reconciliation-note"
            >
              NOTE D&apos;ÉCART (Optionnel)
            </label>
            <input
              id="reconciliation-note"
              className="w-full h-12 bg-surface-container-lowest border border-outline-variant rounded-lg px-4 font-body-md text-body-md text-on-surface focus:border-primary focus:ring-0 focus:outline-none"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Rendu monnaie erroné client X..."
            />
          </div>

          {error && <p className="mt-2 font-body-md text-body-md text-error">{error}</p>}
        </form>
      )}

      {open && !canCloseCash(user) && (
        <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-stack-md">
          <p className="font-body-md text-body-md text-on-surface-variant">
            Caisse ouverte depuis {formatDateTime(open.openedAt)}. Seul un gérant ou propriétaire
            peut clôturer.
          </p>
        </section>
      )}

      <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-stack-md">
        <h3 className="font-headline-md text-headline-md text-on-surface mb-stack-md">Sessions</h3>
        <ul className="flex flex-col gap-3">
          {(sessions || []).map((s) => (
            <li
              key={s.id}
              className="flex flex-col gap-1 border-b border-surface-variant pb-3 last:border-0 last:pb-0"
            >
              <div className="flex justify-between">
                <strong className="font-body-lg text-body-lg capitalize">{s.status}</strong>
                <span className="font-label-mono text-label-mono text-on-surface-variant">
                  {formatDateTime(s.openedAt)}
                </span>
              </div>
              {s.status === 'cloturee' && (
                <div className="flex flex-col gap-2">
                  <p className="font-body-md text-body-md text-on-surface-variant">
                    FC {formatMoney(s.expectedCash || 0, 'CDF')} · USD{' '}
                    {formatMoney(s.expectedCashUsd || 0, 'USD')} · MM{' '}
                    {formatMoney(s.expectedMobileMoney || 0, boutique.currency)} · écart{' '}
                    {formatMoney(s.cashVariance || 0, 'CDF')} · {s.ticketCount} tickets
                  </p>
                  <Link
                    to={`/journee/rapport/${s.id}`}
                    className="inline-flex items-center gap-1 font-label-mono text-label-mono text-primary"
                  >
                    <span className="material-symbols-outlined text-[16px]">description</span>
                    Voir le rapport PDF
                  </Link>
                </div>
              )}
            </li>
          ))}
          {!sessions?.length && (
            <li className="font-body-md text-body-md text-on-surface-variant">
              Aucune session pour l&apos;instant
            </li>
          )}
        </ul>
      </section>

      {/* Sticky validate bar — maquette */}
      {canReconcile && (
        <div className="fixed bottom-[64px] md:bottom-0 left-0 md:left-[72px] lg:left-[220px] right-0 bg-surface border-t border-outline-variant p-margin-mobile md:p-margin-desktop z-40">
          <div className="max-w-3xl mx-auto">
            <button
              type="submit"
              form="close-cash-form"
              disabled={busy}
              className="w-full h-14 bg-primary text-on-primary font-headline-md text-headline-md font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-primary-container transition-colors active:scale-95 shadow-sm disabled:opacity-60"
            >
              <span className="material-symbols-outlined">lock</span>
              {busy ? 'Validation…' : 'Valider la clôture'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
