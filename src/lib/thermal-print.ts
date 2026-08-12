import type { Boutique, Sale } from '../db/types'
import { formatDateTime, formatMoney } from './utils'

export type PaperWidthMm = 58 | 80

/** ESC/POS helpers */
const ESC = 0x1b
const GS = 0x1d

function encodeText(text: string): Uint8Array {
  // Prefer Windows-1252-ish mapping for common FR accents on cheap thermal printers.
  // Fallback: strip unsupported chars to ASCII.
  const map: Record<string, number> = {
    à: 0xe0,
    â: 0xe2,
    ä: 0xe4,
    ç: 0xe7,
    é: 0xe9,
    è: 0xe8,
    ê: 0xea,
    ë: 0xeb,
    î: 0xee,
    ï: 0xef,
    ô: 0xf4,
    ö: 0xf6,
    ù: 0xf9,
    û: 0xfb,
    ü: 0xfc,
    À: 0xc0,
    Â: 0xc2,
    Ä: 0xc4,
    Ç: 0xc7,
    É: 0xc9,
    È: 0xc8,
    Ê: 0xca,
    Ë: 0xcb,
    Î: 0xce,
    Ï: 0xcf,
    Ô: 0xd4,
    Ö: 0xd6,
    Ù: 0xd9,
    Û: 0xdb,
    Ü: 0xdc,
    '\u0153': 0x9c,
    '\u0152': 0x8c,
    '\u20ac': 0x80,
  }
  const bytes: number[] = []
  for (const ch of text) {
    const code = ch.codePointAt(0) || 63
    if (code < 128) bytes.push(code)
    else if (map[ch] != null) bytes.push(map[ch])
    else bytes.push(63) // ?
  }
  return new Uint8Array(bytes)
}

function concat(...parts: Uint8Array[]) {
  const len = parts.reduce((s, p) => s + p.length, 0)
  const out = new Uint8Array(len)
  let o = 0
  for (const p of parts) {
    out.set(p, o)
    o += p.length
  }
  return out
}

function cmd(...bytes: number[]) {
  return new Uint8Array(bytes)
}

function line(text: string) {
  return concat(encodeText(text), cmd(0x0a))
}

function colsFor(width: PaperWidthMm) {
  return width === 80 ? 48 : 32
}

function padLine(left: string, right: string, width: PaperWidthMm) {
  const cols = colsFor(width)
  const gap = Math.max(1, cols - left.length - right.length)
  return left.slice(0, cols - right.length - 1) + ' '.repeat(gap) + right
}

function paymentLabel(method: Sale['paymentMethod']) {
  if (method === 'especes') return 'Especes'
  if (method === 'mobile_money') return 'Mobile money'
  return 'Mixte'
}

export function buildEscPosTicket(
  boutique: Boutique,
  sale: Sale,
  opts?: { cashierName?: string },
): Uint8Array {
  const width = (boutique.paperWidthMm || 58) as PaperWidthMm
  const parts: Uint8Array[] = []

  // Init + code page PC437/PC850-ish
  parts.push(cmd(ESC, 0x40)) // initialize
  parts.push(cmd(ESC, 0x74, 16)) // code page 16 (WPC1252) when supported
  parts.push(cmd(ESC, 0x61, 1)) // center
  parts.push(cmd(ESC, 0x21, 0x30)) // double size
  parts.push(line(boutique.name))
  parts.push(cmd(ESC, 0x21, 0x00)) // normal
  parts.push(line('Ticket de vente'))
  parts.push(cmd(ESC, 0x61, 0)) // left

  parts.push(line('-'.repeat(colsFor(width))))
  parts.push(line(formatDateTime(sale.createdAt)))
  parts.push(line(`No ${sale.id.slice(-8).toUpperCase()}`))
  if (opts?.cashierName) parts.push(line(`Caissier: ${opts.cashierName}`))
  if (sale.status === 'annulee') parts.push(line('*** ANNULE ***'))
  parts.push(line('-'.repeat(colsFor(width))))

  for (const l of sale.lines) {
    parts.push(line(`${l.quantity} x ${l.productName}`))
    parts.push(
      line(
        padLine(
          `  ${formatMoney(l.unitPrice, boutique.currency)}`,
          formatMoney(l.lineTotal, boutique.currency),
          width,
        ),
      ),
    )
  }

  parts.push(line('-'.repeat(colsFor(width))))
  if (sale.discount > 0) {
    const label = sale.discountPercent ? `Remise ${sale.discountPercent}%` : 'Remise'
    parts.push(
      line(padLine(label, `-${formatMoney(sale.discount, boutique.currency)}`, width)),
    )
  }
  parts.push(cmd(ESC, 0x21, 0x10)) // emphasize / taller
  parts.push(
    line(padLine('TOTAL', formatMoney(sale.total, boutique.currency), width)),
  )
  parts.push(cmd(ESC, 0x21, 0x00))
  if (sale.payCurrency === 'USD' && sale.totalInPayCurrency != null) {
    parts.push(line(`Equiv: ${formatMoney(sale.totalInPayCurrency, 'USD')}`))
    if (sale.exchangeRate) {
      parts.push(line(`Taux: 1$ = ${Math.round(sale.exchangeRate)} FC`))
    }
  }
  parts.push(
    line(
      `Paiement: ${
        sale.paymentMethod === 'especes'
          ? sale.payCurrency === 'USD'
            ? 'Especes USD'
            : 'Especes FC'
          : paymentLabel(sale.paymentMethod)
      }`,
    ),
  )
  if (sale.receivedInPayCurrency != null) {
    parts.push(
      line(
        `Recu: ${formatMoney(
          sale.receivedInPayCurrency,
          sale.payCurrency === 'USD' ? 'USD' : boutique.currency,
        )}`,
      ),
    )
  }
  if (sale.changeInPayCurrency != null && sale.changeInPayCurrency > 0) {
    parts.push(
      line(
        `Rendu: ${formatMoney(
          sale.changeInPayCurrency,
          sale.payCurrency === 'USD' ? 'USD' : boutique.currency,
        )}`,
      ),
    )
  }
  if (sale.cashReceived != null && sale.payCurrency !== 'USD') {
    parts.push(line(`Recu: ${formatMoney(sale.cashReceived, boutique.currency)}`))
  }
  if (sale.changeGiven != null && sale.changeGiven > 0 && sale.payCurrency !== 'USD') {
    parts.push(line(`Rendu: ${formatMoney(sale.changeGiven, boutique.currency)}`))
  }
  for (const p of sale.payments) {
    if (sale.paymentMethod === 'mixte') {
      parts.push(
        line(
          `${p.method === 'especes' ? 'Especes' : 'MM'}: ${formatMoney(p.amount, boutique.currency)}`,
        ),
      )
    }
  }

  parts.push(line('-'.repeat(colsFor(width))))
  parts.push(cmd(ESC, 0x61, 1))
  parts.push(line('Merci et a bientot !'))
  parts.push(cmd(ESC, 0x61, 0))
  parts.push(cmd(0x0a, 0x0a, 0x0a))
  // Partial cut if supported
  parts.push(cmd(GS, 0x56, 0x00))

  return concat(...parts)
}

export function isWebSerialSupported() {
  return typeof navigator !== 'undefined' && 'serial' in navigator
}

let activePort: SerialPort | null = null
let writerLock: WritableStreamDefaultWriter<Uint8Array> | null = null

async function ensurePort(): Promise<SerialPort> {
  if (!isWebSerialSupported()) {
    throw new Error('Web Serial non supporté (utilisez Chrome/Edge sur ordinateur ou tablette)')
  }
  if (activePort) return activePort

  const ports = await navigator.serial.getPorts()
  if (ports[0]) {
    activePort = ports[0]
  } else {
    activePort = await navigator.serial.requestPort()
  }

  if (!activePort.readable && !activePort.writable) {
    // closed
  }
  try {
    await activePort.open({ baudRate: 9600 })
  } catch (err) {
    // Already open from previous session in same page
    const msg = String((err as Error).message || err)
    if (!/already open/i.test(msg)) throw err
  }
  return activePort
}

export async function connectThermalPrinter() {
  if (!isWebSerialSupported()) {
    throw new Error('Web Serial non supporté sur ce navigateur')
  }
  // Force picker
  if (activePort) {
    try {
      writerLock?.releaseLock()
    } catch {
      /* ignore */
    }
    writerLock = null
    try {
      await activePort.close()
    } catch {
      /* ignore */
    }
    activePort = null
  }
  activePort = await navigator.serial.requestPort()
  await activePort.open({ baudRate: 9600 })
  return true
}

export async function disconnectThermalPrinter() {
  try {
    writerLock?.releaseLock()
  } catch {
    /* ignore */
  }
  writerLock = null
  if (activePort) {
    try {
      await activePort.close()
    } catch {
      /* ignore */
    }
  }
  activePort = null
}

export function isThermalPrinterConnected() {
  return !!activePort
}

export async function sendRawToPrinter(data: Uint8Array) {
  const port = await ensurePort()
  if (!port.writable) throw new Error('Port imprimante non inscriptible')
  const writer = port.writable.getWriter()
  try {
    await writer.write(data)
  } finally {
    writer.releaseLock()
  }
}

export async function printThermalTicket(
  boutique: Boutique,
  sale: Sale,
  opts?: { cashierName?: string },
) {
  const payload = buildEscPosTicket(boutique, sale, opts)
  await sendRawToPrinter(payload)
}

export function printBrowserTicket() {
  window.print()
}

export async function printTicketSmart(
  boutique: Boutique,
  sale: Sale,
  opts?: { cashierName?: string; preferBrowser?: boolean },
) {
  if (opts?.preferBrowser) {
    printBrowserTicket()
    return { mode: 'browser' as const }
  }
  if (isWebSerialSupported()) {
    try {
      await printThermalTicket(boutique, sale, opts)
      return { mode: 'thermal' as const }
    } catch (err) {
      // If user cancels port picker, fall back
      const msg = String((err as Error).message || err)
      if (/NotFoundError|No port|cancel/i.test(msg)) {
        printBrowserTicket()
        return { mode: 'browser' as const, warning: msg }
      }
      throw err
    }
  }
  printBrowserTicket()
  return { mode: 'browser' as const }
}

/** Minimal Web Serial typings used by this module */
interface SerialPort {
  readable: ReadableStream<Uint8Array> | null
  writable: WritableStream<Uint8Array> | null
  open: (options: { baudRate: number }) => Promise<void>
  close: () => Promise<void>
}

interface Serial {
  requestPort: () => Promise<SerialPort>
  getPorts: () => Promise<SerialPort[]>
}

declare global {
  interface Navigator {
    serial: Serial
  }
}
