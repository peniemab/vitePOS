import { customAlphabet } from 'nanoid'

const nano = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 12)
const inviteNano = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 6)

export function newId(prefix?: string) {
  return prefix ? `${prefix}_${nano()}` : nano()
}

export function newInviteCode() {
  return inviteNano()
}

export function now() {
  return Date.now()
}

export async function hashPin(pin: string): Promise<string> {
  const data = new TextEncoder().encode(`boutique-locale:${pin}`)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function verifyPin(pin: string, hash: string) {
  return (await hashPin(pin)) === hash
}

export function startOfDay(ts = Date.now()) {
  const d = new Date(ts)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

export function endOfDay(ts = Date.now()) {
  const d = new Date(ts)
  d.setHours(23, 59, 59, 999)
  return d.getTime()
}

/** month: 0–11 */
export function startOfMonth(year: number, month: number) {
  return new Date(year, month, 1, 0, 0, 0, 0).getTime()
}

/** month: 0–11 */
export function endOfMonth(year: number, month: number) {
  return new Date(year, month + 1, 0, 23, 59, 59, 999).getTime()
}

export function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

/** Lundi 00:00 (semaine ISO / FR) */
export function startOfWeek(ts = Date.now()) {
  const d = new Date(ts)
  d.setHours(0, 0, 0, 0)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d.getTime()
}

export function endOfWeek(ts = Date.now()) {
  return endOfDay(startOfWeek(ts) + 6 * 24 * 60 * 60 * 1000)
}

/** Index 0=lundi … 6=dimanche */
export function mondayBasedDayIndex(ts: number) {
  const day = new Date(ts).getDay()
  return day === 0 ? 6 : day - 1
}

export function formatMoney(amount: number, currency = 'CDF') {
  const noDecimals = currency === 'XOF' || currency === 'XAF' || currency === 'CDF'
  try {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency,
      maximumFractionDigits: noDecimals ? 0 : 2,
      minimumFractionDigits: currency === 'USD' ? 2 : undefined,
    }).format(amount)
  } catch {
    const n = noDecimals ? Math.round(amount) : Math.round(amount * 100) / 100
    const suffix = currency === 'CDF' ? 'FC' : currency
    return `${n} ${suffix}`
  }
}

export function formatDateTime(ts: number) {
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(ts))
}

export function formatDate(ts: number) {
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(ts))
}
