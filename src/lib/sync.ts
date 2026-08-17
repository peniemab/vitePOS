import { db } from '../db'
import type { OutboxItem, StockMovement } from '../db/types'
import { now } from './utils'
import { apiUrl, getStoredToken } from './api'

type Listener = (state: SyncState) => void
export type SyncState = 'online' | 'offline' | 'syncing' | 'conflict'

const canUseDom = typeof window !== 'undefined'

let state: SyncState = canUseDom && navigator.onLine ? 'online' : 'offline'
const listeners = new Set<Listener>()

export function getSyncState() {
  return state
}

export function subscribeSync(listener: Listener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function setState(next: SyncState) {
  state = next
  listeners.forEach((l) => l(next))
}

if (canUseDom) {
  window.addEventListener('online', () => {
    setState('online')
    void syncNow()
  })
  window.addEventListener('offline', () => setState('offline'))
}

export async function enqueueOutbox(
  item: Omit<OutboxItem, 'id' | 'createdAt' | 'syncedAt'> & { id?: string },
) {
  const row: OutboxItem = {
    id: item.id || crypto.randomUUID(),
    boutiqueId: item.boutiqueId,
    table: item.table,
    entityId: item.entityId,
    payload: item.payload,
    kind: item.kind,
    createdAt: now(),
  }
  await db.outbox.put(row)
  if (navigator.onLine) void syncNow()
}

type RemotePayload = {
  inviteCode?: string
  revision?: number
  entities?: Record<string, Record<string, Record<string, unknown>>>
  events?: Array<Record<string, unknown>>
  updatedAt?: number | null
}

export async function syncNow(): Promise<{ ok: boolean; message?: string }> {
  if (!navigator.onLine) {
    setState('offline')
    return { ok: false, message: 'Hors ligne' }
  }

  const meta = await db.meta.get('app')
  if (!meta?.boutiqueId) return { ok: false, message: 'Aucune boutique' }

  const boutique = await db.boutiques.get(meta.boutiqueId)
  if (!boutique) return { ok: false, message: 'Boutique introuvable' }

  setState('syncing')

  try {
    const entities: Record<string, unknown[]> = {
      boutiques: [boutique],
      users: await db.users.where('boutiqueId').equals(boutique.id).toArray(),
      products: await db.products.where('boutiqueId').equals(boutique.id).toArray(),
      clients: await db.clients.where('boutiqueId').equals(boutique.id).toArray(),
      sales: await db.sales.where('boutiqueId').equals(boutique.id).toArray(),
      inventorySessions: await db.inventorySessions
        .where('boutiqueId')
        .equals(boutique.id)
        .toArray(),
      inventoryLines: await db.inventoryLines.where('boutiqueId').equals(boutique.id).toArray(),
      cashSessions: await db.cashSessions.where('boutiqueId').equals(boutique.id).toArray(),
      expenses: await db.expenses.where('boutiqueId').equals(boutique.id).toArray(),
    }

    const events = await db.stockMovements.where('boutiqueId').equals(boutique.id).toArray()

    const token = getStoredToken()
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (token) headers.Authorization = `Bearer ${token}`

    const res = await fetch(apiUrl(`/api/sync/${boutique.inviteCode}`), {
      method: 'POST',
      headers,
      body: JSON.stringify({ entities, events }),
    })

    if (!res.ok) throw new Error(`Sync HTTP ${res.status}`)
    const remote = (await res.json()) as RemotePayload

    await applyRemoteSnapshot(boutique.id, remote)

    const ts = now()
    await db.outbox.where('boutiqueId').equals(boutique.id).modify({ syncedAt: ts })
    await db.meta.put({
      ...meta,
      lastSyncAt: ts,
      syncRevision: remote.revision || meta.syncRevision,
    })

    setState('online')
    return { ok: true }
  } catch (err) {
    setState(navigator.onLine ? 'conflict' : 'offline')
    return { ok: false, message: String((err as Error)?.message || err) }
  }
}

async function applyRemoteSnapshot(boutiqueId: string, remote: RemotePayload) {
  const entities = remote.entities || {}

  const putMap = async <T extends { id: string; boutiqueId?: string }>(
    table: keyof typeof entities,
    put: (row: T) => Promise<unknown>,
  ) => {
    const map = entities[table]
    if (!map) return
    for (const row of Object.values(map) as T[]) {
      if (row.boutiqueId && row.boutiqueId !== boutiqueId) continue
      await put(row)
    }
  }

  if (entities.boutiques) {
    for (const row of Object.values(entities.boutiques)) {
      await db.boutiques.put(row as never)
    }
  }

  await putMap('users', (r) => db.users.put(r as never))
  await putMap('products', (r) => db.products.put(r as never))
  await putMap('clients', (r) => db.clients.put(r as never))
  await putMap('sales', (r) => db.sales.put(r as never))
  await putMap('inventorySessions', (r) => db.inventorySessions.put(r as never))
  await putMap('inventoryLines', (r) => db.inventoryLines.put(r as never))
  await putMap('cashSessions', (r) => db.cashSessions.put(r as never))
  await putMap('expenses', (r) => db.expenses.put(r as never))

  for (const ev of remote.events || []) {
    const movement = ev as unknown as StockMovement
    if (movement.boutiqueId !== boutiqueId) continue
    const existing = await db.stockMovements.get(movement.id)
    if (!existing) await db.stockMovements.put(movement)
  }
}

export async function pullBoutiqueByInvite(inviteCode: string) {
  const code = inviteCode.trim().toUpperCase()
  const token = getStoredToken()
  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(apiUrl(`/api/sync/${code}`), { headers })
  if (!res.ok) throw new Error('Impossible de rejoindre la boutique')
  const remote = (await res.json()) as RemotePayload
  const boutiqueMap = remote.entities?.boutiques
  const boutique = boutiqueMap ? Object.values(boutiqueMap)[0] : null
  if (!boutique) throw new Error('Code invitation invalide ou boutique encore non synchronisée')
  const b = boutique as {
    id: string
    name: string
    inviteCode: string
    currency: string
  }
  await applyRemoteSnapshot(b.id, remote)
  return b
}
