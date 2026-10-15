import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { cartKey, readCart, upsertCartItem, writeCart } from '../lib/cart'
import type { CartItem } from '../types/product'
import type { Coupon } from '../types/coupon'

const COUPON_STORAGE_KEY = 'sh_boutique_applied_coupon'

function readSavedCoupon(): Coupon | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(COUPON_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Coupon) : null
  } catch {
    return null
  }
}

function writeSavedCoupon(coupon: Coupon | null): void {
  if (typeof window === 'undefined') return
  try {
    if (coupon) {
      localStorage.setItem(COUPON_STORAGE_KEY, JSON.stringify(coupon))
    } else {
      localStorage.removeItem(COUPON_STORAGE_KEY)
    }
  } catch (err) {
    console.error('Falha ao salvar cupom no storage:', err)
  }
}

type CartContextValue = {
  items: CartItem[]
  count: number
  addItem: (item: CartItem) => void
  setQuantity: (item: CartItem, quantity: number) => void
  removeItem: (item: CartItem) => void
  clear: () => void
  appliedCoupon: Coupon | null
  applyCoupon: (coupon: Coupon | null) => void
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() =>
    typeof window === 'undefined' ? [] : readCart(),
  )
  const [appliedCoupon, setAppliedCouponState] = useState<Coupon | null>(() => readSavedCoupon())

  const persist = useCallback((next: CartItem[]) => {
    setItems(next)
    writeCart(next)
  }, [])

  const applyCoupon = useCallback((coupon: Coupon | null) => {
    setAppliedCouponState(coupon)
    writeSavedCoupon(coupon)
  }, [])

  const addItem = useCallback(
    (item: CartItem) => {
      if (!Number.isInteger(item.quantity) || item.quantity < 1) return
      persist(upsertCartItem(readCart(), item))
    },
    [persist],
  )

  const setQuantity = useCallback(
    (item: CartItem, quantity: number) => {
      if (!Number.isInteger(quantity) || quantity < 1) return
      persist(
        readCart().map((current) =>
          cartKey(current) === cartKey(item) ? { ...current, quantity } : current,
        ),
      )
    },
    [persist],
  )

  const removeItem = useCallback(
    (item: CartItem) => {
      persist(readCart().filter((current) => cartKey(current) !== cartKey(item)))
    },
    [persist],
  )

  const clear = useCallback(() => {
    persist([])
    applyCoupon(null)
  }, [persist, applyCoupon])

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      count: items.reduce((sum, item) => sum + item.quantity, 0),
      addItem,
      setQuantity,
      removeItem,
      clear,
      appliedCoupon,
      applyCoupon,
    }),
    [items, addItem, setQuantity, removeItem, clear, appliedCoupon, applyCoupon],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart deve ser usado dentro de CartProvider.')
  return ctx
}
