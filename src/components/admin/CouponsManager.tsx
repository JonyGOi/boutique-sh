import { useState, useEffect } from 'react'
import {
  fetchAdminCoupons,
  createCoupon,
  toggleCouponActive,
  deleteCoupon,
} from '../../lib/coupons'
import { formatBRL, parseBRLToCents } from '../../lib/money'
import { IconPercent, IconClose } from '../ui/Icons'
import type { Coupon } from '../../types/coupon'

export function CouponsManager({ onNotice }: { onNotice: (msg: string) => void }) {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Form states
  const [code, setCode] = useState('')
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent')
  const [discountValue, setDiscountValue] = useState('')
  const [minOrder, setMinOrder] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [maxUses, setMaxUses] = useState('')

  async function loadCoupons() {
    setLoading(true)
    try {
      const data = await fetchAdminCoupons()
      setCoupons(data)
    } catch {
      setError('Não foi possível carregar os cupons.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadCoupons()
  }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const cleanCode = code.trim().toUpperCase()
    if (!cleanCode || cleanCode.length < 2) {
      setError('O código do cupom deve ter pelo menos 2 caracteres.')
      return
    }

    let val = 0
    if (discountType === 'percent') {
      val = parseInt(discountValue, 10)
      if (isNaN(val) || val <= 0 || val > 100) {
        setError('Porcentagem de desconto deve ser entre 1% e 100%.')
        return
      }
    } else {
      const cents = parseBRLToCents(discountValue)
      if (cents == null || cents <= 0) {
        setError('Informe um valor fixo válido em reais (ex: 50,00).')
        return
      }
      val = cents
    }

    const minCents = minOrder.trim() ? parseBRLToCents(minOrder) : 0
    if (minOrder.trim() && minCents == null) {
      setError('Valor mínimo de pedido inválido.')
      return
    }

    let expIso: string | null = null
    if (expiresAt.trim()) {
      const expDate = new Date(expiresAt)
      if (isNaN(expDate.getTime())) {
        setError('Data de expiração inválida.')
        return
      }
      expIso = expDate.toISOString()
    }

    let limitUses: number | null = null
    if (maxUses.trim()) {
      const parsedUses = parseInt(maxUses, 10)
      if (isNaN(parsedUses) || parsedUses <= 0) {
        setError('O limite de usos deve ser um número inteiro positivo.')
        return
      }
      limitUses = parsedUses
    }

    setSubmitting(true)
    try {
      await createCoupon({
        code: cleanCode,
        discount_type: discountType,
        discount_value: val,
        min_order_cents: minCents ?? 0,
        is_active: true,
        expires_at: expIso,
        max_uses: limitUses,
      })
      onNotice(`Cupom ${cleanCode} criado com sucesso!`)
      setShowCreateModal(false)
      setCode('')
      setDiscountValue('')
      setMinOrder('')
      setExpiresAt('')
      setMaxUses('')
      await loadCoupons()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao criar cupom.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleToggle(coupon: Coupon) {
    try {
      await toggleCouponActive(coupon.id, !coupon.is_active)
      onNotice(
        `Cupom ${coupon.code} foi ${!coupon.is_active ? 'ativado' : 'desativado com sucesso'}.`,
      )
      await loadCoupons()
    } catch {
      setError('Não foi possível atualizar o status do cupom.')
    }
  }

  async function handleDelete(coupon: Coupon) {
    if (!window.confirm(`Tem certeza que deseja excluir o cupom "${coupon.code}"?`)) return
    try {
      await deleteCoupon(coupon.id)
      onNotice(`Cupom ${coupon.code} excluído com sucesso.`)
      await loadCoupons()
    } catch {
      setError('Não foi possível excluir o cupom.')
    }
  }

  function formatDateTime(isoString?: string | null): string {
    if (!isoString) return '-'
    try {
      return new Date(isoString).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return isoString
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl text-paper">Cupons de Desconto</h2>
          <p className="mt-1 text-xs text-mute">
            Crie e gerencie códigos promocionais com limite de validade por tempo e controle de quantidade de usos.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setError(null)
            setShowCreateModal(true)
          }}
          className="inline-flex min-h-11 items-center gap-2 rounded bg-gold px-5 text-xs uppercase tracking-[0.18em] text-ink font-semibold hover:bg-gold-light transition shadow-lg shadow-gold/20 cursor-pointer"
        >
          <IconPercent className="w-3.5 h-3.5" />
          + Criar Novo Cupom
        </button>
      </div>

      {error && (
        <div className="rounded border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
          {error}
        </div>
      )}

      {/* Modal de Criação de Cupom */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg rounded border border-gold/40 bg-ink-2 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 my-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-display text-xl text-paper">Novo Cupom de Desconto</h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-mute hover:text-gold"
              >
                <IconClose className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-[0.2em] text-mute">
                  Código Promocional
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase().replace(/\s+/g, ''))}
                  placeholder="EX: VERAO10, CLIENTEVIP"
                  className="mt-1.5 min-h-11 w-full rounded border border-white/15 bg-ink px-3 text-sm text-gold font-mono uppercase tracking-wider focus:border-gold focus:outline-none"
                  required
                />
                <p className="mt-1 text-[11px] text-mute">
                  O código que a cliente digitará para obter o desconto.
                </p>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-[0.2em] text-mute">
                  Tipo de Desconto
                </label>
                <div className="mt-1.5 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDiscountType('percent')}
                    className={`min-h-10 rounded border text-xs font-semibold uppercase tracking-wider transition ${
                      discountType === 'percent'
                        ? 'border-gold bg-gold text-ink'
                        : 'border-white/15 text-paper hover:border-gold/40'
                    }`}
                  >
                    Porcentagem (%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiscountType('fixed')}
                    className={`min-h-10 rounded border text-xs font-semibold uppercase tracking-wider transition ${
                      discountType === 'fixed'
                        ? 'border-gold bg-gold text-ink'
                        : 'border-white/15 text-paper hover:border-gold/40'
                    }`}
                  >
                    Valor Fixo (R$)
                  </button>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs uppercase tracking-[0.2em] text-mute">
                    {discountType === 'percent' ? 'Desconto (%)' : 'Valor (R$)'}
                  </label>
                  <input
                    type="text"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    placeholder={discountType === 'percent' ? 'Ex: 15' : 'Ex: 50,00'}
                    className="mt-1.5 min-h-11 w-full rounded border border-white/15 bg-ink px-3 text-sm text-paper focus:border-gold focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-[0.2em] text-mute">
                    Pedido Mínimo (R$)
                  </label>
                  <input
                    type="text"
                    value={minOrder}
                    onChange={(e) => setMinOrder(e.target.value)}
                    placeholder="Ex: 250,00 (ou vazio)"
                    className="mt-1.5 min-h-11 w-full rounded border border-white/15 bg-ink px-3 text-sm text-paper focus:border-gold focus:outline-none"
                  />
                </div>
              </div>

              {/* Controles de Validade por Tempo e Limite de Usos */}
              <div className="rounded border border-gold/30 bg-ink p-3.5 space-y-3">
                <p className="text-[10px] uppercase tracking-[0.25em] text-gold font-bold">
                  Controle de Validade & Limites
                </p>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs uppercase tracking-[0.18em] text-paper font-medium">
                      Validade / Data Limite
                    </label>
                    <input
                      type="datetime-local"
                      value={expiresAt}
                      onChange={(e) => setExpiresAt(e.target.value)}
                      className="mt-1.5 min-h-11 w-full rounded border border-white/15 bg-ink-2 px-3 text-xs text-paper focus:border-gold focus:outline-none"
                    />
                    <p className="mt-1 text-[10px] text-mute">
                      Deixe vazio para o cupom nunca expirar.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-[0.18em] text-paper font-medium">
                      Limite de Usos (Qtd)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={maxUses}
                      onChange={(e) => setMaxUses(e.target.value)}
                      placeholder="Ex: 50 (Vazio = Ilimitado)"
                      className="mt-1.5 min-h-11 w-full rounded border border-white/15 bg-ink-2 px-3 text-xs text-paper focus:border-gold focus:outline-none"
                    />
                    <p className="mt-1 text-[10px] text-mute">
                      Quantas vezes o cupom pode ser usado no total.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded border border-white/20 px-4 py-2 text-xs uppercase tracking-wider text-paper hover:border-white/40 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded bg-gold px-5 py-2 text-xs uppercase tracking-wider text-ink font-semibold hover:bg-gold-light transition"
                >
                  {submitting ? 'Salvando…' : 'Salvar Cupom'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lista de Cupons Cadastrados */}
      {loading ? (
        <p className="text-sm text-mute">Carregando cupons…</p>
      ) : coupons.length === 0 ? (
        <div className="rounded border border-dashed border-white/15 bg-ink p-12 text-center">
          <IconPercent className="mx-auto w-10 h-10 text-gold/60 mb-2" />
          <p className="text-sm text-paper font-semibold">Nenhum cupom cadastrado</p>
          <p className="text-xs text-mute mt-1 max-w-sm mx-auto">
            Crie seu primeiro cupom com desconto em % ou R$, definindo validade por data e limite de usos se desejar.
          </p>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="mt-4 inline-flex items-center gap-1.5 rounded bg-gold px-4 py-2 text-xs uppercase tracking-wider text-ink font-semibold hover:bg-gold-light transition cursor-pointer"
          >
            + Criar Cupom Agora
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {coupons.map((coupon) => {
            const isExpired =
              coupon.expires_at && new Date(coupon.expires_at).getTime() < Date.now()
            const isExhausted =
              coupon.max_uses != null && (coupon.used_count || 0) >= coupon.max_uses
            const isTrulyActive = coupon.is_active && !isExpired && !isExhausted

            return (
              <div
                key={coupon.id}
                className={`relative rounded border p-4 transition flex flex-col justify-between ${
                  isTrulyActive
                    ? 'border-gold/40 bg-ink-2 shadow-lg shadow-gold/5'
                    : 'border-white/10 bg-ink/60 opacity-65'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="inline-block rounded border border-gold/50 bg-gold/10 px-2.5 py-1 font-mono text-sm font-bold text-gold tracking-widest">
                        {coupon.code}
                      </span>
                      <p className="mt-2 text-lg font-display text-paper">
                        {coupon.discount_type === 'percent'
                          ? `${coupon.discount_value}% OFF`
                          : `${formatBRL(coupon.discount_value)} OFF`}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      {isTrulyActive ? (
                        <span className="rounded bg-green-500/15 text-green-400 border border-green-500/30 px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider">
                          Ativo
                        </span>
                      ) : !coupon.is_active ? (
                        <span className="rounded bg-white/10 text-mute border border-white/15 px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider">
                          Desativado
                        </span>
                      ) : isExpired ? (
                        <span className="rounded bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider">
                          Expirado
                        </span>
                      ) : (
                        <span className="rounded bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider">
                          Esgotado
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 text-xs text-mute space-y-1.5 border-t border-white/5 pt-2">
                    <p>
                      <strong className="text-paper">Pedido Mínimo:</strong>{' '}
                      {coupon.min_order_cents > 0
                        ? `Acima de ${formatBRL(coupon.min_order_cents)}`
                        : 'Sem valor mínimo'}
                    </p>

                    <p>
                      <strong className="text-paper">Validade:</strong>{' '}
                      {coupon.expires_at ? (
                        <span className={isExpired ? 'text-red-400 font-semibold' : 'text-paper'}>
                          {isExpired ? 'Expirou em ' : 'Até '}
                          {formatDateTime(coupon.expires_at)}
                        </span>
                      ) : (
                        'Sem expiração (permanente)'
                      )}
                    </p>

                    <p>
                      <strong className="text-paper">Usos:</strong>{' '}
                      {coupon.max_uses != null ? (
                        <span className={isExhausted ? 'text-red-400 font-semibold' : 'text-paper'}>
                          {coupon.used_count || 0} de {coupon.max_uses} utilizações{' '}
                          {isExhausted && '(Esgotado)'}
                        </span>
                      ) : (
                        `${coupon.used_count || 0} utilizações (Ilimitado)`
                      )}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-xs">
                  <button
                    type="button"
                    onClick={() => void handleToggle(coupon)}
                    className={`font-medium transition hover:underline cursor-pointer ${
                      coupon.is_active ? 'text-mute hover:text-paper' : 'text-gold'
                    }`}
                  >
                    {coupon.is_active ? 'Inativar Cupom' : 'Ativar Cupom'}
                  </button>

                  <button
                    type="button"
                    onClick={() => void handleDelete(coupon)}
                    className="text-mute hover:text-red-400 transition cursor-pointer"
                    title="Excluir cupom"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
