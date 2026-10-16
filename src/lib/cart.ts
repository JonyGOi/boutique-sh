import type { CartItem, Product, ValidatedLine } from '../types/product'
import { effectivePriceCents, subtotalCents } from './money'
import { getColorName, getColorSizes } from './colors'

export const CART_STORAGE_KEY = 'sh-boutique-cart-v1'

export function readCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .map(normalizeItem)
      .filter((item): item is CartItem => item !== null)
  } catch {
    return []
  }
}

export function writeCart(items: CartItem[]): void {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
}

function normalizeItem(value: unknown): CartItem | null {
  if (!value || typeof value !== 'object') return null
  const item = value as Record<string, unknown>
  if (typeof item.productId !== 'string' || !item.productId) return null
  const quantity = Number(item.quantity)
  if (!Number.isInteger(quantity) || quantity < 1) return null
  return {
    productId: item.productId,
    size: typeof item.size === 'string' && item.size ? item.size : null,
    color: typeof item.color === 'string' && item.color ? item.color : null,
    quantity,
  }
}

export function cartKey(item: Pick<CartItem, 'productId' | 'size' | 'color'>): string {
  return `${item.productId}::${item.size ?? ''}::${item.color ?? ''}`
}

export function upsertCartItem(items: CartItem[], incoming: CartItem): CartItem[] {
  const key = cartKey(incoming)
  const existing = items.find((i) => cartKey(i) === key)
  if (!existing) return [...items, incoming]
  return items.map((i) =>
    cartKey(i) === key ? { ...i, quantity: i.quantity + incoming.quantity } : i,
  )
}

export function validateCartAgainstCatalog(
  items: CartItem[],
  products: Product[],
): { lines: ValidatedLine[]; errors: string[] } {
  const byId = new Map(products.map((p) => [p.id, p]))
  const lines: ValidatedLine[] = []
  const errors: string[] = []

  for (const item of items) {
    if (!Number.isInteger(item.quantity) || item.quantity < 1) {
      errors.push('Há uma quantidade inválida no carrinho.')
      continue
    }
    const product = byId.get(item.productId)
    if (!product || !product.published || product.archived || !product.available) {
      errors.push('Um produto do carrinho não está mais disponível.')
      continue
    }
    // Validação da cor selecionada (compatível com nomes puros ou formato Nome|#hex|tamanhos)
    let matchedColorEntry: string | null = null
    if (product.colors.length > 0) {
      if (!item.color) {
        errors.push(`Selecione uma cor válida para ${product.name}.`)
        continue
      }
      const itemColorClean = item.color.trim().toLowerCase()
      matchedColorEntry =
        product.colors.find(
          (c) =>
            getColorName(c).trim().toLowerCase() === itemColorClean ||
            c.trim().toLowerCase() === itemColorClean,
        ) ?? null

      if (!matchedColorEntry) {
        errors.push(`Selecione uma cor válida para ${product.name}.`)
        continue
      }
    }

    // Validação do tamanho selecionado (considerando tamanhos específicos da cor ou gerais da peça)
    const colorSpecificSizes = matchedColorEntry ? getColorSizes(matchedColorEntry) : null
    const validSizes =
      colorSpecificSizes && colorSpecificSizes.length > 0
        ? colorSpecificSizes
        : product.sizes.length > 0
        ? product.sizes
        : []

    if (validSizes.length > 0) {
      const itemSizeClean = item.size?.trim().toUpperCase()
      const sizeMatch = itemSizeClean
        ? validSizes.some((s) => s.trim().toUpperCase() === itemSizeClean)
        : false
      if (!sizeMatch) {
        errors.push(`Selecione um tamanho válido para ${product.name}.`)
        continue
      }
    }
    if (product.track_stock) {
      const stock = product.stock ?? 0
      if (stock < item.quantity) {
        errors.push(`${product.name} não possui estoque suficiente.`)
        continue
      }
    }
    const unitCents = effectivePriceCents(product)
    if (!Number.isInteger(unitCents) || unitCents < 0) {
      errors.push(`Preço inválido para ${product.name}.`)
      continue
    }
    lines.push({
      product,
      size: item.size,
      color: item.color,
      quantity: item.quantity,
      unitCents,
      subtotalCents: subtotalCents(unitCents, item.quantity),
    })
  }

  return { lines, errors }
}

export function totalCents(lines: ValidatedLine[]): number {
  return lines.reduce((sum, line) => sum + line.subtotalCents, 0)
}
