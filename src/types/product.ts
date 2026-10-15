export type ProductRow = {
  id: string
  name: string
  slug: string
  description: string
  price_cents: number
  category: string
  sizes: string[]
  colors: string[]
  stock: number | null
  track_stock: boolean
  available: boolean
  published: boolean
  is_launch: boolean
  is_featured: boolean
  is_promo: boolean
  is_example: boolean
  promo_price_cents: number | null
  archived: boolean
  brand?: string | null
  material?: string | null
  gender?: string | null
  model_type?: string | null
  created_at: string
  updated_at: string
}

export type ProductInput = {
  name: string
  description: string
  price_cents: number
  category: string
  sizes: string[]
  colors: string[]
  stock: number | null
  track_stock: boolean
  available: boolean
  published: boolean
  is_launch: boolean
  is_featured: boolean
  is_promo: boolean
  promo_price_cents: number | null
  archived: boolean
  brand?: string | null
  material?: string | null
  gender?: string | null
  model_type?: string | null
}

export type ProductImageRow = {
  id: string
  product_id: string
  path: string
  public_url: string
  sort_order: number
  is_primary: boolean
}

export type Product = ProductRow & {
  images: ProductImageRow[]
}

export type CartItem = {
  productId: string
  size: string | null
  color: string | null
  quantity: number
}

export type ValidatedLine = {
  product: Product
  size: string | null
  color: string | null
  quantity: number
  unitCents: number
  subtotalCents: number
}
