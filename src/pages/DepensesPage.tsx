import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import type { Expense, ExpenseCategory, PayCurrency } from '../db/types'
import { useAuth } from '../lib/auth'
import { createExpense } from '../lib/services'
import { formatMoney, startOfDay } from '../lib/utils'
import { cdfToUsd, hasValidUsdRate, roundUsd, usdToCdf } from '../lib/fx'

const CATEGORIES: { value: ExpenseCategory; label: string; icon: string }[] = [
  { value: 'transport', label: 'Transport', icon: 'local_taxi' },
  { value: 'fournitures', label: 'Fournitures', icon: 'inventory' },
  { value: 'loyer', label: 'Loyer', icon: 'home' },
  { value: 'communication', label: 'Communication (Unités)', icon: 'cell_tower' },
  { value: 'autres', label: 'Autres', icon: 'receipt_long' },
]

const CATEGORY_META: Record<ExpenseCategory, { label: string; icon: string }> = Object.fromEntries(
  CATEGORIES.map((c) => [c.value, { label: c.label.replace(' (Unités)', ''), icon: c.icon }]),
) as Record<ExpenseCategory, { label: string; icon: string }>

function formatFc(n: number) {
  return `${new Intl.NumberFormat('fr-FR').format(Math.round(n))} FC`
}

function whenLabel(ts: number) {
  const start = startOfDay()
  const yesterday = start - 24 * 60 * 60 * 1000
  if (ts >= start) {
    return new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(
      new Date(ts),
    )
  }
  if (ts >= yesterday) return 'Hier'
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' }).format(new Date(ts))
}

function expenseTitle(e: Expense) {
  if (e.description?.trim()) return e.description.trim()
  return CATEGORY_META[e.category]?.label || e.category
}

export function DepensesPage() {
  const { boutique, user } = useAuth()
  const expenses = useLiveQuery(
    () =>
      boutique
        ? db.expenses.where('boutiqueId').equals(boutique.id).reverse().sortBy('createdAt')
        : [],
    [boutique?.id],
  )

  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState<PayCurrency>('CDF')
  const [category, setCategory] = useState<ExpenseCategory | ''>('')
  const [description, setDescription] = useState('')
  const [showAll, setShowAll] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')

  const rate = boutique?.usdRateCdf || 0

  const todayTotalFc = useMemo(() => {
    const from = startOfDay()
    let total = 0
    for (const e of expenses || []) {
      if (e.createdAt < from) continue
      if (e.currency === 'USD') {
        total += hasValidUsdRate(rate) ? usdToCdf(e.amount, rate) : 0
      } else {
        total += e.amount
      }
    }
    return total
  }, [expenses, rate])

  const todayUsdApprox =
    hasValidUsdRate(rate) && todayTotalFc > 0 ? roundUsd(cdfToUsd(todayTotalFc, rate)) : null

  const visible = useMemo(() => {
    const rows = expenses || []
    return showAll ? rows : rows.slice(0, 12)
  }, [expenses, showAll])

  if (!boutique || !user) return null

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setMsg('')
    if (!category) {
      setError('Choisissez une catégorie')
      return
    }
    const n = Number(amount)
    if (!(n > 0)) {
      setError('Montant invalide')
      return
    }
    setBusy(true)
    try {
      await createExpense({
        boutiqueId: boutique!.id,
        userId: user!.id,
        amount: n,
        currency,
        category,
        description,
      })
      setAmount('')
      setCategory('')
      setDescription('')
      setMsg('Dépense enregistrée')
    } catch (err) {
      setError(String((err as Error).message || err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col md:flex-row gap-6 pb-4">
      <div className="w-full md:w-5/12 flex flex-col gap-6">
        <section className="bg-surface-container-low rounded-xl p-6 border border-outline-variant flex flex-col gap-2">
          <h2 className="text-on-surface-variant font-body-md text-body-md uppercase tracking-wider">
            Total Dépenses Aujourd&apos;hui
          </h2>
          <div className="flex flex-col">
            <span className="font-display-price text-display-price text-primary">
              {formatFc(todayTotalFc)}
            </span>
            {todayUsdApprox != null && (
              <span className="font-body-lg text-body-lg text-on-surface-variant mt-1">
                ≈ {formatMoney(todayUsdApprox, 'USD')}
              </span>
            )}
          </div>
        </section>

        <section className="bg-surface-container-lowest rounded-xl p-6 border border-outline-variant flex flex-col gap-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
          <h2 className="font-headline-md text-headline-md text-primary mb-2 flex items-center gap-2">
            <span className="material-symbols-outlined">add_circle</span>
            Nouvelle Dépense
          </h2>
          <form className="flex flex-col gap-4" onSubmit={onSubmit}>
            <div className="flex flex-col gap-1">
              <label className="font-label-mono text-label-mono text-on-surface-variant" htmlFor="exp-amount">
                Montant
              </label>
              <div className="flex relative rounded-lg overflow-hidden border border-outline-variant focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
                <input
                  id="exp-amount"
                  type="number"
                  min={0}
                  step={currency === 'USD' ? 0.01 : 1}
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  onFocus={(e) => e.currentTarget.select()}
                  placeholder="0.00"
                  className="w-full h-14 pl-4 pr-20 text-lg border-none focus:ring-0 bg-transparent text-primary font-bold outline-none"
                />
                <div className="absolute right-0 top-0 bottom-0 w-20 bg-surface-container flex border-l border-outline-variant">
                  <select
                    aria-label="Devise"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as PayCurrency)}
                    className="w-full h-full bg-transparent border-none focus:ring-0 text-sm font-bold text-primary cursor-pointer appearance-none px-3 text-center outline-none"
                  >
                    <option value="CDF">FC</option>
                    <option value="USD">USD</option>
                  </select>
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                    <span className="material-symbols-outlined text-sm">arrow_drop_down</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-label-mono text-label-mono text-on-surface-variant" htmlFor="exp-cat">
                Catégorie
              </label>
              <div className="relative">
                <select
                  id="exp-cat"
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ExpenseCategory | '')}
                  className="w-full h-14 pl-4 pr-10 rounded-lg border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary bg-transparent text-primary appearance-none cursor-pointer outline-none"
                >
                  <option disabled value="">
                    Sélectionner…
                  </option>
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">
                  <span className="material-symbols-outlined">category</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-label-mono text-label-mono text-on-surface-variant" htmlFor="exp-desc">
                Description (Optionnel)
              </label>
              <input
                id="exp-desc"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Taxi marché central"
                className="w-full h-14 px-4 rounded-lg border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary bg-transparent text-primary outline-none"
              />
            </div>

            {error && <p className="font-body-md text-body-md text-error">{error}</p>}
            {msg && <p className="font-body-md text-body-md text-on-tertiary-container">{msg}</p>}

            <button
              type="submit"
              disabled={busy}
              className="w-full h-14 bg-primary text-on-primary rounded-lg font-headline-lg-mobile text-headline-lg-mobile flex items-center justify-center gap-2 mt-2 active:scale-[0.98] transition-transform disabled:opacity-60"
            >
              Enregistrer
              <span className="material-symbols-outlined text-lg">check</span>
            </button>
          </form>
        </section>
      </div>

      <div className="w-full md:w-7/12 flex flex-col gap-4">
        <div className="flex justify-between items-end mb-2">
          <h2 className="font-headline-md text-headline-md text-primary">Dépenses Récentes</h2>
          {(expenses || []).length > 12 && (
            <button
              type="button"
              onClick={() => setShowAll((v) => !v)}
              className="text-primary-container text-sm font-bold flex items-center gap-1 hover:underline"
            >
              {showAll ? 'Réduire' : 'Tout voir'}
              <span className="material-symbols-outlined text-sm">
                {showAll ? 'expand_less' : 'arrow_forward'}
              </span>
            </button>
          )}
        </div>

        <div className="flex flex-col gap-0 border border-outline-variant rounded-xl bg-surface-container-lowest overflow-hidden">
          {visible.length === 0 && (
            <p className="p-4 font-body-md text-body-md text-on-surface-variant">
              Aucune dépense enregistrée.
            </p>
          )}
          {visible.map((e, i) => {
            const meta = CATEGORY_META[e.category]
            return (
              <div
                key={e.id}
                className={`flex items-center justify-between p-4 hover:bg-surface-container-low transition-colors ${
                  i < visible.length - 1 ? 'border-b border-surface-variant' : ''
                }`}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant shrink-0">
                    <span className="material-symbols-outlined">{meta?.icon || 'payments'}</span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-primary truncate">{expenseTitle(e)}</span>
                    <span className="font-label-mono text-label-mono text-on-surface-variant">
                      {meta?.label || e.category} • {whenLabel(e.createdAt)}
                    </span>
                  </div>
                </div>
                <div className="font-headline-md text-headline-md text-error shrink-0 ml-3">
                  − {formatMoney(e.amount, e.currency === 'USD' ? 'USD' : 'CDF')}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
