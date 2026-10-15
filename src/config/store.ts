/** Configuração comercial fixa. O número do WhatsApp não pode ser alterado por URL, formulário ou carrinho. */
export const STORE = {
  name: 'SH Boutique',
  country: 'BR',
  locale: 'pt-BR',
  currency: 'BRL',
  whatsappNumber: '5511964442424',
} as const

export const CATEGORIES = [
  { slug: 'vestidos', label: 'Vestidos' },
  { slug: 'blusas', label: 'Blusas' },
  { slug: 'camisas', label: 'Camisas' },
  { slug: 'calcas', label: 'Calças' },
  { slug: 'saias', label: 'Saias' },
  { slug: 'conjuntos', label: 'Conjuntos' },
  { slug: 'lancamentos', label: 'Lançamentos' },
  { slug: 'promocoes', label: 'Promoções' },
] as const

export type CategorySlug = (typeof CATEGORIES)[number]['slug']

export const PRODUCT_CATEGORIES = CATEGORIES.filter(
  (c) => c.slug !== 'lancamentos' && c.slug !== 'promocoes',
)

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
