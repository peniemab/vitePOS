import { useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { useAuth } from '../lib/auth'
import { formatDate, formatDateTime, formatMoney } from '../lib/utils'
import { cdfToUsd, hasValidUsdRate, roundUsd, usdToCdf } from '../lib/fx'

function formatFc(n: number) {
  return new Intl.NumberFormat('fr-FR').format(Math.round(n))
}

export function RapportJournalierPage() {
  const { sessionId } = useParams()
  const { boutique, user } = useAuth()
  const navigate = useNavigate()

  const session = useLiveQuery(async () => {
    if (!boutique) return undefined
    if (sessionId) return db.cashSessions.get(sessionId)
    return db.cashSessions
      .where('boutiqueId')
      .equals(boutique.id)
      .filter((s) => s.status === 'cloturee')
      .reverse()
      .sortBy('closedAt')
      .then((rows) => rows[0])
  }, [boutique?.id, sessionId])

  const closer = useLiveQuery(
    () => (session?.closedBy ? db.users.get(session.closedBy) : undefined),
    [session?.closedBy],
  )
  const opener = useLiveQuery(
    () => (session?.openedBy ? db.users.get(session.openedBy) : undefined),
    [session?.openedBy],
  )

  const sales = useLiveQuery(
    () =>
      boutique && session
        ? db.sales
            .where('boutiqueId')
            .equals(boutique.id)
            .filter((s) => s.status === 'validee' && s.cashSessionId === session.id)
            .toArray()
        : [],
    [boutique?.id, session?.id],
  )

  const report = useMemo(() => {
    const list = sales || []
    let ca = 0
    let cashFc = 0
    let cashUsd = 0
    let mobile = 0
    let countCashFc = 0
    let countCashUsd = 0
    let countMobile = 0

    for (const s of list) {
      ca += s.total
      let hasCashFc = false
      let hasCashUsd = false
      let hasMm = false
      for (const p of s.payments || []) {
        if (p.method === 'mobile_money') {
          mobile += p.amount
          hasMm = true
        } else if (p.method === 'especes') {
          if (s.payCurrency === 'USD') {
            cashUsd += s.totalInPayCurrency ?? p.amount
            hasCashUsd = true
          } else {
            cashFc += p.amount
            hasCashFc = true
          }
        }
      }
      if (hasCashFc) countCashFc++
      if (hasCashUsd) countCashUsd++
      if (hasMm) countMobile++
    }

    return {
      ca,
      count: list.length,
      cashFc,
      cashUsd,
      mobile,
      countCashFc,
      countCashUsd,
      countMobile,
    }
  }, [sales])

  if (!boutique || !user) return null

  if (session === undefined) {
    return (
      <p className="font-body-md text-body-md text-on-surface-variant text-center py-12">
        Chargement…
      </p>
    )
  }

  if (!session || session.status !== 'cloturee') {
    return (
      <div className="max-w-lg mx-auto text-center py-12 flex flex-col gap-4">
        <p className="font-body-md text-body-md text-on-surface-variant">
          Aucun rapport de clôture disponible.
        </p>
        <Link
          to="/journee"
          className="h-12 px-6 bg-primary text-on-primary rounded-lg font-headline-md text-headline-md inline-flex items-center justify-center"
        >
          Aller à la clôture
        </Link>
      </div>
    )
  }

  const rate = boutique.usdRateCdf
  const caUsd =
    hasValidUsdRate(rate) ? roundUsd(cdfToUsd(report.ca, rate!)) : null
  const mobileUsd =
    hasValidUsdRate(rate) ? roundUsd(cdfToUsd(report.mobile, rate!)) : null

  const expectedFc = session.expectedCash ?? 0
  const countedFc = session.closingCashCounted ?? 0
  const varianceFc = session.cashVariance ?? countedFc - expectedFc
  const expectedUsd = session.expectedCashUsd ?? 0
  const countedUsd = session.closingCashCountedUsd ?? 0
  const varianceUsd = session.cashVarianceUsd ?? countedUsd - expectedUsd

  const docId = `DOC-${formatDate(session.closedAt || session.openedAt)
    .replace(/\s/g, '')
    .slice(0, 10)}-${session.id.slice(-4).toUpperCase()}`

  const operator = closer || opener
  const printedAt = formatDateTime(Date.now())

  return (
    <div className="rapport-print-root -mx-margin-mobile md:-mx-margin-desktop bg-surface-container-low min-h-[calc(100vh-6rem)] flex flex-col items-center pb-24 md:pb-8 pt-2">
      {/* Desktop / mobile print actions */}
      <div className="no-print w-full max-w-[800px] px-margin-mobile md:px-0 mb-3 flex gap-2 justify-end">
        <button
          type="button"
          onClick={() => navigate('/journee')}
          className="h-10 px-4 border border-outline-variant rounded-lg font-body-md text-body-md bg-surface"
        >
          Retour
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          className="h-10 px-4 bg-primary text-on-primary rounded-lg font-body-md text-body-md flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-lg">print</span>
          Imprimer / PDF
        </button>
      </div>

      {/* Document */}
      <main
        id="daily-report"
        className="w-full max-w-[800px] bg-surface-container-lowest border border-outline-variant md:shadow-sm"
      >
        <div className="p-gutter md:p-margin-desktop border-b-2 border-primary">
          <div className="flex justify-between items-start mb-6 gap-4">
            <div>
              <h2 className="font-headline-lg-mobile md:font-headline-lg text-primary uppercase tracking-wide">
                Rapport Journalier de Clôture
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant mt-1">
                {boutique.name}
              </p>
            </div>
            <div className="text-right shrink-0">
              <div className="font-label-mono text-label-mono text-on-surface-variant bg-surface-container px-2 py-1 rounded inline-block">
                {docId}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 bg-surface-container-low p-4 rounded border border-outline-variant">
            <div>
              <p className="font-label-mono text-label-mono text-on-surface-variant uppercase">
                Date du Rapport
              </p>
              <p className="font-headline-md text-headline-md font-semibold text-primary mt-1">
                {formatDate(session.closedAt || session.openedAt)}
              </p>
            </div>
            <div>
              <p className="font-label-mono text-label-mono text-on-surface-variant uppercase">
                Opérateur
              </p>
              <p className="font-body-lg text-body-lg font-semibold text-on-surface mt-1">
                {operator?.name || user.name}
              </p>
            </div>
          </div>
        </div>

        <div className="p-gutter md:p-margin-desktop space-y-8">
          {/* Performance */}
          <section>
            <h3 className="font-headline-md text-headline-md text-primary border-b border-outline-variant pb-2 mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined">monitoring</span>
              Performance Globale
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-surface p-4 rounded border border-outline-variant">
                <p className="font-label-mono text-label-mono text-on-surface-variant uppercase">
                  Chiffre d&apos;Affaires (FC)
                </p>
                <p className="font-display-price text-display-price text-primary mt-2 text-[28px] leading-tight">
                  {formatFc(report.ca)}
                </p>
              </div>
              <div className="bg-surface p-4 rounded border border-outline-variant">
                <p className="font-label-mono text-label-mono text-on-surface-variant uppercase">
                  Chiffre d&apos;Affaires (USD)
                </p>
                <p className="font-display-price text-display-price text-primary mt-2 text-[28px] leading-tight">
                  {caUsd != null ? formatMoney(caUsd, 'USD') : '—'}
                </p>
              </div>
              <div className="bg-surface p-4 rounded border border-outline-variant">
                <p className="font-label-mono text-label-mono text-on-surface-variant uppercase">
                  Transactions
                </p>
                <p className="font-headline-lg-mobile md:font-headline-lg text-on-surface mt-2">
                  {session.ticketCount ?? report.count}
                </p>
              </div>
            </div>
          </section>

          {/* Payment breakdown */}
          <section>
            <h3 className="font-headline-md text-headline-md text-primary border-b border-outline-variant pb-2 mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined">account_balance_wallet</span>
              Répartition par Moyen de Paiement
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-highest font-label-mono text-label-mono text-on-surface-variant uppercase border-y border-outline-variant">
                    <th className="p-3">Méthode</th>
                    <th className="p-3 text-right">Volume</th>
                    <th className="p-3 text-right">Montant Total</th>
                  </tr>
                </thead>
                <tbody className="font-label-mono text-label-mono text-on-surface">
                  <tr className="border-b border-outline-variant">
                    <td className="p-3">
                      <span className="flex items-center gap-2 font-body-md text-body-md font-semibold">
                        <span className="material-symbols-outlined text-on-surface-variant">
                          payments
                        </span>
                        Espèces FC
                      </span>
                    </td>
                    <td className="p-3 text-right">{report.countCashFc}</td>
                    <td className="p-3 text-right font-bold">
                      {formatMoney(report.cashFc, 'CDF')}
                    </td>
                  </tr>
                  <tr className="border-b border-outline-variant">
                    <td className="p-3">
                      <span className="flex items-center gap-2 font-body-md text-body-md font-semibold">
                        <span className="material-symbols-outlined text-on-surface-variant">
                          attach_money
                        </span>
                        Espèces USD
                      </span>
                    </td>
                    <td className="p-3 text-right">{report.countCashUsd}</td>
                    <td className="p-3 text-right font-bold">
                      {formatMoney(report.cashUsd, 'USD')}
                      {hasValidUsdRate(rate) && report.cashUsd > 0 && (
                        <span className="block text-on-surface-variant text-[10px] font-normal">
                          {formatMoney(usdToCdf(report.cashUsd, rate!), 'CDF')}
                        </span>
                      )}
                    </td>
                  </tr>
                  <tr className="border-b border-outline-variant">
                    <td className="p-3">
                      <span className="flex items-center gap-2 font-body-md text-body-md font-semibold">
                        <span className="material-symbols-outlined text-on-surface-variant">
                          phone_iphone
                        </span>
                        M-Pesa / Airtel
                      </span>
                    </td>
                    <td className="p-3 text-right">{report.countMobile}</td>
                    <td className="p-3 text-right font-bold">
                      {formatMoney(report.mobile, boutique.currency)}
                      {mobileUsd != null && report.mobile > 0 && (
                        <>
                          <br />
                          <span className="text-on-surface-variant text-[10px] font-normal">
                            {formatMoney(mobileUsd, 'USD')}
                          </span>
                        </>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Reconciliation */}
          <section>
            <h3 className="font-headline-md text-headline-md text-primary border-b border-outline-variant pb-2 mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined">balance</span>
              Rapprochement de Caisse
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container font-label-mono text-label-mono text-on-surface-variant uppercase border-y border-outline-variant">
                    <th className="p-3">Devise</th>
                    <th className="p-3 text-right">Théorique (Système)</th>
                    <th className="p-3 text-right">Physique (Compté)</th>
                    <th className="p-3 text-right">Écart</th>
                  </tr>
                </thead>
                <tbody className="font-label-mono text-label-mono">
                  <tr
                    className={`border-b border-outline-variant ${
                      Math.abs(varianceFc) >= 1 ? 'bg-error-container/20' : ''
                    }`}
                  >
                    <td className="p-3 font-bold text-on-surface">FC</td>
                    <td className="p-3 text-right text-on-surface">{formatFc(expectedFc)}</td>
                    <td className="p-3 text-right text-on-surface">{formatFc(countedFc)}</td>
                    <td
                      className={`p-3 text-right font-bold ${
                        Math.abs(varianceFc) < 1
                          ? 'text-on-tertiary-container'
                          : 'text-error'
                      }`}
                    >
                      {varianceFc === 0
                        ? '0'
                        : `${varianceFc > 0 ? '+' : ''}${formatFc(varianceFc)}`}
                    </td>
                  </tr>
                  <tr
                    className={`border-b border-outline-variant ${
                      Math.abs(varianceUsd) >= 0.01 ? 'bg-error-container/20' : ''
                    }`}
                  >
                    <td className="p-3 font-bold text-on-surface">USD</td>
                    <td className="p-3 text-right text-on-surface">
                      {formatMoney(expectedUsd, 'USD')}
                    </td>
                    <td className="p-3 text-right text-on-surface">
                      {formatMoney(countedUsd, 'USD')}
                    </td>
                    <td
                      className={`p-3 text-right font-bold ${
                        Math.abs(varianceUsd) < 0.01
                          ? 'text-on-tertiary-container'
                          : 'text-error'
                      }`}
                    >
                      {Math.abs(varianceUsd) < 0.01
                        ? '0'
                        : `${varianceUsd > 0 ? '+' : ''}${formatMoney(varianceUsd, 'USD')}`}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            {(Math.abs(varianceFc) >= 1 || Math.abs(varianceUsd) >= 0.01) && (
              <div className="mt-3 p-3 bg-surface-container-low border border-outline-variant rounded flex gap-2 items-start">
                <span className="material-symbols-outlined text-secondary shrink-0">error</span>
                <p className="font-body-md text-body-md text-on-surface-variant text-sm">
                  {session.notes?.trim()
                    ? session.notes
                    : 'Écart constaté lors du rapprochement. Voir détail ci-dessus.'}
                </p>
              </div>
            )}
          </section>

          {/* Observations */}
          <section>
            <h3 className="font-headline-md text-headline-md text-primary border-b border-outline-variant pb-2 mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined">edit_note</span>
              Observations
            </h3>
            <div className="min-h-[100px] p-4 bg-surface rounded border border-outline-variant">
              <p className="font-body-md text-body-md text-on-surface whitespace-pre-wrap">
                {session.notes?.trim() ||
                  `Clôture effectuée à ${
                    session.closedAt
                      ? new Intl.DateTimeFormat('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        }).format(new Date(session.closedAt))
                      : '—'
                  }. Session ouverte à ${formatDateTime(session.openedAt)}.`}
              </p>
            </div>
          </section>
        </div>

        <footer className="p-gutter md:p-margin-desktop border-t-2 border-primary bg-surface-container-lowest mt-4">
          <div className="flex flex-col md:flex-row justify-between items-end gap-8">
            <div>
              <p className="font-label-mono text-label-mono text-on-surface-variant">
                Document généré par vitePOS
              </p>
              <p className="font-label-mono text-label-mono text-on-surface-variant mt-1">
                Imprimé le {printedAt}
              </p>
              {hasValidUsdRate(rate) && (
                <p className="font-label-mono text-label-mono text-on-surface-variant mt-1">
                  Taux : 1 USD = {formatFc(rate!)} FC
                </p>
              )}
            </div>
            <div className="w-full md:w-64 border-t border-dashed border-outline-variant pt-2 text-center">
              <p className="font-label-mono text-label-mono text-on-surface-variant uppercase">
                Signature du Superviseur
              </p>
              <div className="h-16" />
            </div>
          </div>
        </footer>
      </main>

      {/* Mobile sticky print */}
      <div className="no-print md:hidden fixed bottom-[64px] left-0 w-full p-margin-mobile bg-surface border-t border-outline-variant z-40">
        <button
          type="button"
          onClick={() => window.print()}
          className="w-full h-14 bg-primary text-on-primary rounded-xl font-headline-md text-headline-md flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined">print</span>
          Imprimer / PDF
        </button>
      </div>
    </div>
  )
}
