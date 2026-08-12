export type Role = 'proprietaire' | 'gerant' | 'vendeur'

export type StockMovementType =
  | 'vente'
  | 'reappro'
  | 'casse'
  | 'don'
  | 'correction'
  | 'inventaire'
  | 'annulation'

export type PaymentMethod = 'especes' | 'mobile_money' | 'mixte'

export type InventoryStatus = 'en_cours' | 'valide' | 'annule'

export type CashSessionStatus = 'ouverte' | 'cloturee'

export type SyncStatus = 'online' | 'offline' | 'syncing' | 'conflict'

export type PayCurrency = 'CDF' | 'USD'

export type ExpenseCategory =
  | 'transport'
  | 'fournitures'
  | 'loyer'
  | 'communication'
  | 'autres'

export interface Boutique {
  id: string
  name: string
  /** Devise d’affichage / prix (CDF pour Kinshasa) */
  currency: string
  inviteCode: string
  /**
   * Taux du jour : combien de francs congolais pour 1 USD.
   * Ex. 2850 → 1 $ = 2 850 FC
   */
  usdRateCdf?: number
  /** Date de mise à jour du taux */
  usdRateUpdatedAt?: number
  /** Largeur papier ticket thermique */
  paperWidthMm?: 58 | 80
  /** Imprimer automatiquement après encaissement */
  autoPrintTicket?: boolean
  createdAt: number
  updatedAt: number
}

export interface User {
  id: string
  boutiqueId: string
  name: string
  role: Role
  pinHash: string
  active: boolean
  phone?: string
  /** Photo profil (data URL, optionnel) */
  avatarDataUrl?: string
  /** Overrides optionnels (sinon dérivés du rôle) */
  permissions?: Partial<UserPermissions>
  createdAt: number
  updatedAt: number
}

export interface UserPermissions {
  viewReports: boolean
  editPrices: boolean
  closeCash: boolean
  manageStock: boolean
}

export interface Product {
  id: string
  boutiqueId: string
  name: string
  category: string
  sellPrice: number
  buyPrice?: number
  unit: string
  stock: number
  alertThreshold: number
  barcode?: string
  favorite: boolean
  archived: boolean
  createdAt: number
  updatedAt: number
}

export interface StockMovement {
  id: string
  boutiqueId: string
  productId: string
  type: StockMovementType
  quantity: number
  reason?: string
  userId: string
  refId?: string
  createdAt: number
}

export interface Client {
  id: string
  boutiqueId: string
  name: string
  phone?: string
  notes?: string
  purchaseCount: number
  totalSpent: number
  createdAt: number
  updatedAt: number
}

export interface SaleLine {
  productId: string
  productName: string
  unitPrice: number
  quantity: number
  lineDiscount: number
  lineTotal: number
}

export interface PaymentSplit {
  method: 'especes' | 'mobile_money'
  amount: number
}

export interface Sale {
  id: string
  boutiqueId: string
  cashSessionId?: string
  clientId?: string
  userId: string
  lines: SaleLine[]
  subtotal: number
  discount: number
  /** Remise en % si appliquée (ex. 10 pour 10 %) */
  discountPercent?: number
  total: number
  /** Devise réellement encaissée (FC ou $) */
  payCurrency?: PayCurrency
  /** Taux utilisé (FC pour 1 USD) au moment de la vente */
  exchangeRate?: number
  /** Total exprimé dans la devise de paiement */
  totalInPayCurrency?: number
  /** Montant reçu dans la devise de paiement */
  receivedInPayCurrency?: number
  /** Rendu dans la devise de paiement */
  changeInPayCurrency?: number
  paymentMethod: PaymentMethod
  payments: PaymentSplit[]
  cashReceived?: number
  changeGiven?: number
  status: 'validee' | 'annulee'
  cancelReason?: string
  createdAt: number
  updatedAt: number
}

export interface InventorySession {
  id: string
  boutiqueId: string
  userId: string
  status: InventoryStatus
  createdAt: number
  validatedAt?: number
  validatedBy?: string
  updatedAt: number
}

export interface InventoryLine {
  id: string
  sessionId: string
  boutiqueId: string
  productId: string
  theoreticalQty: number
  countedQty?: number
  counted: boolean
  updatedAt: number
}

export interface CashSession {
  id: string
  boutiqueId: string
  openedBy: string
  closedBy?: string
  status: CashSessionStatus
  openingFloat: number
  /** Fond de caisse en USD (optionnel) */
  openingFloatUsd?: number
  closingCashCounted?: number
  closingCashCountedUsd?: number
  expectedCash?: number
  expectedCashUsd?: number
  expectedMobileMoney?: number
  ticketCount?: number
  cashVariance?: number
  cashVarianceUsd?: number
  notes?: string
  openedAt: number
  closedAt?: number
  updatedAt: number
}

export interface Expense {
  id: string
  boutiqueId: string
  userId: string
  amount: number
  currency: PayCurrency
  category: ExpenseCategory
  description?: string
  cashSessionId?: string
  createdAt: number
  updatedAt: number
}

export interface OutboxItem {
  id: string
  boutiqueId: string
  table:
    | 'boutiques'
    | 'users'
    | 'products'
    | 'clients'
    | 'sales'
    | 'stockMovements'
    | 'inventorySessions'
    | 'inventoryLines'
    | 'cashSessions'
    | 'expenses'
  entityId: string
  payload: unknown
  kind: 'upsert' | 'event'
  createdAt: number
  syncedAt?: number
}

export interface AppMeta {
  id: string
  boutiqueId?: string
  currentUserId?: string
  lastSyncAt?: number
  syncRevision?: number
  authToken?: string
}
