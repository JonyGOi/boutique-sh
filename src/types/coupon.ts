export type Coupon = {
  id: string
  code: string
  discount_type: 'percent' | 'fixed'
  discount_value: number // Em porcentagem (ex: 10 para 10%) ou em centavos (ex: 5000 para R$ 50,00)
  min_order_cents: number // Valor mínimo do pedido em centavos (ex: 0 ou 30000 para R$ 300,00)
  is_active: boolean
  created_at: string
}

export type CouponInput = {
  code: string
  discount_type: 'percent' | 'fixed'
  discount_value: number
  min_order_cents: number
  is_active: boolean
}
