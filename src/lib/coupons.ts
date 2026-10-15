import { isSupabaseConfigured, supabase } from './supabase'
import {
  createDevCoupon,
  deleteDevCoupon,
  getDevCoupons,
  toggleDevCouponActive,
} from './devStore'
import type { Coupon, CouponInput } from '../types/coupon'

/**
 * Busca um cupom ativo pelo código (usado pelo cliente na sacola/carrinho).
 */
export async function fetchActiveCoupon(code: string): Promise<Coupon | null> {
  const cleanCode = code.trim().toUpperCase()
  if (!cleanCode) return null

  if (!isSupabaseConfigured || !supabase) {
    const devCoupons = getDevCoupons()
    const found = devCoupons.find((c) => c.code.toUpperCase() === cleanCode && c.is_active)
    return found ?? null
  }

  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('code', cleanCode)
    .eq('is_active', true)
    .maybeSingle()

  if (error || !data) {
    // Fallback local se estiver offline
    const devCoupons = getDevCoupons()
    const found = devCoupons.find((c) => c.code.toUpperCase() === cleanCode && c.is_active)
    return found ?? null
  }

  return data as Coupon
}

/**
 * Busca todos os cupons cadastrados (usado no painel administrativo).
 */
export async function fetchAdminCoupons(): Promise<Coupon[]> {
  if (!isSupabaseConfigured || !supabase) {
    return getDevCoupons()
  }

  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .order('created_at', { ascending: false })

  if (error || !data) {
    return getDevCoupons()
  }

  return data as Coupon[]
}

/**
 * Cria um novo cupom no banco de dados.
 */
export async function createCoupon(input: CouponInput): Promise<string> {
  const cleanCode = input.code.trim().toUpperCase()
  if (!cleanCode) throw new Error('Código do cupom é obrigatório.')

  if (!isSupabaseConfigured || !supabase) {
    return createDevCoupon({ ...input, code: cleanCode })
  }

  const { data, error } = await supabase
    .from('coupons')
    .insert({
      code: cleanCode,
      discount_type: input.discount_type,
      discount_value: input.discount_value,
      min_order_cents: input.min_order_cents,
      is_active: input.is_active,
    })
    .select('id')
    .single()

  if (error || !data) {
    if (error?.code === '23505' || error?.message?.includes('duplicate key')) {
      throw new Error(`O cupom "${cleanCode}" já existe. Escolha outro código.`)
    }
    throw new Error(error?.message || 'Erro ao cadastrar cupom no Supabase.')
  }

  return data.id as string
}

/**
 * Ativa ou desativa um cupom.
 */
export async function toggleCouponActive(id: string, is_active: boolean): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    toggleDevCouponActive(id, is_active)
    return
  }

  const { error } = await supabase
    .from('coupons')
    .update({ is_active })
    .eq('id', id)

  if (error) {
    toggleDevCouponActive(id, is_active)
    throw new Error(error.message || 'Erro ao atualizar cupom.')
  }
}

/**
 * Exclui um cupom definitivamente.
 */
export async function deleteCoupon(id: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    deleteDevCoupon(id)
    return
  }

  const { error } = await supabase
    .from('coupons')
    .delete()
    .eq('id', id)

  if (error) {
    deleteDevCoupon(id)
    throw new Error(error.message || 'Erro ao excluir cupom.')
  }
}

/**
 * Calcula o desconto do cupom para um determinado subtotal.
 */
export function calculateCouponDiscount(
  coupon: Coupon,
  subtotalCents: number,
): { discountCents: number; error: string | null } {
  if (!coupon.is_active) {
    return { discountCents: 0, error: 'Este cupom não está mais ativo.' }
  }

  if (coupon.min_order_cents > 0 && subtotalCents < coupon.min_order_cents) {
    const minReais = (coupon.min_order_cents / 100).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    })
    return {
      discountCents: 0,
      error: `Este cupom é válido apenas para compras a partir de ${minReais}.`,
    }
  }

  let discountCents = 0
  if (coupon.discount_type === 'percent') {
    discountCents = Math.round((subtotalCents * coupon.discount_value) / 100)
  } else {
    discountCents = Math.min(subtotalCents, coupon.discount_value)
  }

  return { discountCents, error: null }
}
