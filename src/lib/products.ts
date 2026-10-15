import { isAllowedImageUrl, publicImageUrl } from './images'
import { isSupabaseConfigured, supabase } from './supabase'
import { getDevProducts } from './devStore'
import type { Product, ProductImageRow, ProductRow } from '../types/product'

type ImageJoin = {
  id: string
  product_id: string
  path: string
  sort_order: number
  is_primary: boolean
}

function mapImage(row: ImageJoin): ProductImageRow | null {
  const url = publicImageUrl(row.path)
  if (!isAllowedImageUrl(url)) return null
  return {
    id: row.id,
    product_id: row.product_id,
    path: row.path,
    public_url: url,
    sort_order: row.sort_order,
    is_primary: row.is_primary,
  }
}

function mapProduct(row: ProductRow & { product_images?: ImageJoin[] | null }): Product {
  const images = (row.product_images ?? [])
    .map(mapImage)
    .filter((img): img is ProductImageRow => img !== null)
    .sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order)
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    price_cents: row.price_cents,
    category: row.category,
    sizes: row.sizes,
    colors: row.colors,
    stock: row.stock,
    track_stock: row.track_stock,
    available: row.available,
    published: row.published,
    is_launch: row.is_launch,
    is_featured: row.is_featured,
    is_promo: row.is_promo,
    is_example: row.is_example,
    promo_price_cents: row.promo_price_cents,
    archived: row.archived,
    created_at: row.created_at,
    updated_at: row.updated_at,
    images,
  }
}

const SELECT = `
  id, name, slug, description, price_cents, category, sizes, colors,
  stock, track_stock, available, published, is_launch, is_featured, is_promo,
  is_example, promo_price_cents, archived, created_at, updated_at,
  product_images ( id, product_id, path, sort_order, is_primary )
`

export async function fetchPublishedProducts(): Promise<Product[]> {
  if (!isSupabaseConfigured || !supabase) {
    return getDevProducts().filter((p) => p.published && !p.archived)
  }
  const { data, error } = await supabase
    .from('products')
    .select(SELECT)
    .eq('published', true)
    .eq('archived', false)
    .order('created_at', { ascending: false })
  if (error) {
    console.warn('Erro ao carregar do Supabase, usando catálogo local:', error)
    return getDevProducts().filter((p) => p.published && !p.archived)
  }
  return (data as (ProductRow & { product_images: ImageJoin[] })[]).map(mapProduct)
}

export async function fetchPublishedProductBySlug(slug: string): Promise<Product | null> {
  if (!isSupabaseConfigured || !supabase) {
    return getDevProducts().find((p) => p.slug === slug && p.published && !p.archived) ?? null
  }
  const { data, error } = await supabase
    .from('products')
    .select(SELECT)
    .eq('slug', slug)
    .eq('published', true)
    .eq('archived', false)
    .maybeSingle()
  if (error || !data) {
    return getDevProducts().find((p) => p.slug === slug && p.published && !p.archived) ?? null
  }
  return mapProduct(data as ProductRow & { product_images: ImageJoin[] })
}

export async function fetchPublishedByIds(ids: string[]): Promise<Product[]> {
  if (ids.length === 0) return []
  if (!isSupabaseConfigured || !supabase) {
    return getDevProducts().filter((p) => ids.includes(p.id) && p.published && !p.archived)
  }
  const unique = [...new Set(ids)]
  const { data, error } = await supabase
    .from('products')
    .select(SELECT)
    .in('id', unique)
    .eq('published', true)
    .eq('archived', false)
  if (error) {
    return getDevProducts().filter((p) => ids.includes(p.id) && p.published && !p.archived)
  }
  return (data as (ProductRow & { product_images: ImageJoin[] })[]).map(mapProduct)
}

export async function fetchAdminProducts(): Promise<Product[]> {
  if (!isSupabaseConfigured || !supabase) {
    return getDevProducts()
  }
  const { data, error } = await supabase
    .from('products')
    .select(SELECT)
    .order('updated_at', { ascending: false })
  if (error) {
    console.warn('Falha no Supabase Admin, fallback local:', error)
    return getDevProducts()
  }
  return (data as (ProductRow & { product_images: ImageJoin[] })[]).map(mapProduct)
}

export async function fetchAdminProduct(id: string): Promise<Product | null> {
  if (!isSupabaseConfigured || !supabase) {
    return getDevProducts().find((p) => p.id === id) ?? null
  }
  const { data, error } = await supabase.from('products').select(SELECT).eq('id', id).maybeSingle()
  if (error || !data) {
    return getDevProducts().find((p) => p.id === id) ?? null
  }
  return mapProduct(data as ProductRow & { product_images: ImageJoin[] })
}

export function primaryImage(product: Product): ProductImageRow | undefined {
  return product.images.find((img) => img.is_primary) ?? product.images[0]
}
