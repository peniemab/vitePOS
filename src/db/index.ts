import Dexie, { type EntityTable } from 'dexie'
import type {
  AppMeta,
  Boutique,
  CashSession,
  Client,
  Expense,
  InventoryLine,
  InventorySession,
  OutboxItem,
  Product,
  Sale,
  StockMovement,
  User,
} from './types'

export class BoutiqueDB extends Dexie {
  boutiques!: EntityTable<Boutique, 'id'>
  users!: EntityTable<User, 'id'>
  products!: EntityTable<Product, 'id'>
  stockMovements!: EntityTable<StockMovement, 'id'>
  clients!: EntityTable<Client, 'id'>
  sales!: EntityTable<Sale, 'id'>
  inventorySessions!: EntityTable<InventorySession, 'id'>
  inventoryLines!: EntityTable<InventoryLine, 'id'>
  cashSessions!: EntityTable<CashSession, 'id'>
  expenses!: EntityTable<Expense, 'id'>
  outbox!: EntityTable<OutboxItem, 'id'>
  meta!: EntityTable<AppMeta, 'id'>

  constructor() {
    super('boutiqueLocale')
    this.version(1).stores({
      boutiques: 'id, inviteCode',
      users: 'id, boutiqueId, role',
      products: 'id, boutiqueId, name, category, archived, favorite, stock',
      stockMovements: 'id, boutiqueId, productId, createdAt, type',
      clients: 'id, boutiqueId, name',
      sales: 'id, boutiqueId, createdAt, status, clientId, cashSessionId',
      inventorySessions: 'id, boutiqueId, status, createdAt',
      inventoryLines: 'id, sessionId, boutiqueId, productId, counted',
      cashSessions: 'id, boutiqueId, status, openedAt',
      outbox: 'id, boutiqueId, syncedAt, createdAt',
      meta: 'id',
    })
    this.version(2).stores({
      stockMovements: 'id, boutiqueId, productId, createdAt, type, refId',
    })
    this.version(3).stores({
      products: 'id, boutiqueId, name, category, archived, favorite, stock, barcode',
    })
    this.version(4).stores({
      expenses: 'id, boutiqueId, createdAt, category, cashSessionId',
    })
  }
}

export const db = new BoutiqueDB()
