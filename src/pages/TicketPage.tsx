import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { useAuth } from '../lib/auth'
import { formatDateTime, formatMoney } from '../lib/utils'
import { cancelSale } from '../lib/services'
import { canCancelSale } from '../lib/roles'
import { cdfToUsd, hasValidUsdRate, roundUsd } from '../lib/fx'
import {
  isWebSerialSupported,
  printBrowserTicket,
  printTicketSmart,
} from '../lib/thermal-print'

function formatFcPlain(n: number) {
  return new Intl.NumberFormat('fr-FR').format(Math.round(n))
}

export function TicketPage() {
  const { id } = useParams()
  const { boutique, user } = useAuth()
  const navigate = useNavigate()
  const sale = useLiveQuery(() => (id ? db.sales.get(id) : undefined), [id])
  const cashier = useLiveQuery(
    () => (sale?.userId ? db.users.get(sale.userId) : undefined),
    [sale?.userId],
  )
  const [error, setError] = useState('')
  const [printMsg, setPrintMsg] = useState('')
  const [printing, setPrinting] = useState(false)
  const [autoTried, setAutoTried] = useState(false)

  useEffect(() => {
    if (!sale || !boutique || !user || autoTried) return
    if (!boutique.autoPrintTicket) return
    setAutoTried(true)
    void (async () => {
      try {
        setPrinting(true)
        const res = await printTicketSmart(boutique, sale, { cashierName: user.name })
        setPrintMsg(
          res.mode === 'thermal'
            ? 'Ticket envoyé à l’imprimante thermique'
            : 'Impression navigateur (format ticket)',
        )
      } catch (err) {
        setError(String((err as Error).message || err))
      } finally {
        setPrinting(false)
      }
    })()
  }, [sale, boutique, user, autoTried])

  const rate = sale?.exchangeRate || boutique?.usdRateCdf
  const totalUsd = useMemo(() => {
    if (sale?.payCurrency === 'USD' && sale.totalInPayCurrency != null) {
      return sale.totalInPayCurrency
    }
    if (!sale || !hasValidUsdRate(rate)) return null
    return roundUsd(cdfToUsd(sale.total, rate!))
  }, [sale, rate])

  if (!sale || !boutique || !user) {
    return (
      <p className="font-body-md text-body-md text-on-surface-variant text-center py-12">
        Chargement…
      </p>
    )
  }

  const ticketNo = sale.id.slice(-4).toUpperCase()
  const payLabel =
    sale.paymentMethod === 'especes'
      ? sale.payCurrency === 'USD'
        ? 'Espèces USD'
        : 'Espèces FC'
      : sale.paymentMethod === 'mobile_money'
        ? 'Mobile Money'
        : 'Mixte'

  async function onCancel() {
    const reason = prompt('Motif d’annulation ?')
    if (!reason) return
    try {
      await cancelSale(sale!.id, user!.id, reason)
    } catch (err) {
      setError(String((err as Error).message || err))
    }
  }

  async function onThermalPrint() {
    setError('')
    setPrintMsg('')
    setPrinting(true)
    try {
      const res = await printTicketSmart(boutique!, sale!, {
        cashierName: cashier?.name || user!.name,
      })
      setPrintMsg(
        res.mode === 'thermal'
          ? 'Ticket envoyé à l’imprimante thermique'
          : 'Impression navigateur ouverte',
      )
    } catch (err) {
      setError(String((err as Error).message || err))
    } finally {
      setPrinting(false)
    }
  }

  const paper = boutique.paperWidthMm || 58
  const subtotal = sale.subtotal ?? sale.total + (sale.discount || 0)

  return (
    <div className="flex flex-col items-center gap-stack-md py-2 pb-8 w-full">
      {/* Thermal receipt */}
      <div
        id="ticket-receipt"
        className="ticket-thermal w-full max-w-[340px] px-6 py-8 mx-auto relative overflow-hidden border border-outline-variant font-label-mono text-on-surface"
      >
        {/* Jagged top */}
        <div
          className="absolute top-0 left-0 w-full h-2 pointer-events-none"
          style={{
            background:
              'linear-gradient(-45deg, transparent 4px, #fdfbf7 4px), linear-gradient(45deg, transparent 4px, #fdfbf7 4px)',
            backgroundSize: '8px 8px',
            transform: 'rotate(180deg) translateY(100%)',
          }}
        />

        <div className="text-center flex flex-col items-center pt-1">
          <span className="material-symbols-outlined text-4xl mb-2 text-primary">storefront</span>
          <h1 className="font-headline-md text-headline-md text-primary mb-1">{boutique.name}</h1>
          <p className="font-label-mono text-label-mono text-on-surface-variant">
            vitePOS · Kinshasa
          </p>
          {sale.status === 'annulee' && (
            <p className="font-label-mono text-label-mono text-error font-bold mt-2">
              ★ ANNULÉE ★
            </p>
          )}
        </div>

        <div className="ticket-dotted" />

        <div className="flex justify-between font-label-mono text-label-mono mb-1">
          <span className="text-on-surface-variant">Ticket:</span>
          <span className="font-bold">#{ticketNo}</span>
        </div>
        <div className="flex justify-between font-label-mono text-label-mono mb-1">
          <span className="text-on-surface-variant">Date:</span>
          <span>{formatDateTime(sale.createdAt)}</span>
        </div>
        <div className="flex justify-between font-label-mono text-label-mono">
          <span className="text-on-surface-variant">Caisse:</span>
          <span>{cashier?.name || user.name}</span>
        </div>

        <div className="ticket-dotted" />

        <div className="w-full">
          <div className="flex justify-between font-label-mono text-label-mono font-bold border-b border-outline-variant pb-2 mb-2">
            <span className="flex-1">Article</span>
            <span className="w-12 text-center">Qté</span>
            <span className="w-20 text-right">Prix</span>
          </div>
          {sale.lines.map((l) => (
            <div
              key={`${l.productId}-${l.productName}`}
              className="flex justify-between font-label-mono text-label-mono mb-2 items-start"
            >
              <span className="flex-1 pr-2">{l.productName}</span>
              <span className="w-12 text-center">{l.quantity}</span>
              <span className="w-20 text-right">{formatFcPlain(l.lineTotal)}</span>
            </div>
          ))}
        </div>

        <div className="ticket-dotted" />

        <div className="flex justify-between font-label-mono text-label-mono mb-1">
          <span className="text-on-surface-variant">Sous-total:</span>
          <span>{formatMoney(subtotal, boutique.currency)}</span>
        </div>
        <div className="flex justify-between font-label-mono text-label-mono mb-2">
          <span className="text-on-surface-variant">
            Remise{sale.discountPercent ? ` (${sale.discountPercent}%)` : ''}:
          </span>
          <span>{formatMoney(sale.discount || 0, boutique.currency)}</span>
        </div>

        <div className="flex justify-between items-center py-2 border-y border-outline-variant my-2">
          <span className="font-headline-md text-headline-md text-primary">TOTAL</span>
          <div className="text-right">
            <span className="font-headline-md text-headline-md text-primary block">
              {formatMoney(sale.total, boutique.currency)}
            </span>
            {totalUsd != null && (
              <span className="font-label-mono text-label-mono text-on-surface-variant block mt-1">
                ~ {formatMoney(totalUsd, 'USD')}
              </span>
            )}
          </div>
        </div>

        {hasValidUsdRate(rate) && (
          <div className="text-center mt-1">
            <span className="font-label-mono text-[10px] text-on-surface-variant italic">
              Taux de change: 1 USD = {formatFcPlain(rate!)} FC
            </span>
          </div>
        )}

        <div className="ticket-dotted" />

        <div className="flex justify-between font-label-mono text-label-mono mb-1">
          <span className="text-on-surface-variant">Payé ({payLabel}):</span>
          <span>
            {sale.paymentMethod === 'especes' && sale.receivedInPayCurrency != null
              ? formatMoney(
                  sale.receivedInPayCurrency,
                  sale.payCurrency === 'USD' ? 'USD' : boutique.currency,
                )
              : formatMoney(sale.total, boutique.currency)}
          </span>
        </div>
        {sale.paymentMethod === 'especes' &&
          sale.changeInPayCurrency != null &&
          sale.changeInPayCurrency > 0 && (
            <div className="flex justify-between font-label-mono text-label-mono font-bold">
              <span>Rendu:</span>
              <span>
                {formatMoney(
                  sale.changeInPayCurrency,
                  sale.payCurrency === 'USD' ? 'USD' : boutique.currency,
                )}
              </span>
            </div>
          )}

        <div className="ticket-dotted" />

        <div className="flex flex-col items-center mt-6">
          <div className="w-24 h-24 bg-surface-container-high border border-outline-variant flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant">
              qr_code_2
            </span>
          </div>
          <p className="font-body-md text-body-md font-bold mb-1">Merci de votre visite !</p>
          <p className="font-label-mono text-[10px] text-on-surface-variant mt-2">
            Propulsé par vitePOS
          </p>
        </div>

        {/* Jagged bottom */}
        <div
          className="absolute bottom-0 left-0 w-full h-2 pointer-events-none"
          style={{
            background:
              'linear-gradient(-45deg, transparent 4px, #fdfbf7 4px), linear-gradient(45deg, transparent 4px, #fdfbf7 4px)',
            backgroundSize: '8px 8px',
            backgroundPosition: 'left bottom',
          }}
        />
      </div>

      {/* Actions */}
      <div className="no-print w-full max-w-[340px] flex flex-col gap-2 px-1">
        {error && (
          <p className="font-body-md text-body-md text-error flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            {error}
          </p>
        )}
        {printMsg && (
          <p className="font-body-md text-body-md text-on-tertiary-container flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
            {printMsg}
          </p>
        )}

        <button
          type="button"
          disabled={printing}
          onClick={() => void onThermalPrint()}
          className="w-full h-14 bg-primary text-on-primary rounded-lg font-headline-md text-headline-md flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <span className="material-symbols-outlined">print</span>
          {printing
            ? 'Impression…'
            : isWebSerialSupported()
              ? 'Imprimer thermique'
              : 'Imprimer ticket'}
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => printBrowserTicket()}
            className="h-12 border border-outline-variant rounded-lg font-body-md text-body-md bg-surface-container-lowest"
          >
            Navigateur
          </button>
          <button
            type="button"
            onClick={() => navigate('/caisse')}
            className="h-12 bg-secondary text-on-secondary rounded-lg font-body-md text-body-md font-semibold"
          >
            Nouvelle vente
          </button>
        </div>
        {canCancelSale(user) && sale.status === 'validee' && (
          <button
            type="button"
            onClick={() => void onCancel()}
            className="h-12 border border-error text-error rounded-lg font-body-md text-body-md mt-1"
          >
            Annuler la vente
          </button>
        )}
        {!isWebSerialSupported() && (
          <p className="font-label-mono text-label-mono text-on-surface-variant text-center">
            ESC/POS USB sur Chrome/Edge · sinon impression navigateur {paper} mm
          </p>
        )}
      </div>
    </div>
  )
}
