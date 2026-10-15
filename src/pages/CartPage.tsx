import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ButtonLink } from '../components/ui/Button'
import { useCart } from '../context/CartContext'
import { cartKey, totalCents, validateCartAgainstCatalog } from '../lib/cart'
import { formatBRL } from '../lib/money'
import { fetchPublishedByIds, primaryImage } from '../lib/products'
import { buildWhatsAppCheckoutUrl } from '../lib/whatsapp'
import { getDiscountForTotal } from '../config/store'
import { IconPercent, IconWhatsApp } from '../components/ui/Icons'
import type { Product, ValidatedLine } from '../types/product'

export function CartPage() {
  const { items, setQuantity, removeItem } = useCart()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    const ids = items.map((i) => i.productId)
    if (ids.length === 0) {
      setProducts([])
      setLoading(false)
      return
    }
    setLoading(true)
    fetchPublishedByIds(ids)
      .then((data) => {
        if (active) setProducts(data)
      })
      .catch(() => {
        if (active) setError('Não foi possível atualizar os preços do carrinho.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [items])

  const { lines, errors } = validateCartAgainstCatalog(items, products)
  const subtotal = totalCents(lines)
  const { appliedTier, nextTier, discountCents, finalCents, neededForNextCents, progressPercent } =
    getDiscountForTotal(subtotal)

  function checkout() {
    setCheckoutError(null)
    if (items.length === 0) {
      setCheckoutError('Seu carrinho está vazio.')
      return
    }
    if (errors.length > 0 || lines.length === 0) {
      setCheckoutError(errors[0] ?? 'Não há produtos válidos para finalizar.')
      return
    }
    const url = buildWhatsAppCheckoutUrl(lines, subtotal, discountCents, finalCents)
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="font-display text-4xl">Carrinho</h1>
        <p className="mt-4 text-sm text-mute">Seu carrinho está vazio. Explore a coleção e adicione as peças desejadas.</p>
        <div className="mt-8">
          <ButtonLink to="/colecao">Explorar Coleção</ButtonLink>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="font-display text-4xl">Carrinho</h1>
      <p className="mt-2 text-sm text-mute">
        Os totais usam os preços atuais do catálogo. Frete não está incluído. O pedido só é enviado quando você
        confirmar a mensagem no WhatsApp.
      </p>

      {/* Barra de Progresso de Meta de Desconto */}
      <div className="mt-6 rounded border border-gold/40 bg-gold/10 p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="font-semibold text-paper flex items-center gap-1.5">
            <IconPercent className="w-4 h-4 text-gold shrink-0" />
            {appliedTier && !nextTier && (
              <span className="text-gold font-bold">Parabéns! Você desbloqueou o desconto máximo de {appliedTier.percent}%!</span>
            )}
            {appliedTier && nextTier && (
              <span>
                Você já garantiu <strong className="text-gold">{appliedTier.percent}% OFF</strong>! Faltam apenas <strong className="text-gold">{formatBRL(neededForNextCents)}</strong> para liberar <strong>{nextTier.percent}% OFF</strong>!
              </span>
            )}
            {!appliedTier && nextTier && (
              <span>
                Adicione mais <strong className="text-gold">{formatBRL(neededForNextCents)}</strong> para ganhar <strong className="text-gold">{nextTier.percent}% de DESCONTO</strong>!
              </span>
            )}
          </span>
          <span className="text-[11px] font-bold text-gold shrink-0">{progressPercent}%</span>
        </div>
        <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-ink/60 border border-white/10">
          <div
            className="h-full bg-gold transition-all duration-500 ease-out rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {loading && <p className="mt-6 text-sm text-mute">Atualizando preços…</p>}
      {error && <p className="mt-6 text-sm text-gold">{error}</p>}
      {errors.map((msg) => (
        <p key={msg} className="mt-2 text-sm text-gold">
          {msg}
        </p>
      ))}

      <ul className="mt-8 space-y-4">
        {items.map((item) => {
          const line = lines.find(
            (l) =>
              l.product.id === item.productId && l.size === item.size && l.color === item.color,
          )
          const product = products.find((p) => p.id === item.productId)
          return (
            <CartRow
              key={cartKey(item)}
              item={item}
              line={line}
              product={product}
              onQty={(qty) => setQuantity(item, qty)}
              onRemove={() => removeItem(item)}
            />
          )
        })}
      </ul>

      <div className="mt-10 border-t border-white/10 pt-6">
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-mute">
            <span>Subtotal dos produtos</span>
            <span>{formatBRL(subtotal)}</span>
          </div>
          {discountCents > 0 && (
            <div className="flex justify-between text-sm text-gold font-semibold">
              <span className="inline-flex items-center gap-1">
                <IconPercent className="w-3.5 h-3.5" />
                Desconto por meta ({appliedTier?.percent}%)
              </span>
              <span>-{formatBRL(discountCents)}</span>
            </div>
          )}
          <div className="flex justify-between font-display text-2xl pt-2 border-t border-white/10 text-paper">
            <span>Total a pagar</span>
            <span className="text-gold font-semibold">{formatBRL(finalCents)}</span>
          </div>
        </div>

        <p className="mt-2 text-xs text-mute">
          Pagamento e entrega serão combinados diretamente no WhatsApp oficial. Nada é cobrado neste site.
        </p>

        {checkoutError && <p className="mt-4 text-sm text-gold">{checkoutError}</p>}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={checkout}
            className="flex-1 inline-flex min-h-12 items-center justify-center gap-2 rounded bg-gold px-6 text-xs uppercase tracking-[0.2em] text-ink font-bold hover:bg-gold-light transition shadow-lg shadow-gold/20 active:scale-95 cursor-pointer"
          >
            <IconWhatsApp className="w-4 h-4" />
            Finalizar Pedido via WhatsApp
          </button>
          <ButtonLink to="/colecao" variant="outline">
            Continuar comprando
          </ButtonLink>
        </div>
      </div>
    </div>
  )
}

function CartRow({
  item,
  line,
  product,
  onQty,
  onRemove,
}: {
  item: { productId: string; size: string | null; color: string | null; quantity: number }
  line?: ValidatedLine
  product?: Product
  onQty: (qty: number) => void
  onRemove: () => void
}) {
  const image = product ? primaryImage(product) : undefined
  const name = product?.name ?? 'Produto indisponível'

  return (
    <li className="flex gap-4 border border-white/10 bg-ink-2 p-3">
      <div className="h-24 w-20 shrink-0 bg-ink">
        {image ? (
          <img src={image.public_url} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-gold">SH</div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        {product ? (
          <Link to={`/produto/${product.slug}`} className="font-display text-lg">
            {name}
          </Link>
        ) : (
          <p className="font-display text-lg">{name}</p>
        )}
        <p className="mt-1 text-xs text-mute">
          {item.size ? `Tamanho: ${item.size}` : 'Tamanho: —'} · {item.color ? `Cor: ${item.color}` : 'Cor: —'}
        </p>
        <p className="mt-1 text-sm text-gold">
          {line ? `${formatBRL(line.unitCents)} · Subtotal ${formatBRL(line.subtotalCents)}` : 'Preço a confirmar'}
        </p>
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            className="min-h-11 min-w-11 border border-white/20"
            onClick={() => onQty(Math.max(1, item.quantity - 1))}
            aria-label="Diminuir"
          >
            −
          </button>
          <span className="min-w-8 text-center">{item.quantity}</span>
          <button
            type="button"
            className="min-h-11 min-w-11 border border-white/20"
            onClick={() => onQty(item.quantity + 1)}
            aria-label="Aumentar"
          >
            +
          </button>
          <button type="button" className="ml-auto text-xs uppercase tracking-[0.16em] text-mute" onClick={onRemove}>
            Remover
          </button>
        </div>
      </div>
    </li>
  )
}
