import { db } from '../db'
import type {
  CashSession,
  Client,
  Expense,
  ExpenseCategory,
  InventoryLine,
  InventorySession,
  PaymentMethod,
  PaymentSplit,
  Product,
  Role,
  Sale,
  SaleLine,
  StockMovementType,
  User,
  PayCurrency,
  UserPermissions,
} from '../db/types'
import { enqueueOutbox } from './sync'
import { hashPin, newId, now, startOfDay, endOfDay, startOfMonth, endOfMonth, daysInMonth, startOfWeek, endOfWeek, mondayBasedDayIndex } from './utils'
import * as api from './api'
import { ApiError, setStoredToken } from './api'
import type { AuthResponse } from './api'
import { hasValidUsdRate, usdToCdf } from './fx'

async function trackEntity(
  boutiqueId: string,
  table: Parameters<typeof enqueueOutbox>[0]['table'],
  entityId: string,
  payload: unknown,
  kind: 'upsert' | 'event' = 'upsert',
) {
  await enqueueOutbox({ boutiqueId, table, entityId, payload, kind })
}

export async function getMeta() {
  return (await db.meta.get('app')) || { id: 'app' as const }
}

async function persistAuthSession(res: AuthResponse, localPin: string) {
  const { token, user, boutique } = res
  setStoredToken(token)
  const localUser: User = {
    id: user.id,
    boutiqueId: user.boutiqueId,
    name: user.name,
    role: user.role,
    pinHash: await hashPin(localPin),
    active: user.active,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }
  const localBoutique = {
    ...boutique,
    paperWidthMm: boutique.paperWidthMm === 80 ? (80 as const) : (58 as const),
    autoPrintTicket: boutique.autoPrintTicket ?? false,
  }
  await db.transaction('rw', db.boutiques, db.users, db.meta, async () => {
    await db.boutiques.put(localBoutique)
    await db.users.put(localUser)
    await db.meta.put({
      id: 'app',
      boutiqueId: boutique.id,
      currentUserId: user.id,
      authToken: token,
    })
  })
  return { boutique: localBoutique, owner: localUser }
}

export async function createBoutique(input: {
  name: string
  ownerName: string
  pin: string
  currency?: string
  usdRateCdf?: number
}) {
  if (!navigator.onLine) {
    throw new Error('Connexion Internet requise pour créer une boutique')
  }

  const res = await api.registerBoutique({
    name: input.name,
    ownerName: input.ownerName,
    pin: input.pin,
    currency: input.currency,
    usdRateCdf: input.usdRateCdf,
  })

  const { boutique, owner } = await persistAuthSession(res, input.pin)

  // seed a few demo products for quick first sale
  const seeds: Array<Partial<Product> & { name: string; sellPrice: number; stock: number }> = [
    { name: 'Riz 1kg', sellPrice: 700, stock: 40, category: 'Alimentation', favorite: true },
    { name: 'Huile 1L', sellPrice: 1500, stock: 20, category: 'Alimentation', favorite: true },
    { name: 'Savon', sellPrice: 300, stock: 50, category: 'Hygiène', favorite: true },
  ]
  for (const s of seeds) {
    await upsertProduct({
      boutiqueId: boutique.id,
      name: s.name,
      category: s.category || 'Divers',
      sellPrice: s.sellPrice,
      stock: s.stock,
      unit: 'u',
      alertThreshold: 5,
      favorite: !!s.favorite,
    })
  }

  const { syncNow } = await import('./sync')
  await syncNow()

  return { boutique, owner }
}

export async function joinBoutiqueRemote(input: {
  inviteCode: string
  name: string
  pin: string
}) {
  if (!navigator.onLine) {
    throw new Error('Connexion Internet requise pour rejoindre une boutique')
  }

  const res = await api.joinBoutique(input)
  await persistAuthSession(res, input.pin)

  const { syncNow } = await import('./sync')
  await syncNow()
}

export async function joinBoutiqueLocal(boutiqueId: string, userId: string) {
  await db.meta.put({ id: 'app', boutiqueId, currentUserId: userId })
}

export async function loginWithPin(pin: string) {
  const meta = await getMeta()
  if (!meta.boutiqueId) throw new Error('Aucune boutique configurée')

  const boutique = await db.boutiques.get(meta.boutiqueId)

  if (navigator.onLine) {
    try {
      const res = await api.loginRemote({
        boutiqueId: meta.boutiqueId,
        inviteCode: boutique?.inviteCode,
        pin,
      })
      setStoredToken(res.token)
      const localUser: User = {
        id: res.user.id,
        boutiqueId: res.user.boutiqueId,
        name: res.user.name,
        role: res.user.role,
        pinHash: await hashPin(pin),
        active: res.user.active,
        createdAt: res.user.createdAt,
        updatedAt: res.user.updatedAt,
      }
      await db.users.put(localUser)
      await db.meta.put({ ...meta, currentUserId: res.user.id, authToken: res.token })
      return localUser
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) throw err
      // réseau ou serveur indisponible → repli offline
    }
  }

  const users = await db.users.where('boutiqueId').equals(meta.boutiqueId).toArray()
  const pinHash = await hashPin(pin)
  const user = users.find((u) => u.active && u.pinHash === pinHash)
  if (!user) throw new Error('PIN incorrect')
  await db.meta.put({ ...meta, currentUserId: user.id })
  return user
}

export async function switchUser(userId: string) {
  const meta = await getMeta()
  await db.meta.put({ ...meta, currentUserId: userId })
}

export async function logoutUser() {
  const meta = await getMeta()
  setStoredToken(null)
  await db.meta.put({ ...meta, currentUserId: undefined, authToken: undefined })
}

export async function addUser(input: {
  boutiqueId: string
  name: string
  role: Role
  pin: string
  phone?: string
  avatarDataUrl?: string
  permissions?: Partial<UserPermissions>
}) {
  if (input.pin.length < 4) throw new Error('PIN trop court (min. 4 chiffres)')
  const ts = now()
  const user: User = {
    id: newId('user'),
    boutiqueId: input.boutiqueId,
    name: input.name.trim(),
    role: input.role,
    pinHash: await hashPin(input.pin),
    active: true,
    phone: input.phone?.trim() || undefined,
    avatarDataUrl: input.avatarDataUrl,
    permissions: input.permissions,
    createdAt: ts,
    updatedAt: ts,
  }
  await db.users.put(user)
  await trackEntity(user.boutiqueId, 'users', user.id, user)
  return user
}

export async function updateUser(input: {
  id: string
  name?: string
  role?: Role
  active?: boolean
  phone?: string | null
  avatarDataUrl?: string | null
  permissions?: Partial<UserPermissions>
}) {
  const existing = await db.users.get(input.id)
  if (!existing) throw new Error('Utilisateur introuvable')
  if (input.active === false && existing.role === 'proprietaire') {
    const owners = await db.users
      .where('boutiqueId')
      .equals(existing.boutiqueId)
      .filter((u) => u.role === 'proprietaire' && u.active && u.id !== existing.id)
      .count()
    if (owners === 0) throw new Error('Impossible de désactiver le seul propriétaire')
  }
  const updated: User = {
    ...existing,
    name: input.name !== undefined ? input.name.trim() : existing.name,
    role: input.role !== undefined ? input.role : existing.role,
    active: input.active !== undefined ? input.active : existing.active,
    phone:
      input.phone === null
        ? undefined
        : input.phone !== undefined
          ? input.phone.trim() || undefined
          : existing.phone,
    avatarDataUrl:
      input.avatarDataUrl === null
        ? undefined
        : input.avatarDataUrl !== undefined
          ? input.avatarDataUrl
          : existing.avatarDataUrl,
    permissions:
      input.permissions !== undefined ? input.permissions : existing.permissions,
    updatedAt: now(),
  }
  if (!updated.name) throw new Error('Nom requis')
  await db.users.put(updated)
  await trackEntity(updated.boutiqueId, 'users', updated.id, updated)
  return updated
}

export async function updateUserPin(userId: string, pin: string) {
  if (pin.length < 4) throw new Error('PIN trop court (min. 4 chiffres)')
  const existing = await db.users.get(userId)
  if (!existing) throw new Error('Utilisateur introuvable')
  if (!existing.active) throw new Error('Compte inactif')
  const updated: User = {
    ...existing,
    pinHash: await hashPin(pin),
    updatedAt: now(),
  }
  await db.users.put(updated)
  await trackEntity(updated.boutiqueId, 'users', updated.id, updated)
  return updated
}

export async function upsertProduct(
  input: Partial<Product> & {
    boutiqueId: string
    name: string
    sellPrice: number
  },
) {
  const ts = now()
  let existing = input.id ? await db.products.get(input.id) : undefined
  // Match by barcode within boutique when importing / updating
  if (!existing && input.barcode) {
    existing = await db.products
      .where('boutiqueId')
      .equals(input.boutiqueId)
      .filter((p) => !!p.barcode && p.barcode === input.barcode && !p.archived)
      .first()
  }
  const product: Product = {
    id: existing?.id || newId('prod'),
    boutiqueId: input.boutiqueId,
    name: input.name.trim(),
    category: input.category?.trim() || existing?.category || 'Divers',
    sellPrice: input.sellPrice,
    buyPrice: input.buyPrice !== undefined ? input.buyPrice : existing?.buyPrice,
    unit: input.unit || existing?.unit || 'u',
    stock: input.stock ?? existing?.stock ?? 0,
    alertThreshold: input.alertThreshold ?? existing?.alertThreshold ?? 5,
    barcode: input.barcode !== undefined ? input.barcode || undefined : existing?.barcode,
    favorite: input.favorite ?? existing?.favorite ?? false,
    archived: input.archived ?? existing?.archived ?? false,
    createdAt: existing?.createdAt || ts,
    updatedAt: ts,
  }
  await db.products.put(product)
  await trackEntity(product.boutiqueId, 'products', product.id, product)
  return product
}

export async function archiveProduct(productId: string) {
  const product = await db.products.get(productId)
  if (!product) throw new Error('Produit introuvable')
  const updated: Product = { ...product, archived: true, updatedAt: now() }
  await db.products.put(updated)
  await trackEntity(product.boutiqueId, 'products', updated.id, updated)
  return updated
}

export async function bulkImportProducts(
  boutiqueId: string,
  rows: Array<{
    name: string
    category?: string
    sellPrice: number
    buyPrice?: number
    stock?: number
    alertThreshold?: number
    unit?: string
    barcode?: string
    favorite?: boolean
  }>,
  mode: 'merge' | 'replace_stock' = 'merge',
) {
  let created = 0
  let updated = 0
  const existing = await db.products.where('boutiqueId').equals(boutiqueId).toArray()
  const byBarcode = new Map(
    existing.filter((p) => p.barcode).map((p) => [p.barcode as string, p]),
  )
  const byName = new Map(existing.map((p) => [`${p.name.toLowerCase()}|${p.category}`, p]))

  const toPut: Product[] = []
  const ts = now()

  for (const row of rows) {
    const key = `${row.name.trim().toLowerCase()}|${(row.category || 'Divers').trim()}`
    let prev =
      (row.barcode && byBarcode.get(row.barcode)) || byName.get(key) || undefined

    if (prev) {
      updated++
      const next: Product = {
        ...prev,
        name: row.name.trim(),
        category: row.category?.trim() || prev.category,
        sellPrice: row.sellPrice,
        buyPrice: row.buyPrice !== undefined ? row.buyPrice : prev.buyPrice,
        unit: row.unit || prev.unit,
        stock: mode === 'replace_stock' ? (row.stock ?? prev.stock) : (row.stock ?? prev.stock),
        alertThreshold: row.alertThreshold ?? prev.alertThreshold,
        barcode: row.barcode || prev.barcode,
        favorite: row.favorite ?? prev.favorite,
        updatedAt: ts,
      }
      // If CSV provides stock in merge mode and product is new match... keep provided stock when defined
      if (row.stock != null) next.stock = row.stock
      toPut.push(next)
      byName.set(key, next)
      if (next.barcode) byBarcode.set(next.barcode, next)
    } else {
      created++
      const next: Product = {
        id: newId('prod'),
        boutiqueId,
        name: row.name.trim(),
        category: row.category?.trim() || 'Divers',
        sellPrice: row.sellPrice,
        buyPrice: row.buyPrice,
        unit: row.unit || 'u',
        stock: row.stock ?? 0,
        alertThreshold: row.alertThreshold ?? 5,
        barcode: row.barcode,
        favorite: row.favorite ?? false,
        archived: false,
        createdAt: ts,
        updatedAt: ts,
      }
      toPut.push(next)
      byName.set(key, next)
      if (next.barcode) byBarcode.set(next.barcode, next)
    }
  }

  await db.products.bulkPut(toPut)
  for (const p of toPut) await trackEntity(boutiqueId, 'products', p.id, p)
  return { created, updated, total: toPut.length }
}

export async function findProductByBarcode(boutiqueId: string, barcode: string) {
  const code = barcode.trim()
  if (!code) return undefined
  return db.products
    .where('boutiqueId')
    .equals(boutiqueId)
    .filter((p) => !p.archived && !!p.barcode && p.barcode === code)
    .first()
}

export async function adjustStock(input: {
  boutiqueId: string
  productId: string
  delta: number
  type: StockMovementType
  userId: string
  reason?: string
  refId?: string
}) {
  const product = await db.products.get(input.productId)
  if (!product) throw new Error('Produit introuvable')
  const ts = now()
  const nextStock = product.stock + input.delta
  const updated: Product = { ...product, stock: nextStock, updatedAt: ts }
  const movement = {
    id: newId('mvt'),
    boutiqueId: input.boutiqueId,
    productId: input.productId,
    type: input.type,
    quantity: input.delta,
    reason: input.reason,
    userId: input.userId,
    refId: input.refId,
    createdAt: ts,
  }
  await db.transaction('rw', db.products, db.stockMovements, async () => {
    await db.products.put(updated)
    await db.stockMovements.put(movement)
  })
  await trackEntity(input.boutiqueId, 'products', updated.id, updated)
  await trackEntity(input.boutiqueId, 'stockMovements', movement.id, movement, 'event')
  return { product: updated, movement }
}

export async function createSale(input: {
  boutiqueId: string
  userId: string
  lines: SaleLine[]
  discount: number
  discountPercent?: number
  paymentMethod: PaymentMethod
  payments: PaymentSplit[]
  cashReceived?: number
  changeGiven?: number
  payCurrency?: PayCurrency
  exchangeRate?: number
  totalInPayCurrency?: number
  receivedInPayCurrency?: number
  changeInPayCurrency?: number
  clientId?: string
  cashSessionId?: string
}) {
  const ts = now()
  const subtotal = input.lines.reduce((s, l) => s + l.lineTotal, 0)
  const total = Math.max(0, subtotal - (input.discount || 0))
  const sale: Sale = {
    id: newId('sale'),
    boutiqueId: input.boutiqueId,
    cashSessionId: input.cashSessionId,
    clientId: input.clientId,
    userId: input.userId,
    lines: input.lines,
    subtotal,
    discount: input.discount || 0,
    discountPercent: input.discountPercent,
    total,
    payCurrency: input.payCurrency,
    exchangeRate: input.exchangeRate,
    totalInPayCurrency: input.totalInPayCurrency,
    receivedInPayCurrency: input.receivedInPayCurrency,
    changeInPayCurrency: input.changeInPayCurrency,
    paymentMethod: input.paymentMethod,
    payments: input.payments,
    cashReceived: input.cashReceived,
    changeGiven: input.changeGiven,
    status: 'validee',
    createdAt: ts,
    updatedAt: ts,
  }

  await db.transaction(
    'rw',
    db.sales,
    db.products,
    db.stockMovements,
    db.clients,
    async () => {
      await db.sales.put(sale)
      for (const line of sale.lines) {
        const product = await db.products.get(line.productId)
        if (!product) continue
        const updated = {
          ...product,
          stock: product.stock - line.quantity,
          updatedAt: ts,
        }
        await db.products.put(updated)
        await db.stockMovements.put({
          id: newId('mvt'),
          boutiqueId: sale.boutiqueId,
          productId: line.productId,
          type: 'vente',
          quantity: -line.quantity,
          userId: sale.userId,
          refId: sale.id,
          createdAt: ts,
        })
      }
      if (sale.clientId) {
        const client = await db.clients.get(sale.clientId)
        if (client) {
          await db.clients.put({
            ...client,
            purchaseCount: client.purchaseCount + 1,
            totalSpent: client.totalSpent + sale.total,
            updatedAt: ts,
          })
        }
      }
    },
  )

  await trackEntity(sale.boutiqueId, 'sales', sale.id, sale)
  const products = await db.products.where('boutiqueId').equals(sale.boutiqueId).toArray()
  for (const p of products) await trackEntity(sale.boutiqueId, 'products', p.id, p)
  const mvts = await db.stockMovements.where('refId').equals(sale.id).toArray()
  for (const m of mvts) await trackEntity(sale.boutiqueId, 'stockMovements', m.id, m, 'event')
  if (sale.clientId) {
    const c = await db.clients.get(sale.clientId)
    if (c) await trackEntity(sale.boutiqueId, 'clients', c.id, c)
  }

  return sale
}

export async function cancelSale(saleId: string, userId: string, reason: string) {
  const sale = await db.sales.get(saleId)
  if (!sale) throw new Error('Vente introuvable')
  if (sale.status === 'annulee') throw new Error('Déjà annulée')
  if (sale.createdAt < startOfDay()) throw new Error('Annulation limitée aux ventes du jour')

  const ts = now()
  const updated: Sale = {
    ...sale,
    status: 'annulee',
    cancelReason: reason,
    updatedAt: ts,
  }

  await db.transaction('rw', db.sales, db.products, db.stockMovements, db.clients, async () => {
    await db.sales.put(updated)
    for (const line of sale.lines) {
      const product = await db.products.get(line.productId)
      if (!product) continue
      const restored = { ...product, stock: product.stock + line.quantity, updatedAt: ts }
      await db.products.put(restored)
      await db.stockMovements.put({
        id: newId('mvt'),
        boutiqueId: sale.boutiqueId,
        productId: line.productId,
        type: 'annulation',
        quantity: line.quantity,
        reason,
        userId,
        refId: sale.id,
        createdAt: ts,
      })
    }
    if (sale.clientId) {
      const client = await db.clients.get(sale.clientId)
      if (client) {
        await db.clients.put({
          ...client,
          purchaseCount: Math.max(0, client.purchaseCount - 1),
          totalSpent: Math.max(0, client.totalSpent - sale.total),
          updatedAt: ts,
        })
      }
    }
  })

  await trackEntity(sale.boutiqueId, 'sales', updated.id, updated)
  return updated
}

export async function upsertClient(
  input: Partial<Client> & { boutiqueId: string; name: string },
) {
  const ts = now()
  const existing = input.id ? await db.clients.get(input.id) : undefined
  const client: Client = {
    id: existing?.id || newId('cli'),
    boutiqueId: input.boutiqueId,
    name: input.name.trim(),
    phone: input.phone,
    notes: input.notes,
    purchaseCount: existing?.purchaseCount || 0,
    totalSpent: existing?.totalSpent || 0,
    createdAt: existing?.createdAt || ts,
    updatedAt: ts,
  }
  await db.clients.put(client)
  await trackEntity(client.boutiqueId, 'clients', client.id, client)
  return client
}

export async function startInventory(boutiqueId: string, userId: string) {
  const ts = now()
  const session: InventorySession = {
    id: newId('inv'),
    boutiqueId,
    userId,
    status: 'en_cours',
    createdAt: ts,
    updatedAt: ts,
  }
  const products = await db.products
    .where('boutiqueId')
    .equals(boutiqueId)
    .filter((p) => !p.archived)
    .toArray()
  const lines: InventoryLine[] = products.map((p) => ({
    id: newId('invl'),
    sessionId: session.id,
    boutiqueId,
    productId: p.id,
    theoreticalQty: p.stock,
    counted: false,
    updatedAt: ts,
  }))

  await db.transaction('rw', db.inventorySessions, db.inventoryLines, async () => {
    await db.inventorySessions.put(session)
    await db.inventoryLines.bulkPut(lines)
  })
  await trackEntity(boutiqueId, 'inventorySessions', session.id, session)
  for (const l of lines) await trackEntity(boutiqueId, 'inventoryLines', l.id, l)
  return session
}

export async function countInventoryLine(lineId: string, countedQty: number) {
  const line = await db.inventoryLines.get(lineId)
  if (!line) throw new Error('Ligne introuvable')
  const session = await db.inventorySessions.get(line.sessionId)
  if (!session || session.status !== 'en_cours') throw new Error('Session non modifiable')
  const updated: InventoryLine = {
    ...line,
    countedQty,
    counted: true,
    updatedAt: now(),
  }
  await db.inventoryLines.put(updated)
  await trackEntity(line.boutiqueId, 'inventoryLines', updated.id, updated)
  return updated
}

export async function validateInventory(sessionId: string, validatedBy: string) {
  const session = await db.inventorySessions.get(sessionId)
  if (!session) throw new Error('Session introuvable')
  if (session.status !== 'en_cours') throw new Error('Session déjà clôturée')
  const lines = await db.inventoryLines.where('sessionId').equals(sessionId).toArray()
  const ts = now()

  await db.transaction(
    'rw',
    db.inventorySessions,
    db.inventoryLines,
    db.products,
    db.stockMovements,
    async () => {
      for (const line of lines) {
        if (!line.counted || line.countedQty == null) continue
        const delta = line.countedQty - line.theoreticalQty
        if (delta === 0) continue
        const product = await db.products.get(line.productId)
        if (!product) continue
        const updated = { ...product, stock: line.countedQty, updatedAt: ts }
        await db.products.put(updated)
        await db.stockMovements.put({
          id: newId('mvt'),
          boutiqueId: session.boutiqueId,
          productId: product.id,
          type: 'inventaire',
          quantity: delta,
          reason: `Inventaire ${session.id}`,
          userId: validatedBy,
          refId: session.id,
          createdAt: ts,
        })
      }
      const done: InventorySession = {
        ...session,
        status: 'valide',
        validatedAt: ts,
        validatedBy,
        updatedAt: ts,
      }
      await db.inventorySessions.put(done)
    },
  )

  const done = await db.inventorySessions.get(sessionId)
  if (done) await trackEntity(session.boutiqueId, 'inventorySessions', done.id, done)
  return done
}

export async function cancelInventory(sessionId: string) {
  const session = await db.inventorySessions.get(sessionId)
  if (!session) throw new Error('Session introuvable')
  const updated: InventorySession = {
    ...session,
    status: 'annule',
    updatedAt: now(),
  }
  await db.inventorySessions.put(updated)
  await trackEntity(session.boutiqueId, 'inventorySessions', updated.id, updated)
  return updated
}

export async function openCashSession(boutiqueId: string, userId: string, openingFloat: number) {
  const open = await db.cashSessions
    .where('boutiqueId')
    .equals(boutiqueId)
    .filter((s) => s.status === 'ouverte')
    .first()
  if (open) throw new Error('Une session de caisse est déjà ouverte')
  const ts = now()
  const session: CashSession = {
    id: newId('cash'),
    boutiqueId,
    openedBy: userId,
    status: 'ouverte',
    openingFloat,
    openedAt: ts,
    updatedAt: ts,
  }
  await db.cashSessions.put(session)
  await trackEntity(boutiqueId, 'cashSessions', session.id, session)
  return session
}

export async function closeCashSession(
  sessionId: string,
  closedBy: string,
  closingCashCounted: number,
  notes?: string,
  closingCashCountedUsd = 0,
) {
  const session = await db.cashSessions.get(sessionId)
  if (!session || session.status !== 'ouverte') throw new Error('Session invalide')

  const sales = await db.sales
    .where('boutiqueId')
    .equals(session.boutiqueId)
    .filter(
      (s) =>
        s.status === 'validee' &&
        s.cashSessionId === session.id,
    )
    .toArray()

  let expectedCash = session.openingFloat
  let expectedCashUsd = session.openingFloatUsd || 0
  let expectedMobileMoney = 0
  for (const sale of sales) {
    for (const p of sale.payments) {
      if (p.method === 'mobile_money') {
        expectedMobileMoney += p.amount
        continue
      }
      if (p.method === 'especes') {
        if (sale.payCurrency === 'USD') {
          expectedCashUsd += sale.totalInPayCurrency ?? p.amount
        } else {
          expectedCash += p.amount
        }
      }
    }
  }

  const ts = now()
  const updated: CashSession = {
    ...session,
    status: 'cloturee',
    closedBy,
    closingCashCounted,
    closingCashCountedUsd,
    expectedCash,
    expectedCashUsd,
    expectedMobileMoney,
    ticketCount: sales.length,
    cashVariance: closingCashCounted - expectedCash,
    cashVarianceUsd: closingCashCountedUsd - expectedCashUsd,
    notes,
    closedAt: ts,
    updatedAt: ts,
  }
  await db.cashSessions.put(updated)
  await trackEntity(session.boutiqueId, 'cashSessions', updated.id, updated)
  return updated
}

export async function getOpenCashSession(boutiqueId: string) {
  return db.cashSessions
    .where('boutiqueId')
    .equals(boutiqueId)
    .filter((s) => s.status === 'ouverte')
    .first()
}

export async function todayStats(boutiqueId: string) {
  const from = startOfDay()
  const to = endOfDay()
  const yesterdayFrom = from - 24 * 60 * 60 * 1000
  const yesterdayTo = from - 1

  const sales = await db.sales
    .where('boutiqueId')
    .equals(boutiqueId)
    .filter((s) => s.status === 'validee' && s.createdAt >= from && s.createdAt <= to)
    .toArray()
  const yesterdaySales = await db.sales
    .where('boutiqueId')
    .equals(boutiqueId)
    .filter(
      (s) =>
        s.status === 'validee' && s.createdAt >= yesterdayFrom && s.createdAt <= yesterdayTo,
    )
    .toArray()

  const ca = sales.reduce((s, v) => s + v.total, 0)
  const yesterdayCount = yesterdaySales.length

  let cashFc = 0
  let cashUsd = 0
  let mobileMoney = 0
  for (const sale of sales) {
    for (const p of sale.payments) {
      if (p.method === 'mobile_money') {
        mobileMoney += p.amount
        continue
      }
      if (p.method === 'especes') {
        if (sale.payCurrency === 'USD') {
          cashUsd += sale.totalInPayCurrency ?? p.amount
        } else {
          cashFc += p.amount
        }
      }
    }
  }

  const lowStockProducts = await db.products
    .where('boutiqueId')
    .equals(boutiqueId)
    .filter((p) => !p.archived && p.stock <= p.alertThreshold)
    .toArray()
  lowStockProducts.sort((a, b) => a.stock - b.stock)

  const inv = await db.inventorySessions
    .where('boutiqueId')
    .equals(boutiqueId)
    .filter((s) => s.status === 'en_cours')
    .first()

  const vsYesterday =
    yesterdayCount === 0
      ? null
      : Math.round(((sales.length - yesterdayCount) / yesterdayCount) * 100)

  return {
    ca,
    count: sales.length,
    avg: sales.length ? ca / sales.length : 0,
    lowStock: lowStockProducts.length,
    lowStockProducts: lowStockProducts.slice(0, 5),
    inventoryInProgress: inv || null,
    sales,
    payments: { cashFc, cashUsd, mobileMoney },
    vsYesterday,
  }
}

export async function monthAnalytics(
  boutiqueId: string,
  year: number,
  month: number,
  usdRateCdf = 0,
) {
  const from = startOfMonth(year, month)
  const to = endOfMonth(year, month)
  const dayCount = daysInMonth(year, month)

  const prevDate = new Date(year, month - 1, 1)
  const prevFrom = startOfMonth(prevDate.getFullYear(), prevDate.getMonth())
  const prevTo = endOfMonth(prevDate.getFullYear(), prevDate.getMonth())

  const core = await buildAnalyticsCore({
    boutiqueId,
    from,
    to,
    usdRateCdf,
    bucketCount: dayCount,
    bucketIndex: (ts) => new Date(ts).getDate() - 1,
    prevFrom,
    prevTo,
  })

  return {
    mode: 'month' as const,
    year,
    month,
    from,
    to,
    dayCount,
    ...core,
  }
}

export async function weekAnalytics(boutiqueId: string, weekStartTs: number, usdRateCdf = 0) {
  const from = startOfWeek(weekStartTs)
  const to = endOfWeek(weekStartTs)
  const prevFrom = startOfWeek(from - 1)
  const prevTo = endOfWeek(from - 1)

  const core = await buildAnalyticsCore({
    boutiqueId,
    from,
    to,
    usdRateCdf,
    bucketCount: 7,
    bucketIndex: mondayBasedDayIndex,
    prevFrom,
    prevTo,
  })

  // Même numéro de semaine relative dans le mois précédent (lundi ≈ -1 mois)
  const anchor = new Date(from)
  const prevMonthAnchor = new Date(anchor.getFullYear(), anchor.getMonth() - 1, anchor.getDate())
  const monthCmpFrom = startOfWeek(prevMonthAnchor.getTime())
  const monthCmpTo = endOfWeek(prevMonthAnchor.getTime())
  const monthCmp = await buildAnalyticsCore({
    boutiqueId,
    from,
    to,
    usdRateCdf,
    bucketCount: 7,
    bucketIndex: mondayBasedDayIndex,
    prevFrom: monthCmpFrom,
    prevTo: monthCmpTo,
  })

  return {
    mode: 'week' as const,
    from,
    to,
    dayCount: 7,
    ...core,
    revenueVsPrevMonth: monthCmp.revenueVsPrev,
    expensesVsPrevMonth: monthCmp.expensesVsPrev,
  }
}

async function buildAnalyticsCore(input: {
  boutiqueId: string
  from: number
  to: number
  usdRateCdf: number
  bucketCount: number
  bucketIndex: (ts: number) => number
  prevFrom: number
  prevTo: number
}) {
  const { boutiqueId, from, to, usdRateCdf, bucketCount, bucketIndex, prevFrom, prevTo } = input

  const sales = await db.sales
    .where('boutiqueId')
    .equals(boutiqueId)
    .filter((s) => s.status === 'validee' && s.createdAt >= from && s.createdAt <= to)
    .toArray()

  const expenses = await db.expenses
    .where('boutiqueId')
    .equals(boutiqueId)
    .filter((e) => e.createdAt >= from && e.createdAt <= to)
    .toArray()

  const revenueFc = sales.reduce((sum, s) => sum + s.total, 0)

  let expensesFc = 0
  const expenseByCategory: Record<string, number> = {}
  for (const e of expenses) {
    const fc =
      e.currency === 'USD'
        ? hasValidUsdRate(usdRateCdf)
          ? usdToCdf(e.amount, usdRateCdf)
          : 0
        : e.amount
    expensesFc += fc
    expenseByCategory[e.category] = (expenseByCategory[e.category] || 0) + fc
  }

  const dailyRevenue = Array.from({ length: bucketCount }, () => 0)
  for (const s of sales) {
    const idx = bucketIndex(s.createdAt)
    if (idx >= 0 && idx < bucketCount) dailyRevenue[idx] += s.total
  }

  const productMap = new Map<string, { name: string; qty: number; revenue: number }>()
  for (const s of sales) {
    for (const line of s.lines) {
      const cur = productMap.get(line.productId) || {
        name: line.productName,
        qty: 0,
        revenue: 0,
      }
      cur.qty += line.quantity
      cur.revenue += line.lineTotal
      productMap.set(line.productId, cur)
    }
  }
  const topProducts = [...productMap.values()]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)

  const expenseBreakdown = Object.entries(expenseByCategory)
    .map(([category, amount]) => ({
      category,
      amount,
      percent: expensesFc > 0 ? Math.round((amount / expensesFc) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount)

  const prevSales = await db.sales
    .where('boutiqueId')
    .equals(boutiqueId)
    .filter((s) => s.status === 'validee' && s.createdAt >= prevFrom && s.createdAt <= prevTo)
    .toArray()
  const prevExpenses = await db.expenses
    .where('boutiqueId')
    .equals(boutiqueId)
    .filter((e) => e.createdAt >= prevFrom && e.createdAt <= prevTo)
    .toArray()

  const prevRevenueFc = prevSales.reduce((sum, s) => sum + s.total, 0)
  let prevExpensesFc = 0
  for (const e of prevExpenses) {
    prevExpensesFc +=
      e.currency === 'USD'
        ? hasValidUsdRate(usdRateCdf)
          ? usdToCdf(e.amount, usdRateCdf)
          : 0
        : e.amount
  }

  function vsPrev(current: number, previous: number): number | null {
    if (previous <= 0) return null
    return Math.round(((current - previous) / previous) * 100)
  }

  return {
    revenueFc,
    expensesFc,
    saleCount: sales.length,
    dailyRevenue,
    topProducts,
    expenseBreakdown,
    prevRevenueFc,
    prevExpensesFc,
    revenueVsPrev: vsPrev(revenueFc, prevRevenueFc),
    expensesVsPrev: vsPrev(expensesFc, prevExpensesFc),
  }
}

export async function updateBoutiqueCurrency(boutiqueId: string, currency: string) {
  const boutique = await db.boutiques.get(boutiqueId)
  if (!boutique) throw new Error('Boutique introuvable')
  const updated = { ...boutique, currency, updatedAt: now() }
  await db.boutiques.put(updated)
  await trackEntity(boutiqueId, 'boutiques', updated.id, updated)
  return updated
}

export async function updateBoutiqueFxRate(boutiqueId: string, usdRateCdf: number) {
  if (!usdRateCdf || usdRateCdf <= 0) throw new Error('Taux invalide')
  const boutique = await db.boutiques.get(boutiqueId)
  if (!boutique) throw new Error('Boutique introuvable')
  const ts = now()
  const updated = {
    ...boutique,
    usdRateCdf,
    usdRateUpdatedAt: ts,
    updatedAt: ts,
  }
  await db.boutiques.put(updated)
  await trackEntity(boutiqueId, 'boutiques', updated.id, updated)
  return updated
}

/** Migre une boutique existante vers CDF + taux USD (Kinshasa) */
export async function ensureKinshasaDefaults(boutiqueId: string) {
  const boutique = await db.boutiques.get(boutiqueId)
  if (!boutique) return null
  const ts = now()
  let changed = false
  const updated = { ...boutique }

  if (!updated.usdRateCdf || updated.usdRateCdf <= 0) {
    updated.usdRateCdf = 2800
    updated.usdRateUpdatedAt = ts
    changed = true
  }

  // Anciennes boutiques créées en FCFA → Franc congolais
  if (updated.currency === 'XOF' || updated.currency === 'XAF' || !updated.currency) {
    updated.currency = 'CDF'
    changed = true
  }

  if (!changed) return boutique

  updated.updatedAt = ts
  await db.boutiques.put(updated)
  await trackEntity(boutiqueId, 'boutiques', updated.id, updated)
  return updated
}

/** Bouton unique : CDF + taux du jour */
export async function activateKinshasaMode(boutiqueId: string, usdRateCdf = 2800) {
  const boutique = await db.boutiques.get(boutiqueId)
  if (!boutique) throw new Error('Boutique introuvable')
  const ts = now()
  const updated = {
    ...boutique,
    currency: 'CDF',
    usdRateCdf,
    usdRateUpdatedAt: ts,
    updatedAt: ts,
  }
  await db.boutiques.put(updated)
  await trackEntity(boutiqueId, 'boutiques', updated.id, updated)
  return updated
}

export async function updateBoutiquePrinterSettings(
  boutiqueId: string,
  settings: { paperWidthMm?: 58 | 80; autoPrintTicket?: boolean },
) {
  const boutique = await db.boutiques.get(boutiqueId)
  if (!boutique) throw new Error('Boutique introuvable')
  const updated = {
    ...boutique,
    ...settings,
    updatedAt: now(),
  }
  await db.boutiques.put(updated)
  await trackEntity(boutiqueId, 'boutiques', updated.id, updated)
  return updated
}

export async function createExpense(input: {
  boutiqueId: string
  userId: string
  amount: number
  currency: PayCurrency
  category: ExpenseCategory
  description?: string
}) {
  if (!(input.amount > 0)) throw new Error('Montant invalide')
  const open = await getOpenCashSession(input.boutiqueId)
  const ts = now()
  const expense: Expense = {
    id: newId('exp'),
    boutiqueId: input.boutiqueId,
    userId: input.userId,
    amount: input.amount,
    currency: input.currency,
    category: input.category,
    description: input.description?.trim() || undefined,
    cashSessionId: open?.id,
    createdAt: ts,
    updatedAt: ts,
  }
  await db.expenses.put(expense)
  await trackEntity(input.boutiqueId, 'expenses', expense.id, expense)
  return expense
}
