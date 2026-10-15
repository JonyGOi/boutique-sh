import { uniqueSlug } from './slug'
import { isSupabaseConfigured, PRODUCT_IMAGES_BUCKET, supabase } from './supabase'
import { normalizeImageUrl, removeStoragePath, uploadProductImage } from './images'
import {
  addDevProductImage,
  createDevProduct,
  deleteDevProduct,
  deleteDevProductImage,
  setDevPrimaryImage,
  updateDevProduct,
} from './devStore'
import type { ProductInput } from '../types/product'

export type { ProductInput }

export async function createProduct(input: ProductInput): Promise<string> {
  if (!isSupabaseConfigured || !supabase) {
    return createDevProduct(input)
  }
  const { data, error } = await supabase
    .from('products')
    .insert({ ...input, slug: uniqueSlug(input.name), is_example: false })
    .select('id')
    .single()
  if (error || !data) {
    console.error('Erro ao salvar no Supabase:', error)
    throw new Error(error?.message || 'Erro ao salvar produto no Supabase.')
  }
  return data.id as string
}

export async function updateProduct(id: string, input: ProductInput): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    updateDevProduct(id, input)
    return
  }
  const { error } = await supabase.from('products').update(input).eq('id', id)
  if (error) {
    console.error('Erro ao atualizar no Supabase:', error)
    throw new Error(error?.message || 'Erro ao atualizar produto no Supabase.')
  }
}

export async function deleteProduct(id: string, imagePaths: string[]): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    deleteDevProduct(id)
    return
  }
  if (imagePaths.length) {
    await supabase.storage.from(PRODUCT_IMAGES_BUCKET).remove(imagePaths)
  }
  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) {
    deleteDevProduct(id)
  }
}

export async function addProductImage(
  productId: string,
  fileOrUrl: File | string,
  isPrimary: boolean,
  sortOrder: number,
): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    await addDevProductImage(productId, fileOrUrl, isPrimary, sortOrder)
    return
  }

  // Se for URL / Link direto da internet
  if (typeof fileOrUrl === 'string') {
    const cleanUrl = normalizeImageUrl(fileOrUrl)
    if (!cleanUrl) return

    if (isPrimary) {
      await supabase.from('product_images').update({ is_primary: false }).eq('product_id', productId)
    }
    const { error } = await supabase.from('product_images').insert({
      product_id: productId,
      path: cleanUrl,
      is_primary: isPrimary,
      sort_order: sortOrder,
    })
    if (error) {
      console.warn('Erro ao inserir URL em product_images no Supabase:', error)
      await addDevProductImage(productId, cleanUrl, isPrimary, sortOrder)
    }
    return
  }

  // Se for Arquivo (upload do computador ou celular)
  try {
    const path = await uploadProductImage(productId, fileOrUrl)
    if (isPrimary) {
      await supabase.from('product_images').update({ is_primary: false }).eq('product_id', productId)
    }
    const { error } = await supabase.from('product_images').insert({
      product_id: productId,
      path,
      is_primary: isPrimary,
      sort_order: sortOrder,
    })
    if (error) {
      await removeStoragePath(path)
      await addDevProductImage(productId, fileOrUrl, isPrimary, sortOrder)
    }
  } catch (err) {
    console.warn('Falha no upload para Supabase, gravando em devStore local:', err)
    await addDevProductImage(productId, fileOrUrl, isPrimary, sortOrder)
  }
}

export async function deleteProductImage(imageId: string, path: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    deleteDevProductImage(imageId)
    return
  }
  const { error } = await supabase.from('product_images').delete().eq('id', imageId)
  if (error) {
    deleteDevProductImage(imageId)
    return
  }
  if (!path.startsWith('http://') && !path.startsWith('https://') && !path.startsWith('data:')) {
    await removeStoragePath(path)
  }
}

export async function setPrimaryImage(productId: string, imageId: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    setDevPrimaryImage(productId, imageId)
    return
  }
  const { error: clearError } = await supabase
    .from('product_images')
    .update({ is_primary: false })
    .eq('product_id', productId)
  if (clearError) {
    setDevPrimaryImage(productId, imageId)
    return
  }
  const { error } = await supabase.from('product_images').update({ is_primary: true }).eq('id', imageId)
  if (error) {
    setDevPrimaryImage(productId, imageId)
  }
}
