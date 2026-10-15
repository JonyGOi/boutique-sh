import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, ButtonLink } from '../components/ui/Button'
import { useCart } from '../context/CartContext'
import { cartKey, totalCents, validateCartAgainstCatalog } from '../lib/cart'
import { formatBRL } from '../lib/money'
import { fetchPublishedByIds, primaryImage } from '../lib/products'
import { buildWhatsAppCheckoutUrl } from '../lib/whatsapp'
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
  const total = totalCents(lines)

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
    const url = buildWhatsAppCheckoutUrl(lines, total)
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
        <p className="flex justify-between font-display text-2xl">
          <span>Total dos produtos</span>
          <span className="text-gold">{formatBRL(total)}</span>
        </p>
        <p className="mt-2 text-xs text-mute">Pagamento e entrega serão combinados no WhatsApp. Nada é cobrado aqui.</p>
        {checkoutError && <p className="mt-4 text-sm text-gold">{checkoutError}</p>}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button type="button" onClick={checkout}>
            Finalizar Pedido via WhatsApp
          </Button>
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
