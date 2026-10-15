/** Configuração comercial fixa. O número do WhatsApp não pode ser alterado por URL, formulário ou carrinho. */
export const STORE = {
  name: 'Boutique SH',
  country: 'BR',
  locale: 'pt-BR',
  currency: 'BRL',
  whatsappNumber: '5511964442424',
} as const

export const CATEGORIES = [
  {
    slug: 'vestidos',
    label: 'Vestidos',
    subs: ['marcas', 'tecido'],
  },
  {
    slug: 'camisas',
    label: 'Camisas',
    subs: ['sexo', 'marcas', 'tecido'],
  },
  {
    slug: 'calcas',
    label: 'Calças',
    subs: ['sexo', 'marcas', 'tecido'],
  },
  {
    slug: 'bermudas',
    label: 'Bermudas',
    subs: ['sexo', 'marcas', 'tecido'],
  },
  {
    slug: 'blazers',
    label: 'Blazers',
    subs: ['marcas', 'tecido'],
  },
  {
    slug: 'blusas',
    label: 'Blusas',
    subs: ['marcas', 'tecido', 'modelo'],
  },
  {
    slug: 'calcados',
    label: 'Calçados / Sandálias',
    subs: ['marcas', 'modelo'],
  },
  {
    slug: 'acessorios',
    label: 'Acessórios',
    subs: ['tipo'],
    accessoryTypes: ['Bolsas', 'Relógios', 'Pulseiras', 'Outros'],
  },
  {
    slug: 'promocoes',
    label: 'Promoções',
    subs: ['marcas', 'tecido'],
  },
] as const

export type CategorySlug = (typeof CATEGORIES)[number]['slug']

export const PRODUCT_CATEGORIES = CATEGORIES.filter(
  (c) => c.slug !== 'promocoes',
)

/** Metas de desconto progressivo para incentivo de compra */
export const DISCOUNT_TIERS = [
  { minCents: 30000, percent: 5, label: '5% de desconto' },
  { minCents: 50000, percent: 10, label: '10% de desconto' },
] as const

export function getDiscountForTotal(subtotalCents: number) {
  let appliedTier = null
  for (const tier of [...DISCOUNT_TIERS].reverse()) {
    if (subtotalCents >= tier.minCents) {
      appliedTier = tier
      break
    }
  }

  // Next target tier
  const nextTier = DISCOUNT_TIERS.find((t) => subtotalCents < t.minCents) ?? null

  const discountCents = appliedTier ? Math.round((subtotalCents * appliedTier.percent) / 100) : 0
  const finalCents = Math.max(0, subtotalCents - discountCents)

  return {
    appliedTier,
    nextTier,
    discountCents,
    finalCents,
    neededForNextCents: nextTier ? nextTier.minCents - subtotalCents : 0,
    progressPercent: nextTier ? Math.min(100, Math.round((subtotalCents / nextTier.minCents) * 100)) : 100,
  }
}


export const MAX_IMAGE_BYTES = 2 * 1024 * 1024
export const MAX_IMAGES_PER_PRODUCT = 6
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
] as const

export const LOGIN_MAX_ATTEMPTS = 5
export const LOGIN_LOCKOUT_MS = 60_000
