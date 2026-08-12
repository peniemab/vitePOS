import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../lib/auth'
import { monthAnalytics, weekAnalytics } from '../lib/services'
import { formatMoney, startOfWeek } from '../lib/utils'
import { cdfToUsd, hasValidUsdRate, roundUsd } from '../lib/fx'
import { canViewReports } from '../lib/roles'
import type { ExpenseCategory } from '../db/types'

type AnalyticsMode = 'month' | 'week'

const EXPENSE_LABELS: Record<ExpenseCategory, string> = {
  transport: 'Transport',
  fournitures: 'Fournitures',
  loyer: 'Loyer',
  communication: 'Communication',
  autres: 'Autres',
}

const WEEKDAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

const BAR_COLORS = [
  'bg-secondary',
  'bg-outline',
  'bg-surface-tint',
  'bg-primary',
  'bg-on-tertiary-container',
]

function formatFcParts(n: number) {
  return new Intl.NumberFormat('fr-FR').format(Math.round(n))
}

function monthTitle(year: number, month: number) {
  const label = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(
    new Date(year, month, 1),
  )
  return label.charAt(0).toUpperCase() + label.slice(1)
}

function weekTitle(from: number, to: number) {
  const start = new Date(from)
  const end = new Date(to)
  const sameMonth = start.getMonth() === end.getMonth()
  const dayFmt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric' })
  const endFmt = new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  const startLabel = sameMonth
    ? dayFmt.format(start)
    : new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' }).format(start)
  return `Semaine du ${startLabel} - ${endFmt.format(end)}`
}

function xAxisLabels(dayCount: number) {
  const marks = new Set([1, 5, 10, 15, 20, 25, dayCount])
  return [...marks].filter((d) => d <= dayCount).sort((a, b) => a - b)
}

function PeriodDelta({
  value,
  positiveIsGood,
  label,
}: {
  value: number | null
  positiveIsGood: boolean
  label: string
}) {
  if (value == null) {
    return (
      <p className="font-label-mono text-label-mono text-on-surface-variant mt-1">
        Pas de référence {label}
      </p>
    )
  }
  const up = value >= 0
  const good = positiveIsGood ? up : !up
  const color = good ? 'text-on-tertiary-container' : 'text-secondary'
  const icon = up ? 'trending_up' : 'trending_down'
  const sign = value > 0 ? '+' : ''
  return (
    <p className={`font-label-mono text-label-mono ${color} mt-1 flex items-center gap-1`}>
      <span className="material-symbols-outlined text-[14px]">{icon}</span>
      {sign}
      {value}% vs {label}
    </p>
  )
}

type Stats = Awaited<ReturnType<typeof monthAnalytics>> | Awaited<ReturnType<typeof weekAnalytics>>

export function AnalyticsPage() {
  const { boutique, user } = useAuth()
  const now = new Date()
  const [mode, setMode] = useState<AnalyticsMode>('month')
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [weekStart, setWeekStart] = useState(() => startOfWeek())
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    if (!boutique) return
    setStats(null)
    const rate = boutique.usdRateCdf || 0
    if (mode === 'month') {
      void monthAnalytics(boutique.id, year, month, rate).then(setStats)
    } else {
      void weekAnalytics(boutique.id, weekStart, rate).then(setStats)
    }
  }, [boutique?.id, boutique?.usdRateCdf, mode, year, month, weekStart])

  const rate = boutique?.usdRateCdf || 0

  if (!boutique) return null
  if (user && !canViewReports(user)) {
    return (
      <p className="font-body-md text-body-md text-on-surface-variant">
        Vous n&apos;avez pas l&apos;autorisation de voir les rapports.
      </p>
    )
  }

  const revenueUsd =
    stats && hasValidUsdRate(rate) ? roundUsd(cdfToUsd(stats.revenueFc, rate)) : null
  const expensesUsd =
    stats && hasValidUsdRate(rate) ? roundUsd(cdfToUsd(stats.expensesFc, rate)) : null

  const maxDaily = useMemo(() => {
    if (!stats) return 1
    return Math.max(1, ...stats.dailyRevenue)
  }, [stats])

  const yTicks = useMemo(() => {
    const top = Math.ceil(maxDaily / 50_000) * 50_000 || 50_000
    return [top, Math.round(top * (2 / 3)), Math.round(top / 3), 0]
  }, [maxDaily])

  function shiftMonth(delta: number) {
    const d = new Date(year, month + delta, 1)
    setYear(d.getFullYear())
    setMonth(d.getMonth())
  }

  function shiftWeek(delta: number) {
    setWeekStart((prev) => startOfWeek(prev + delta * 7 * 24 * 60 * 60 * 1000))
  }

  const canGoNextMonth =
    year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth())
  const canGoNextWeek = weekStart < startOfWeek()

  const compareLabel = mode === 'week' ? 'semaine dernière' : 'mois dernier'
  const emptyPeriodLabel = mode === 'week' ? 'cette semaine' : 'ce mois'

  if (!stats) {
    return <p className="font-body-md text-body-md text-on-surface-variant">Chargement…</p>
  }

  const periodLabel =
    stats.mode === 'week'
      ? weekTitle(stats.from, stats.to)
      : monthTitle(stats.year, stats.month)

  const axis =
    mode === 'week' ? WEEKDAY_LABELS : xAxisLabels(stats.dayCount).map((d) => String(d).padStart(2, '0'))

  return (
    <div className="flex flex-col gap-stack-md max-w-[1200px] mx-auto w-full pb-4">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-primary">analytics</span>
        <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary">
          Analytics
        </h1>
      </div>

      <div className="flex bg-surface-container p-1 rounded-full w-full max-w-md mx-auto">
        <button
          type="button"
          onClick={() => setMode('month')}
          className={`flex-1 py-1 px-4 rounded-full text-label-mono font-semibold transition-colors ${
            mode === 'month'
              ? 'bg-surface-container-lowest text-on-surface shadow-sm'
              : 'text-on-surface-variant hover:bg-surface-container-high'
          }`}
        >
          Mensuel
        </button>
        <button
          type="button"
          onClick={() => setMode('week')}
          className={`flex-1 py-1 px-4 rounded-full text-label-mono font-semibold transition-colors ${
            mode === 'week'
              ? 'bg-surface-container-lowest text-on-surface shadow-sm'
              : 'text-on-surface-variant hover:bg-surface-container-high'
          }`}
        >
          Hebdomadaire
        </button>
      </div>

      <div className="flex items-center justify-between bg-surface-container-lowest p-2 rounded-lg border border-outline-variant">
        <button
          type="button"
          onClick={() => (mode === 'week' ? shiftWeek(-1) : shiftMonth(-1))}
          className="p-2 hover:bg-surface-container-low rounded-lg transition-colors"
          aria-label="Période précédente"
        >
          <span className="material-symbols-outlined text-on-surface-variant">chevron_left</span>
        </button>
        <span className="font-body-md text-body-md text-on-surface font-semibold text-center px-2">
          {periodLabel}
        </span>
        <button
          type="button"
          onClick={() => (mode === 'week' ? shiftWeek(1) : shiftMonth(1))}
          disabled={mode === 'week' ? !canGoNextWeek : !canGoNextMonth}
          className="p-2 hover:bg-surface-container-low rounded-lg transition-colors disabled:opacity-40"
          aria-label="Période suivante"
        >
          <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-stack-md">
        <div className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant flex flex-col gap-stack-sm relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="font-body-md text-body-md text-on-surface-variant">
              Chiffre d&apos;Affaires Total
            </span>
            <span className="material-symbols-outlined text-primary bg-primary-fixed p-1 rounded-full">
              trending_up
            </span>
          </div>
          <div>
            <h2 className="font-display-price text-display-price text-on-surface">
              {formatFcParts(stats.revenueFc)}{' '}
              <span className="font-headline-md text-headline-md text-on-surface-variant">FC</span>
            </h2>
            {revenueUsd != null && (
              <p className="font-label-mono text-label-mono text-on-surface-variant mt-1">
                ≈ {formatMoney(revenueUsd, 'USD')}
              </p>
            )}
            <PeriodDelta value={stats.revenueVsPrev} positiveIsGood label={compareLabel} />
            {stats.mode === 'week' && (
              <PeriodDelta
                value={stats.revenueVsPrevMonth}
                positiveIsGood
                label="mois dernier"
              />
            )}
            <p className="font-label-mono text-label-mono text-on-surface-variant mt-1">
              {stats.saleCount} vente{stats.saleCount > 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant flex flex-col gap-stack-sm">
          <div className="flex justify-between items-start">
            <span className="font-body-md text-body-md text-on-surface-variant">Dépenses Totales</span>
            <span className="material-symbols-outlined text-secondary bg-secondary-fixed p-1 rounded-full">
              trending_down
            </span>
          </div>
          <div>
            <h2 className="font-display-price text-display-price text-on-surface">
              {formatFcParts(stats.expensesFc)}{' '}
              <span className="font-headline-md text-headline-md text-on-surface-variant">FC</span>
            </h2>
            {expensesUsd != null && (
              <p className="font-label-mono text-label-mono text-on-surface-variant mt-1">
                ≈ {formatMoney(expensesUsd, 'USD')}
              </p>
            )}
            <PeriodDelta
              value={stats.expensesVsPrev}
              positiveIsGood={false}
              label={compareLabel}
            />
            {stats.mode === 'week' && (
              <PeriodDelta
                value={stats.expensesVsPrevMonth}
                positiveIsGood={false}
                label="mois dernier"
              />
            )}
          </div>
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant min-h-[300px] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-headline-md text-headline-md text-on-surface">Tendance des Ventes</h3>
          <span className="font-label-mono text-label-mono text-on-surface-variant px-2 py-1 bg-surface-container rounded">
            {mode === 'week' ? 'Par Semaine' : 'Par Jour'}
          </span>
        </div>
        <div className="flex-1 flex items-end justify-between gap-1 pt-4 border-l border-b border-outline-variant relative pl-10 min-h-[200px]">
          <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-[10px] text-on-surface-variant font-label-mono w-9 text-right pr-1">
            {yTicks.map((t) => (
              <span key={t}>{t >= 1000 ? `${Math.round(t / 1000)}k` : t}</span>
            ))}
          </div>
          <div
            className={`w-full flex items-end h-[200px] ${
              mode === 'week' ? 'justify-between gap-2' : 'justify-between gap-px'
            }`}
          >
            {stats.dailyRevenue.map((value, i) => {
              const pct = Math.max(value > 0 ? 4 : 0, Math.round((value / maxDaily) * 100))
              const isPeak = value === maxDaily && value > 0
              const barLabel =
                mode === 'week'
                  ? WEEKDAY_LABELS[i]
                  : String(i + 1).padStart(2, '0')
              return (
                <div
                  key={i}
                  title={`${barLabel} · ${formatFcParts(value)} FC`}
                  className={`flex-1 min-w-0 rounded-t-sm transition-opacity hover:opacity-100 relative group ${
                    mode === 'week' ? 'max-w-[14%]' : ''
                  } ${isPeak ? 'bg-primary opacity-80' : 'bg-primary opacity-20'}`}
                  style={{ height: `${pct}%` }}
                >
                  {value > 0 && (
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-inverse-surface text-inverse-on-surface text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity font-label-mono whitespace-nowrap z-10 pointer-events-none">
                      {formatFcParts(value)} FC
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
        <div className="flex justify-between text-[10px] text-on-surface-variant font-label-mono mt-2 pl-10">
          {axis.map((d, i) => (
            <span key={`${d}-${i}`}>{d}</span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-stack-md">
        <div className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant">
          <h3 className="font-headline-md text-headline-md text-on-surface mb-4">Meilleurs Produits</h3>
          <div className="flex flex-col gap-2">
            {stats.topProducts.length === 0 && (
              <p className="font-body-md text-body-md text-on-surface-variant">
                Aucune vente {emptyPeriodLabel}.
              </p>
            )}
            {stats.topProducts.map((p, i) => (
              <div
                key={`${p.name}-${i}`}
                className="flex justify-between items-center p-3 bg-surface rounded-lg hover:bg-surface-container-high transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 bg-surface-variant rounded-md flex items-center justify-center text-on-surface-variant font-bold shrink-0">
                    {i + 1}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-body-lg text-body-lg text-on-surface truncate">{p.name}</h4>
                    <p className="font-label-mono text-label-mono text-on-surface-variant">
                      {p.qty} vendu{p.qty > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <span className="font-headline-md text-headline-md text-on-surface block">
                    {formatFcParts(p.revenue)}
                  </span>
                  <span className="font-label-mono text-label-mono text-on-surface-variant">FC</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant">
          <h3 className="font-headline-md text-headline-md text-on-surface mb-4">
            Répartition Dépenses
          </h3>
          <div className="flex flex-col gap-4">
            {stats.expenseBreakdown.length === 0 && (
              <p className="font-body-md text-body-md text-on-surface-variant">
                Aucune dépense {emptyPeriodLabel}.
              </p>
            )}
            {stats.expenseBreakdown.map((row, i) => (
              <div key={row.category}>
                <div className="flex justify-between items-end mb-1 gap-2">
                  <span className="font-body-lg text-body-lg text-on-surface">
                    {EXPENSE_LABELS[row.category as ExpenseCategory] || row.category}
                  </span>
                  <span className="font-body-md text-body-md text-on-surface-variant shrink-0">
                    {formatFcParts(row.amount)} FC ({row.percent}%)
                  </span>
                </div>
                <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                  <div
                    className={`${BAR_COLORS[i % BAR_COLORS.length]} h-full rounded-full`}
                    style={{ width: `${Math.max(row.percent, row.amount > 0 ? 2 : 0)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
