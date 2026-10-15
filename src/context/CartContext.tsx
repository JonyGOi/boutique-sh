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

type CartContextValue = {
  items: CartItem[]
  count: number
  addItem: (item: CartItem) => void
  setQuantity: (item: CartItem, quantity: number) => void
  removeItem: (item: CartItem) => void
  clear: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() =>
    typeof window === 'undefined' ? [] : readCart(),
  )

  const persist = useCallback((next: CartItem[]) => {
    setItems(next)
    writeCart(next)
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

  const clear = useCallback(() => persist([]), [persist])

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      count: items.reduce((sum, item) => sum + item.quantity, 0),
      addItem,
      setQuantity,
      removeItem,
      clear,
    }),
    [items, addItem, setQuantity, removeItem, clear],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart deve ser usado dentro de CartProvider.')
  return ctx
}
