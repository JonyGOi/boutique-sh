import type { Product, ProductInput } from '../types/product'
import { uniqueSlug } from './slug'

const STORAGE_KEY = 'sh_boutique_dev_products'
const AUTH_KEY = 'sh_boutique_dev_auth'
const PASSWORD_KEY = 'sh_boutique_dev_password'
const DEFAULT_PASSWORD = 'admin123'

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-001',
    name: 'Vestido Midi Acetinado Esmeralda',
    slug: 'vestido-midi-acetinado-esmeralda',
    description: 'Vestido midi em cetim toque de seda com caimento impecável e fenda lateral sutil. Elegância e sofisticação para ocasiões especiais.',
    price_cents: 28990,
    category: 'vestidos',
    sizes: ['P', 'M', 'G'],
    colors: ['Verde Esmeralda', 'Preto'],
    stock: 12,
    track_stock: false,
    available: true,
    published: true,
    is_launch: true,
    is_featured: true,
    is_promo: false,
    is_example: false,
    promo_price_cents: null,
    archived: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    images: [
      {
        id: 'img-001',
        product_id: 'prod-001',
        path: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&q=80',
        public_url: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&q=80',
        sort_order: 0,
        is_primary: true,
      },
    ],
  },
  {
    id: 'prod-002',
    name: 'Blusa Seda Dourada Acetinada',
    slug: 'blusa-seda-dourada-acetinada',
    description: 'Blusa feminina de decote fluido em seda com acabamento acetinado nobre. Combinação ideal com alfaiataria ou jeans premium.',
    price_cents: 18990,
    category: 'blusas',
    sizes: ['P', 'M'],
    colors: ['Dourado', 'Champagne'],
    stock: 8,
    track_stock: false,
    available: true,
    published: true,
    is_launch: false,
    is_featured: true,
    is_promo: true,
    is_example: false,
    promo_price_cents: 14990,
    archived: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    images: [
      {
        id: 'img-002',
        product_id: 'prod-002',
        path: 'https://images.unsplash.com/photo-1551803091-e20673f15770?w=800&q=80',
        public_url: 'https://images.unsplash.com/photo-1551803091-e20673f15770?w=800&q=80',
        sort_order: 0,
        is_primary: true,
      },
    ],
  },
  {
    id: 'prod-003',
    name: 'Calça Alfaiataria Pantalona Off-White',
    slug: 'calca-alfaiataria-pantalona-off-white',
    description: 'Calça feminina modelo pantalona de cintura alta com pregas frontais e caimento reto alongado. Tecido estruturado que não marca.',
    price_cents: 24990,
    category: 'calcas',
    sizes: ['36', '38', '40', '42'],
    colors: ['Off-White', 'Preto'],
    stock: 15,
    track_stock: false,
    available: true,
    published: true,
    is_launch: false,
    is_featured: true,
    is_promo: false,
    is_example: false,
    promo_price_cents: null,
    archived: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    images: [
      {
        id: 'img-003',
        product_id: 'prod-003',
        path: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&q=80',
        public_url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&q=80',
        sort_order: 0,
        is_primary: true,
      },
    ],
  },
  {
    id: 'prod-004',
    name: 'Conjunto Blazer & Saia Terracota',
    slug: 'conjunto-blazer-saia-terracota',
    description: 'Conjunto de alfaiataria contemporânea composto por blazer estruturado e saia midi elegante na cor terracota.',
    price_cents: 38990,
    category: 'conjuntos',
    sizes: ['P', 'M', 'G'],
    colors: ['Terracota'],
    stock: 6,
    track_stock: false,
    available: true,
    published: true,
    is_launch: true,
    is_featured: false,
    is_promo: false,
    is_example: false,
    promo_price_cents: null,
    archived: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    images: [
      {
        id: 'img-004',
        product_id: 'prod-004',
        path: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80',
        public_url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80',
        sort_order: 0,
        is_primary: true,
      },
    ],
  },
]

export function getDevProducts(): Product[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      saveDevProducts(INITIAL_PRODUCTS)
      return INITIAL_PRODUCTS
    }
    const parsed = JSON.parse(raw) as Product[]
    if (!Array.isArray(parsed) || parsed.length === 0) {
      saveDevProducts(INITIAL_PRODUCTS)
      return INITIAL_PRODUCTS
    }
    return parsed
  } catch {
    return INITIAL_PRODUCTS
  }
}

export function saveDevProducts(products: Product[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products))
  } catch (err) {
    console.error('Falha ao salvar produtos locais no localStorage:', err)
  }
}

export function createDevProduct(input: ProductInput): string {
  const products = getDevProducts()
  const id = 'prod-' + crypto.randomUUID()
  const now = new Date().toISOString()
  const newProduct: Product = {
    ...input,
    id,
    slug: uniqueSlug(input.name),
    is_example: false,
    created_at: now,
    updated_at: now,
    images: [],
  }
  products.unshift(newProduct)
  saveDevProducts(products)
  return id
}

export function updateDevProduct(id: string, input: ProductInput): void {
  const products = getDevProducts()
  const idx = products.findIndex((p) => p.id === id)
  if (idx === -1) throw new Error('Produto não encontrado.')
  products[idx] = {
    ...products[idx],
    ...input,
    updated_at: new Date().toISOString(),
  }
  saveDevProducts(products)
}

export function deleteDevProduct(id: string): void {
  const products = getDevProducts().filter((p) => p.id !== id)
  saveDevProducts(products)
}

export async function addDevProductImage(
  productId: string,
  fileOrUrl: File | string,
  isPrimary: boolean,
  sortOrder: number,
): Promise<void> {
  const products = getDevProducts()
  const product = products.find((p) => p.id === productId)
  if (!product) throw new Error('Produto não encontrado.')

  let publicUrl = ''
  if (typeof fileOrUrl === 'string') {
    publicUrl = fileOrUrl.trim()
  } else {
    publicUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(new Error('Erro ao ler arquivo da imagem.'))
      reader.readAsDataURL(fileOrUrl)
    })
  }

  const imageId = 'img-' + crypto.randomUUID()

  if (isPrimary || product.images.length === 0) {
    product.images.forEach((img) => {
      img.is_primary = false
    })
  }

  product.images.push({
    id: imageId,
    product_id: productId,
    path: publicUrl,
    public_url: publicUrl,
    sort_order: sortOrder,
    is_primary: isPrimary || product.images.length === 0,
  })

  saveDevProducts(products)
}

export function deleteDevProductImage(imageId: string): void {
  const products = getDevProducts()
  let modified = false
  for (const p of products) {
    const lenBefore = p.images.length
    p.images = p.images.filter((img) => img.id !== imageId)
    if (p.images.length !== lenBefore) {
      if (p.images.length > 0 && !p.images.some((img) => img.is_primary)) {
        p.images[0].is_primary = true
      }
      modified = true
      break
    }
  }
  if (modified) saveDevProducts(products)
}

export function setDevPrimaryImage(productId: string, imageId: string): void {
  const products = getDevProducts()
  const product = products.find((p) => p.id === productId)
  if (!product) return
  product.images.forEach((img) => {
    img.is_primary = img.id === imageId
  })
  saveDevProducts(products)
}

export function getDevPassword(): string {
  return localStorage.getItem(PASSWORD_KEY) || DEFAULT_PASSWORD
}

export function setDevPassword(newPassword: string): void {
  if (!newPassword || newPassword.trim().length < 4) {
    throw new Error('A senha deve ter pelo menos 4 caracteres.')
  }
  localStorage.setItem(PASSWORD_KEY, newPassword.trim())
}

export function verifyDevPassword(password: string): boolean {
  return password.trim() === getDevPassword()
}

export function isDevLoggedIn(): boolean {
  return localStorage.getItem(AUTH_KEY) === 'true'
}

export function setDevLoggedIn(val: boolean): void {
  if (val) {
    localStorage.setItem(AUTH_KEY, 'true')
  } else {
    localStorage.removeItem(AUTH_KEY)
  }
}

export function exportCatalogJson(): string {
  const products = getDevProducts()
  return JSON.stringify(products, null, 2)
}

export function importCatalogJson(jsonString: string): void {
  const parsed = JSON.parse(jsonString)
  if (!Array.isArray(parsed)) throw new Error('O arquivo JSON deve conter uma lista de produtos.')
  saveDevProducts(parsed)
}

export function resetToDefaultCatalog(): void {
  saveDevProducts(INITIAL_PRODUCTS)
}

// ============================================
// CUPONS DE DESCONTO (ARMAZENAMENTO LOCAL / DEV)
// ============================================
import type { Coupon, CouponInput } from '../types/coupon'

const COUPONS_STORAGE_KEY = 'sh_boutique_dev_coupons'

const INITIAL_DEV_COUPONS: Coupon[] = [
  {
    id: 'coup-001',
    code: 'BEMVINDA10',
    discount_type: 'percent',
    discount_value: 10,
    min_order_cents: 0,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'coup-002',
    code: 'BOUTIQUE50',
    discount_type: 'fixed',
    discount_value: 5000,
    min_order_cents: 30000,
    is_active: true,
    created_at: new Date().toISOString(),
  },
]

export function getDevCoupons(): Coupon[] {
  try {
    const raw = localStorage.getItem(COUPONS_STORAGE_KEY)
    if (!raw) {
      saveDevCoupons(INITIAL_DEV_COUPONS)
      return INITIAL_DEV_COUPONS
    }
    const parsed = JSON.parse(raw) as Coupon[]
    return Array.isArray(parsed) ? parsed : INITIAL_DEV_COUPONS
  } catch {
    return INITIAL_DEV_COUPONS
  }
}

export function saveDevCoupons(coupons: Coupon[]): void {
  try {
    localStorage.setItem(COUPONS_STORAGE_KEY, JSON.stringify(coupons))
  } catch (err) {
    console.error('Falha ao salvar cupons locais:', err)
  }
}

export function createDevCoupon(input: CouponInput): string {
  const coupons = getDevCoupons()
  const cleanCode = input.code.trim().toUpperCase()
  if (coupons.some((c) => c.code === cleanCode)) {
    throw new Error(`O cupom "${cleanCode}" já existe.`)
  }
  const id = 'coup-' + crypto.randomUUID()
  const newCoupon: Coupon = {
    ...input,
    id,
    code: cleanCode,
    created_at: new Date().toISOString(),
  }
  coupons.unshift(newCoupon)
  saveDevCoupons(coupons)
  return id
}

export function toggleDevCouponActive(id: string, is_active: boolean): void {
  const coupons = getDevCoupons()
  const idx = coupons.findIndex((c) => c.id === id)
  if (idx !== -1) {
    coupons[idx].is_active = is_active
    saveDevCoupons(coupons)
  }
}

export function deleteDevCoupon(id: string): void {
  const coupons = getDevCoupons().filter((c) => c.id !== id)
  saveDevCoupons(coupons)
}

// ============================================
// VISITANTES & ANÁLISE DE MÉDIAS (DEV FALLBACK)
// ============================================
import type { SiteVisitor } from '../types/analytics'

const VISITORS_STORAGE_KEY = 'sh_boutique_dev_visitors'

export function getDevVisitors(): SiteVisitor[] {
  try {
    const raw = localStorage.getItem(VISITORS_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as SiteVisitor[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveDevVisitors(visitors: SiteVisitor[]): void {
  try {
    localStorage.setItem(VISITORS_STORAGE_KEY, JSON.stringify(visitors))
  } catch (err) {
    console.error('Falha ao salvar visitantes locais:', err)
  }
}

export function recordDevVisit(
  visitorId: string,
  deviceType: string,
  browser: string,
  os: string,
  path: string,
  isNewSession: boolean,
): void {
  const visitors = getDevVisitors()
  const existing = visitors.find((v) => v.visitor_id === visitorId)
  const now = new Date().toISOString()

  if (existing) {
    if (isNewSession) {
      existing.visit_count += 1
      existing.last_visit_at = now
      existing.last_path = path || existing.last_path
      existing.device_type = deviceType || existing.device_type
      existing.browser = browser || existing.browser
      existing.os = os || existing.os
    } else {
      existing.last_visit_at = now
      existing.last_path = path || existing.last_path
    }
  } else {
    visitors.unshift({
      visitor_id: visitorId,
      first_visit_at: now,
      last_visit_at: now,
      visit_count: 1,
      device_type: deviceType,
      browser,
      os,
      last_path: path,
      created_at: now,
    })
  }

  saveDevVisitors(visitors)
}

