import { isSupabaseConfigured, supabase } from './supabase'
import {
  createDevCoupon,
  deleteDevCoupon,
  getDevCoupons,
  incrementDevCouponUsage,
  toggleDevCouponActive,
} from './devStore'
import type { Coupon, CouponInput } from '../types/coupon'

/**
 * Verifica se o cupom está apto para uso (ativo, dentro da validade e sem estourar limite).
 */
export function isValidCoupon(coupon: Coupon): boolean {
  if (!coupon.is_active) return false
  if (coupon.expires_at && new Date(coupon.expires_at).getTime() < Date.now()) return false
  if (coupon.max_uses != null && (coupon.used_count || 0) >= coupon.max_uses) return false
  return true
}

/**
 * Busca um cupom ativo pelo código. Se estiver inativo, expirado ou esgotado, retorna null.
 */
export async function fetchActiveCoupon(code: string): Promise<Coupon | null> {
  const cleanCode = code.trim().toUpperCase()
  if (!cleanCode) return null

  if (isSupabaseConfigured && supabase) {
    const { data } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', cleanCode)
      .maybeSingle()

    if (data) {
      const coupon = data as Coupon
      if (!isValidCoupon(coupon)) {
        return null
      }
      return coupon
    }

    return null
  }

  // Fallback local se o Supabase não estiver configurado
  const devCoupons = getDevCoupons()
  const found = devCoupons.find((c) => c.code.toUpperCase() === cleanCode)
  if (found && isValidCoupon(found)) return found
  return null
}

/**
 * Busca todos os cupons ativos e válidos para sugerir ao cliente.
 */
export async function fetchPublicActiveCoupons(): Promise<Coupon[]> {
  if (!isSupabaseConfigured || !supabase) {
    return getDevCoupons().filter(isValidCoupon)
  }

  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error || !data) {
    return getDevCoupons().filter(isValidCoupon)
  }

  return (data as Coupon[]).filter(isValidCoupon)
}

/**
 * Busca todos os cupons cadastrados (usado no painel administrativo com todos os status).
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
 * Cria um novo cupom no banco de dados com limite de usos e validade por tempo.
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
      expires_at: input.expires_at || null,
      max_uses: input.max_uses != null && input.max_uses > 0 ? input.max_uses : null,
      used_count: 0,
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
 * Incrementa a contagem de usos do cupom no fechamento da compra.
 */
export async function incrementCouponUsage(code: string): Promise<void> {
  const cleanCode = code.trim().toUpperCase()
  if (!cleanCode) return

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.rpc('increment_coupon_used', { p_code: cleanCode })
    } catch (err) {
      console.warn('Erro ao incrementar uso do cupom no Supabase:', err)
    }
  }

  incrementDevCouponUsage(cleanCode)
}

/**
 * Calcula o desconto do cupom para um determinado subtotal, validando status, expiração e usos.
 */
export function calculateCouponDiscount(
  coupon: Coupon,
  subtotalCents: number,
): { discountCents: number; error: string | null } {
  if (!coupon.is_active) {
    return { discountCents: 0, error: 'Este cupom foi desativado.' }
  }

  if (coupon.expires_at && new Date(coupon.expires_at).getTime() < Date.now()) {
    const dataExp = new Date(coupon.expires_at).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
    return { discountCents: 0, error: `Este cupom expirou em ${dataExp}.` }
  }

  if (coupon.max_uses != null && (coupon.used_count || 0) >= coupon.max_uses) {
    return {
      discountCents: 0,
      error: `Este cupom atingiu o limite de ${coupon.max_uses} utilizações e está esgotado.`,
    }
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
