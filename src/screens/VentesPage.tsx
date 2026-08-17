import { useDeferredValue, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import type { Sale } from '../db/types'
import { useAuth } from '../lib/auth'
import { formatDate, formatMoney, startOfDay, endOfDay } from '../lib/utils'
import { cdfToUsd, hasValidUsdRate, roundUsd } from '../lib/fx'

type Period = 'today' | 'yesterday' | 'week' | 'custom'

function periodBounds(period: Period, customDate?: string) {
  const now = Date.now()
  if (period === 'today') return { from: startOfDay(now), to: endOfDay(now) }
  if (period === 'yesterday') {
    const y = now - 24 * 60 * 60 * 1000
    return { from: startOfDay(y), to: endOfDay(y) }
  }
  if (period === 'week') {
    const d = new Date()
    const day = (d.getDay() + 6) % 7 // Monday = 0
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() - day)
    return { from: d.getTime(), to: endOfDay(now) }
  }
  if (customDate) {
    const t = new Date(customDate + 'T12:00:00').getTime()
    return { from: startOfDay(t), to: endOfDay(t) }
  }
  return { from: startOfDay(now), to: endOfDay(now) }
}

function formatTime(ts: number) {
  return new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(
    new Date(ts),
  )
}

function formatFcAmount(n: number) {
  return new Intl.NumberFormat('fr-FR').format(Math.round(n))
}

function payIcon(method: Sale['paymentMethod'], payCurrency?: string) {
  if (method === 'mobile_money') return 'smartphone'
  if (method === 'mixte') return 'account_balance_wallet'
  if (payCurrency === 'USD') return 'attach_money'
  return 'payments'
}

function payLabel(s: Sale) {
  if (s.paymentMethod === 'mobile_money') return 'M-Money'
  if (s.paymentMethod === 'mixte') return 'Mixte'
  if (s.payCurrency === 'USD') return 'Espèces USD'
  return 'Espèces'
}

export function VentesPage() {
  const { boutique } = useAuth()
  const [period, setPeriod] = useState<Period>('today')
  const [customDate, setCustomDate] = useState('')
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [q, setQ] = useState('')
  const deferredQ = useDeferredValue(q)
  const [summaryOpen, setSummaryOpen] = useState(false)

  const sales = useLiveQuery(
    () =>
      boutique
        ? db.sales.where('boutiqueId').equals(boutique.id).reverse().sortBy('createdAt')
        : [],
    [boutique?.id],
  )
  const clients = useLiveQuery(
    () => (boutique ? db.clients.where('boutiqueId').equals(boutique.id).toArray() : []),
    [boutique?.id],
  )

  const clientMap = useMemo(() => {
    const m = new Map<string, string>()
    for (const c of clients || []) m.set(c.id, c.name)
    return m
  }, [clients])

  const bounds = useMemo(
    () => periodBounds(period, customDate || undefined),
    [period, customDate],
  )

  const filtered = useMemo(() => {
    const list = (sales || []).filter(
      (s) => s.createdAt >= bounds.from && s.createdAt <= bounds.to,
    )
    const query = deferredQ.trim().toLowerCase()
    if (!query) return list
    return list.filter((s) => {
      const ticket = s.id.slice(-4).toLowerCase()
      const client = s.clientId ? (clientMap.get(s.clientId) || '').toLowerCase() : 'passant'
      return ticket.includes(query) || client.includes(query) || s.id.toLowerCase().includes(query)
    })
  }, [sales, bounds, deferredQ, clientMap])

  const summary = useMemo(() => {
    let ca = 0
    let cash = 0
    let mobile = 0
    for (const s of filtered) {
      if (s.status !== 'validee') continue
      ca += s.total
      for (const p of s.payments || []) {
        if (p.method === 'especes') cash += p.amount
        if (p.method === 'mobile_money') mobile += p.amount
      }
    }
    return { ca, cash, mobile, count: filtered.filter((s) => s.status === 'validee').length }
  }, [filtered])

  const rate = boutique?.usdRateCdf
  const usdApprox =
    hasValidUsdRate(rate) && boutique?.currency === 'CDF'
      ? roundUsd(cdfToUsd(summary.ca, rate!))
      : null

  const periodTitle = useMemo(() => {
    if (period === 'today') return `Aujourd'hui, ${formatDate(Date.now())}`
    if (period === 'yesterday') return `Hier, ${formatDate(Date.now() - 86400000)}`
    if (period === 'week') return 'Cette semaine'
    if (customDate) return formatDate(new Date(customDate + 'T12:00:00').getTime())
    return 'Période'
  }, [period, customDate])

  if (!boutique) return null

  const chips: Array<{ id: Period; label: string; icon?: string }> = [
    { id: 'today', label: "Aujourd'hui" },
    { id: 'yesterday', label: 'Hier' },
    { id: 'week', label: 'Cette semaine' },
    { id: 'custom', label: 'Date', icon: 'calendar_month' },
  ]

  return (
    <div className="flex flex-col md:flex-row gap-0 md:gap-0 -mx-margin-mobile md:-mx-margin-desktop w-[calc(100%+24px)] md:w-[calc(100%+48px)] max-w-none min-h-[calc(100vh-8rem)]">
      {/* Left: filters + summary */}
      <section className="w-full md:w-[400px] lg:w-[420px] shrink-0 bg-surface flex flex-col md:border-r border-outline-variant">
        <div className="p-margin-mobile md:p-margin-desktop flex flex-col gap-stack-md border-b border-outline-variant bg-surface-container-lowest">
          <div className="flex items-center justify-between">
            <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface">
              Historique
            </h2>
            <button
              type="button"
              className="md:hidden flex items-center justify-center w-touch-target-min h-touch-target-min rounded-full bg-surface-container hover:bg-surface-container-high"
              onClick={() => setSummaryOpen((v) => !v)}
              aria-label="Résumé"
            >
              <span className="material-symbols-outlined">filter_list</span>
            </button>
          </div>

          <div className="relative w-full">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">
              search
            </span>
            <input
              className="w-full h-[48px] pl-11 pr-4 bg-surface-container-low border border-outline-variant rounded-lg font-body-lg text-body-lg text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="N° Ticket ou Client"
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-stack-sm overflow-x-auto no-scrollbar pb-1">
            {chips.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  if (c.id === 'custom') {
                    setShowDatePicker(true)
                    setPeriod('custom')
                  } else {
                    setShowDatePicker(false)
                    setPeriod(c.id)
                  }
                }}
                className={`shrink-0 h-8 px-4 rounded-full font-label-mono text-label-mono border transition-colors flex items-center gap-1 ${
                  period === c.id
                    ? 'bg-primary-container text-on-primary-container border-transparent'
                    : 'bg-surface text-on-surface-variant border-outline-variant hover:bg-surface-container-low'
                }`}
              >
                {c.icon && (
                  <span className="material-symbols-outlined text-[16px]">{c.icon}</span>
                )}
                {c.label}
              </button>
            ))}
          </div>

          {showDatePicker && (
            <input
              type="date"
              className="bl-input"
              value={customDate}
              onChange={(e) => {
                setCustomDate(e.target.value)
                setPeriod('custom')
              }}
            />
          )}
        </div>

        <div
          className={`${summaryOpen ? 'flex' : 'hidden'} md:flex flex-col p-margin-mobile md:p-margin-desktop bg-surface-container-low border-b border-outline-variant gap-stack-sm`}
        >
          <span className="font-label-mono text-label-mono text-on-surface-variant uppercase">
            Total période
          </span>
          <div className="flex items-baseline gap-2">
            <span className="font-display-price text-display-price text-primary">
              {formatFcAmount(summary.ca)}
            </span>
            <span className="font-headline-md text-headline-md text-on-surface-variant">
              {boutique.currency === 'CDF' ? 'FC' : boutique.currency}
            </span>
          </div>
          {usdApprox != null && (
            <span className="font-label-mono text-label-mono text-on-surface-variant">
              ≈ {formatMoney(usdApprox, 'USD')}
              {rate ? ` (Taux: ${formatFcAmount(rate)})` : ''}
            </span>
          )}
          <div className="flex items-center gap-4 mt-stack-sm pt-stack-sm border-t border-outline-variant">
            <div className="flex-1">
              <span className="block font-label-mono text-label-mono text-on-surface-variant">
                Espèces
              </span>
              <span className="block font-body-lg text-body-lg font-semibold text-on-surface">
                {formatMoney(summary.cash, boutique.currency)}
              </span>
            </div>
            <div className="w-px h-8 bg-outline-variant" />
            <div className="flex-1">
              <span className="block font-label-mono text-label-mono text-on-surface-variant">
                Mobile
              </span>
              <span className="block font-body-lg text-body-lg font-semibold text-on-surface">
                {formatMoney(summary.mobile, boutique.currency)}
              </span>
            </div>
          </div>
          <p className="font-label-mono text-label-mono text-on-surface-variant">
            {summary.count} vente{summary.count !== 1 ? 's' : ''} validée
            {summary.count !== 1 ? 's' : ''}
          </p>
        </div>
      </section>

      {/* Right: list */}
      <section className="flex-1 flex flex-col bg-surface-container-lowest relative overflow-hidden min-h-[50vh]">
        <div className="flex-1 overflow-y-auto p-margin-mobile md:p-margin-desktop pb-28 md:pb-margin-desktop">
          <h3 className="font-label-mono text-label-mono text-on-surface-variant uppercase mb-stack-md sticky top-0 bg-surface-container-lowest/90 backdrop-blur-sm py-2 z-10 border-b border-outline-variant">
            {periodTitle}
          </h3>

          <div className="flex flex-col gap-base">
            {filtered.map((s) => {
              const voided = s.status === 'annulee'
              const usd =
                s.payCurrency === 'USD' && s.totalInPayCurrency != null
                  ? s.totalInPayCurrency
                  : hasValidUsdRate(rate)
                    ? roundUsd(cdfToUsd(s.total, rate!))
                    : null
              return (
                <Link
                  key={s.id}
                  to={`/ticket/${s.id}`}
                  className={`w-full bg-surface border border-outline-variant rounded-lg p-3 md:p-4 flex flex-col hover:bg-surface-container-low active:bg-surface-container active:border-primary transition-all text-left focus:outline-none focus:ring-2 focus:ring-primary ${
                    voided ? 'opacity-75 bg-surface-container-lowest' : ''
                  }`}
                >
                  <div className="flex justify-between items-start w-full mb-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-label-mono text-label-mono text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded ${
                          voided ? 'line-through' : ''
                        }`}
                      >
                        #{s.id.slice(-4).toUpperCase()}
                      </span>
                      <span className="font-label-mono text-label-mono text-on-surface-variant">
                        {formatTime(s.createdAt)}
                      </span>
                    </div>
                    {voided ? (
                      <div className="flex items-center gap-1 text-error bg-error-container px-2 py-0.5 rounded">
                        <span className="material-symbols-outlined text-[14px]">cancel</span>
                        <span className="font-label-mono text-label-mono">Annulé</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-tertiary-container bg-tertiary-fixed-dim/20 px-2 py-0.5 rounded">
                        <span className="material-symbols-outlined text-[14px]">check_circle</span>
                        <span className="font-label-mono text-label-mono">Validé</span>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between items-end w-full mt-2">
                    <div className="flex flex-col min-w-0">
                      <span className="font-body-md text-body-md text-on-surface-variant line-clamp-1">
                        Client:{' '}
                        {s.clientId ? clientMap.get(s.clientId) || '—' : 'Passant'}
                      </span>
                      <div className="flex items-center gap-1 mt-1 text-on-surface-variant">
                        <span className="material-symbols-outlined text-[16px]">
                          {payIcon(s.paymentMethod, s.payCurrency)}
                        </span>
                        <span className="font-label-mono text-label-mono">{payLabel(s)}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end text-right shrink-0">
                      <div
                        className={`font-headline-md text-headline-md ${
                          voided ? 'text-on-surface-variant line-through' : 'text-on-surface'
                        }`}
                      >
                        {formatFcAmount(s.total)}{' '}
                        <span className="text-body-md font-normal">
                          {boutique.currency === 'CDF' ? 'FC' : boutique.currency}
                        </span>
                      </div>
                      {usd != null && (
                        <div
                          className={`font-label-mono text-label-mono text-on-surface-variant ${
                            voided ? 'line-through' : ''
                          }`}
                        >
                          ≈ {formatMoney(usd, 'USD')}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}

            {!filtered.length && (
              <p className="py-12 text-center font-body-md text-body-md text-on-surface-variant">
                Aucune vente sur cette période.
              </p>
            )}
          </div>
        </div>

        {/* Mobile floating summary */}
        <div className="md:hidden absolute bottom-0 left-0 w-full bg-surface-container-high border-t border-outline-variant p-margin-mobile shadow-[0_-4px_12px_rgba(0,0,0,0.05)] pb-[max(env(safe-area-inset-bottom),12px)]">
          <div className="flex justify-between items-end">
            <div className="flex flex-col">
              <span className="font-label-mono text-label-mono text-on-surface-variant uppercase">
                Total période
              </span>
              <div className="flex items-baseline gap-1">
                <span className="font-headline-lg-mobile text-headline-lg-mobile text-primary">
                  {formatFcAmount(summary.ca)}
                </span>
                <span className="font-body-md text-body-md font-semibold text-on-surface-variant">
                  FC
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSummaryOpen(true)}
              className="h-10 px-4 bg-primary text-on-primary rounded-lg font-label-mono text-label-mono active:scale-95 transition-transform flex items-center gap-2 shadow-sm"
            >
              <span>Détails</span>
              <span className="material-symbols-outlined text-[18px]">receipt_long</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
