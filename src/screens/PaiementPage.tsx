'use client'

import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { useAuth } from '../lib/auth'
import { useCart } from '../lib/cart'
import { createSale, getOpenCashSession } from '../lib/services'
import { formatMoney } from '../lib/utils'
import type { PayCurrency } from '../db/types'
import {
  CDF_BILLS,
  USD_BILLS,
  cdfToUsd,
  hasValidUsdRate,
  roundCdf,
  roundUsd,
  usdToCdf,
} from '../lib/fx'

type PayTab = 'fc' | 'usd' | 'mm'

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0', 'check'] as const

function formatInputDisplay(raw: string, currency: PayCurrency) {
  if (!raw) return '0'
  const n = Number(raw)
  if (!Number.isFinite(n)) return raw
  if (currency === 'USD') {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: raw.includes('.') ? Math.min(2, raw.split('.')[1]?.length || 0) : 0,
      maximumFractionDigits: 2,
    }).format(n)
  }
  return new Intl.NumberFormat('fr-FR').format(Math.round(n))
}

export function PaiementPage() {
  const { boutique, user } = useAuth()
  const cart = useCart()
  const router = useRouter()
  const clients = useLiveQuery(
    () => (boutique ? db.clients.where('boutiqueId').equals(boutique.id).toArray() : []),
    [boutique?.id],
  )

  const [tab, setTab] = useState<PayTab>('fc')
  const [digits, setDigits] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const rate = boutique?.usdRateCdf
  const rateOk = hasValidUsdRate(rate)
  const payCurrency: PayCurrency = tab === 'usd' ? 'USD' : 'CDF'
  const method = tab === 'mm' ? 'mobile_money' : 'especes'

  useEffect(() => {
    if (!cart.lines.length) router.push('/caisse')
  }, [cart.lines.length, router])

  useEffect(() => {
    setDigits('')
    setError('')
  }, [tab, cart.total])

  const totalUsd = useMemo(() => {
    if (!rateOk || !rate) return 0
    return roundUsd(cdfToUsd(cart.total, rate))
  }, [cart.total, rate, rateOk])

  const dueInPay = tab === 'usd' ? totalUsd : cart.total
  const cashReceived = digits === '' ? 0 : Number(digits) || 0

  const change = useMemo(() => {
    if (tab === 'mm') return 0
    const raw = cashReceived - dueInPay
    if (raw <= 0) return 0
    return tab === 'usd' ? roundUsd(raw) : roundCdf(raw)
  }, [cashReceived, dueInPay, tab])

  const missing = useMemo(() => {
    if (tab === 'mm') return 0
    const raw = dueInPay - cashReceived
    if (raw <= 0) return 0
    return tab === 'usd' ? roundUsd(raw) : roundCdf(raw)
  }, [cashReceived, dueInPay, tab])

  const enoughCash = tab === 'mm' || cashReceived + 1e-9 >= dueInPay

  const bills = tab === 'usd' ? USD_BILLS : CDF_BILLS.slice(0, 5)

  const changeUsdApprox =
    tab === 'fc' && change > 0 && rateOk && rate
      ? roundUsd(cdfToUsd(change, rate))
      : tab === 'usd' && change > 0
        ? change
        : null

  if (!boutique || !user) return null

  function pushKey(key: (typeof KEYS)[number]) {
    if (key === 'check') {
      setDigits(String(dueInPay))
      return
    }
    setDigits((prev) => {
      if (key === '00') {
        if (!prev || prev === '0') return '0'
        if (tab === 'usd' && prev.includes('.')) {
          const [, dec = ''] = prev.split('.')
          if (dec.length >= 2) return prev
          return (prev + '00').replace(/(\.\d{2}).*/, '$1')
        }
        return prev + '00'
      }
      if (prev === '0') return key
      if (tab === 'usd' && prev.includes('.')) {
        const [, dec = ''] = prev.split('.')
        if (dec.length >= 2) return prev
      }
      if (prev.length >= 10) return prev
      return prev + key
    })
  }

  function backspace() {
    setDigits((prev) => prev.slice(0, -1))
  }

  function addBill(amount: number) {
    setDigits((prev) => {
      const current = prev === '' ? 0 : Number(prev) || 0
      const next = tab === 'usd' ? roundUsd(current + amount) : roundCdf(current + amount)
      return String(next)
    })
  }

  async function onPay(e?: FormEvent) {
    e?.preventDefault()
    setBusy(true)
    setError('')
    try {
      if (tab === 'usd' && !rateOk) {
        throw new Error('Fixez d’abord le taux du dollar')
      }
      if (tab !== 'mm' && !enoughCash) {
        throw new Error(
          tab === 'usd'
            ? `Montant reçu insuffisant — il manque ${formatMoney(missing, 'USD')}`
            : `Montant reçu insuffisant — il manque ${formatMoney(missing, boutique!.currency)}`,
        )
      }

      const open = await getOpenCashSession(boutique!.id)
      const payments =
        method === 'especes'
          ? [{ method: 'especes' as const, amount: cart.total }]
          : [{ method: 'mobile_money' as const, amount: cart.total }]

      const receivedCdf =
        method === 'especes' && payCurrency === 'USD' && rate
          ? roundCdf(usdToCdf(cashReceived, rate))
          : method === 'especes'
            ? cashReceived
            : undefined

      const changeCdf =
        method === 'especes' && payCurrency === 'USD' && rate
          ? roundCdf(usdToCdf(change, rate))
          : method === 'especes'
            ? change
            : undefined

      const sale = await createSale({
        boutiqueId: boutique!.id,
        userId: user!.id,
        lines: cart.lines,
        discount: cart.discount,
        discountPercent: cart.discountPercent || undefined,
        paymentMethod: method,
        payments,
        cashReceived: receivedCdf,
        changeGiven: changeCdf,
        payCurrency: method === 'especes' ? payCurrency : 'CDF',
        exchangeRate: method === 'especes' && payCurrency === 'USD' ? rate : undefined,
        totalInPayCurrency: method === 'especes' ? dueInPay : cart.total,
        receivedInPayCurrency: method === 'especes' ? cashReceived : undefined,
        changeInPayCurrency: method === 'especes' ? change : undefined,
        clientId: cart.clientId,
        cashSessionId: open?.id,
      })
      cart.clear()
      router.push(`/ticket/${sale.id}`)
    } catch (err) {
      setError(String((err as Error).message || err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="relative flex flex-col -mx-margin-mobile md:-mx-margin-desktop min-h-[calc(100vh-8rem)] bg-surface-container-lowest pb-[100px]">
      <div className="w-full max-w-3xl mx-auto flex flex-col flex-1">
      {/* Total */}
      <section className="px-margin-mobile md:px-margin-desktop pt-stack-md pb-stack-md flex flex-col items-center border-b border-outline-variant bg-surface md:rounded-t-xl">
        <p className="font-body-md text-body-md text-on-surface-variant mb-1">
          Montant à régler
        </p>
        <h2 className="font-display-price text-display-price text-primary mb-1">
          {formatMoney(cart.total, boutique.currency)}
        </h2>
        {rateOk && rate ? (
          <div className="flex items-center gap-1 bg-surface-variant px-3 py-1 rounded-full">
            <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
              currency_exchange
            </span>
            <span className="font-label-mono text-label-mono text-on-surface-variant">
              ~ {formatMoney(totalUsd, 'USD')}
            </span>
          </div>
        ) : (
          <p className="font-label-mono text-label-mono text-error mt-1">
            <Link href="/parametres/taux" className="underline">
              Fixer le taux USD
            </Link>
          </p>
        )}
      </section>

      <section className="px-margin-mobile md:px-margin-desktop pt-stack-md flex flex-col gap-stack-md">
        {/* Tabs */}
        <div className="flex p-1 bg-surface-container rounded-lg">
          {(
            [
              { id: 'fc' as const, label: 'Espèces FC' },
              { id: 'usd' as const, label: 'Espèces USD', disabled: !rateOk },
              { id: 'mm' as const, label: 'M-Money' },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              disabled={'disabled' in t && t.disabled}
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 py-2 font-headline-md text-body-md rounded-md transition-all disabled:opacity-40 ${
                tab === t.id
                  ? 'bg-white text-primary shadow-sm border border-outline-variant'
                  : 'text-on-surface-variant hover:bg-surface-variant'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Client optional — compact */}
        <select
          className="w-full h-11 px-3 rounded-lg border border-outline-variant bg-surface font-body-md text-body-md text-on-surface"
          value={cart.clientId || ''}
          onChange={(e) => cart.setClientId(e.target.value || undefined)}
        >
          <option value="">Vente anonyme</option>
          {(clients || []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        {tab !== 'mm' && (
          <>
            {/* Bill chips */}
            <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
              <button
                type="button"
                onClick={() => setDigits(String(dueInPay))}
                className="flex-shrink-0 px-4 py-2 border border-primary bg-primary-container text-on-primary-container rounded-full font-label-mono text-label-mono"
              >
                Exact
              </button>
              {bills.map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => addBill(b)}
                  className="flex-shrink-0 px-4 py-2 border border-outline-variant rounded-full font-label-mono text-label-mono text-on-surface bg-surface hover:bg-surface-variant active:border-primary transition-colors"
                >
                  {tab === 'usd' ? `${b} $` : `${new Intl.NumberFormat('fr-FR').format(b)} FC`}
                </button>
              ))}
            </div>

            {/* Received input */}
            <div>
              <label className="font-body-md text-body-md text-on-surface-variant block mb-1">
                Montant reçu ({tab === 'usd' ? 'USD' : 'FC'})
              </label>
              <div className="flex items-center border-b-2 border-primary pb-2">
                <input
                  className="w-full bg-transparent font-display-price text-headline-lg text-primary outline-none border-none p-0 focus:ring-0"
                  readOnly
                  type="text"
                  value={formatInputDisplay(digits, payCurrency)}
                  aria-label="Montant reçu"
                />
                <button
                  type="button"
                  onClick={backspace}
                  className="p-2 text-on-surface-variant active:text-primary"
                  aria-label="Effacer"
                >
                  <span className="material-symbols-outlined">backspace</span>
                </button>
              </div>
            </div>

            {/* Change */}
            <div
              className={`rounded-lg p-margin-mobile flex justify-between items-center border ${
                cashReceived === 0
                  ? 'bg-surface-container border-outline-variant'
                  : enoughCash
                    ? 'bg-primary-fixed border-primary-fixed-dim'
                    : 'bg-error-container border-error'
              }`}
            >
              <span
                className={`font-headline-md text-body-lg ${
                  cashReceived === 0
                    ? 'text-on-surface-variant'
                    : enoughCash
                      ? 'text-on-primary-fixed'
                      : 'text-on-error-container'
                }`}
              >
                {cashReceived === 0
                  ? 'À rendre'
                  : enoughCash
                    ? 'À rendre'
                    : 'Manque'}
              </span>
              <div className="text-right">
                <span
                  className={`font-display-price text-headline-lg-mobile block ${
                    cashReceived === 0
                      ? 'text-on-surface-variant'
                      : enoughCash
                        ? 'text-on-primary-fixed'
                        : 'text-error'
                  }`}
                >
                  {cashReceived === 0
                    ? '—'
                    : enoughCash
                      ? formatMoney(change, tab === 'usd' ? 'USD' : boutique.currency)
                      : formatMoney(missing, tab === 'usd' ? 'USD' : boutique.currency)}
                </span>
                {enoughCash && change > 0 && changeUsdApprox != null && tab === 'fc' && (
                  <span className="font-label-mono text-label-mono text-on-primary-fixed-variant">
                    ~ {formatMoney(changeUsdApprox, 'USD')}
                  </span>
                )}
                {enoughCash && change > 0 && tab === 'usd' && rateOk && rate && (
                  <span className="font-label-mono text-label-mono text-on-primary-fixed-variant">
                    ~ {formatMoney(roundCdf(usdToCdf(change, rate)), 'CDF')}
                  </span>
                )}
              </div>
            </div>

            {/* Keypad */}
            <div className="grid grid-cols-3 gap-2 pb-2">
              {KEYS.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => pushKey(key)}
                  className={`h-touch-target-min rounded-lg font-headline-lg text-headline-lg transition-all flex items-center justify-center ${
                    key === '00' || key === 'check'
                      ? 'bg-surface-variant border border-outline-variant text-on-surface-variant active:bg-surface-container-high'
                      : 'bg-surface border border-outline-variant text-primary active:bg-surface-variant active:border-primary'
                  }`}
                >
                  {key === 'check' ? (
                    <span className="material-symbols-outlined">check</span>
                  ) : (
                    key
                  )}
                </button>
              ))}
            </div>
          </>
        )}

        {tab === 'mm' && (
          <div className="bg-surface-container-low border border-outline-variant rounded-lg p-stack-md">
            <p className="font-body-md text-body-md text-on-surface-variant">
              Le client paie exactement{' '}
              <strong className="text-on-surface">
                {formatMoney(cart.total, boutique.currency)}
              </strong>{' '}
              via Mobile Money (M-Pesa, Airtel Money…).
            </p>
          </div>
        )}

        {error && (
          <p className="font-body-md text-body-md text-error flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            {error}
          </p>
        )}
      </section>
      </div>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 md:left-[72px] lg:left-[220px] right-0 z-40 bg-surface-container-lowest p-margin-mobile border-t border-outline-variant pb-[max(env(safe-area-inset-bottom),16px)] md:pb-4">
        <button
          type="button"
          disabled={busy || (tab !== 'mm' && !enoughCash)}
          onClick={() => void onPay()}
          className="w-full h-14 bg-secondary text-on-secondary rounded-lg font-headline-md text-headline-md flex items-center justify-center gap-2 active:opacity-90 transition-opacity shadow-sm disabled:opacity-40 max-w-3xl mx-auto"
        >
          <span className="material-symbols-outlined">receipt_long</span>
          {busy
            ? 'Validation…'
            : tab !== 'mm' && enoughCash && change > 0
              ? `Valider · rendre ${formatMoney(change, tab === 'usd' ? 'USD' : boutique.currency)}`
              : 'Valider la vente'}
        </button>
      </footer>
    </div>
  )
}
