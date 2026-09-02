'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import type { Product, SaleLine } from '../db/types'

export interface CartLine extends SaleLine {}

interface CartCtx {
  lines: CartLine[]
  /** Remise en pourcentage (0–100) */
  discountPercent: number
  /** Montant de remise calculé depuis le % */
  discount: number
  clientId?: string
  addProduct: (product: Product, qty?: number) => void
  setQty: (productId: string, qty: number) => void
  setLineDiscount: (productId: string, discount: number) => void
  setDiscountPercent: (n: number) => void
  setClientId: (id?: string) => void
  clear: () => void
  subtotal: number
  total: number
}

const CartContext = createContext<CartCtx | null>(null)

function recalc(line: CartLine): CartLine {
  const lineTotal = Math.max(0, line.unitPrice * line.quantity - line.lineDiscount)
  return { ...line, lineTotal }
}

function roundMoney(n: number) {
  return Math.round(n)
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([])
  const [discountPercent, setDiscountPercentState] = useState(0)
  const [clientId, setClientId] = useState<string | undefined>()

  const addProduct = useCallback((product: Product, qty = 1) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.productId === product.id)
      if (existing) {
        return prev.map((l) =>
          l.productId === product.id
            ? recalc({ ...l, quantity: l.quantity + qty })
            : l,
        )
      }
      return [
        ...prev,
        recalc({
          productId: product.id,
          productName: product.name,
          unitPrice: product.sellPrice,
          quantity: qty,
          lineDiscount: 0,
          lineTotal: product.sellPrice * qty,
        }),
      ]
    })
  }, [])

  const setQty = useCallback((productId: string, qty: number) => {
    setLines((prev) =>
      prev
        .map((l) => (l.productId === productId ? recalc({ ...l, quantity: qty }) : l))
        .filter((l) => l.quantity > 0),
    )
  }, [])

  const setLineDiscount = useCallback((productId: string, d: number) => {
    setLines((prev) =>
      prev.map((l) => (l.productId === productId ? recalc({ ...l, lineDiscount: d }) : l)),
    )
  }, [])

  const setDiscountPercent = useCallback((n: number) => {
    const clamped = Math.min(100, Math.max(0, n))
    setDiscountPercentState(clamped)
  }, [])

  const clear = useCallback(() => {
    setLines([])
    setDiscountPercentState(0)
    setClientId(undefined)
  }, [])

  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0)
  const discount = roundMoney((subtotal * discountPercent) / 100)
  const total = Math.max(0, subtotal - discount)

  const value = useMemo(
    () => ({
      lines,
      discountPercent,
      discount,
      clientId,
      addProduct,
      setQty,
      setLineDiscount,
      setDiscountPercent,
      setClientId,
      clear,
      subtotal,
      total,
    }),
    [
      lines,
      discountPercent,
      discount,
      clientId,
      addProduct,
      setQty,
      setLineDiscount,
      setDiscountPercent,
      clear,
      subtotal,
      total,
    ],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart hors CartProvider')
  return ctx
}
