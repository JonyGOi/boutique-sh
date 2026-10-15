export function formatBRL(cents: number): string {
  if (!Number.isInteger(cents)) {
    throw new Error('Valores monetários devem ser inteiros em centavos.')
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100)
}

export function parseBRLToCents(input: string): number | null {
  const trimmed = input.trim()
  if (!trimmed) return null
  const normalized = trimmed.replace(/\s/g, '').replace(/\./g, '').replace(',', '.')
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null
  const [reais, frac = ''] = normalized.split('.')
  const cents = Number(reais) * 100 + Number(frac.padEnd(2, '0').slice(0, 2))
  if (!Number.isInteger(cents) || cents < 0) return null
  return cents
}

export function subtotalCents(unitCents: number, quantity: number): number {
  if (!Number.isInteger(unitCents) || unitCents < 0) {
    throw new Error('Preço unitário inválido.')
  }
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new Error('Quantidade inválida.')
  }
  return unitCents * quantity
}

export function effectivePriceCents(product: {
  price_cents: number
  is_promo: boolean
  promo_price_cents: number | null
}): number {
  if (
    product.is_promo &&
    product.promo_price_cents != null &&
    Number.isInteger(product.promo_price_cents) &&
    product.promo_price_cents >= 0 &&
    product.promo_price_cents < product.price_cents
  ) {
    return product.promo_price_cents
  }
  return product.price_cents
}
