import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { CATEGORIES } from '../config/store'
import { useCart } from '../context/CartContext'
import { effectivePriceCents, formatBRL } from '../lib/money'
import { fetchPublishedProductBySlug, primaryImage } from '../lib/products'
import type { Product } from '../types/product'

export function ProductPage() {
  const { slug = '' } = useParams()
  const { addItem } = useCart()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [size, setSize] = useState<string | null>(null)
  const [color, setColor] = useState<string | null>(null)
  const [qty, setQty] = useState(1)
  const [message, setMessage] = useState<string | null>(null)
  const [activeImage, setActiveImage] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    fetchPublishedProductBySlug(slug)
      .then((data) => {
        if (!active) return
        setProduct(data)
        setSize(data?.sizes[0] ?? null)
        setColor(data?.colors[0] ?? null)
        setActiveImage(data ? primaryImage(data)?.public_url ?? null : null)
      })
      .catch(() => {
        if (active) setError('Não foi possível carregar este produto.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [slug])

  if (loading) return <p className="px-4 py-16 text-center text-mute">Carregando peça…</p>
  if (error) return <p className="px-4 py-16 text-center text-gold">{error}</p>
  if (!product) return <p className="px-4 py-16 text-center text-mute">Produto não encontrado ou não publicado.</p>

  const price = effectivePriceCents(product)
  const category = CATEGORIES.find((c) => c.slug === product.category)?.label ?? product.category
  const main = activeImage

  function addToCart() {
    setMessage(null)
    if (product!.sizes.length > 0 && !size) {
      setMessage('Selecione um tamanho.')
      return
    }
    if (product!.colors.length > 0 && !color) {
      setMessage('Selecione uma cor.')
      return
    }
    if (!Number.isInteger(qty) || qty < 1) {
      setMessage('Informe uma quantidade válida.')
      return
    }
    if (product!.track_stock && (product!.stock ?? 0) < qty) {
      setMessage('Quantidade indisponível no estoque atual.')
      return
    }
    addItem({
      productId: product!.id,
      size: product!.sizes.length ? size : null,
      color: product!.colors.length ? color : null,
      quantity: qty,
    })
    setMessage('Peça adicionada ao carrinho.')
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 md:grid-cols-2">
      <div>
        <div className="aspect-[3/4] bg-ink-2">
          {main ? (
            <img src={main} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center font-display text-5xl tracking-[0.3em] text-gold/50">
              SH
            </div>
          )}
        </div>
        {product.images.length > 1 && (
          <div className="mt-3 grid grid-cols-4 gap-2">
            {product.images.map((img) => (
              <button
                key={img.id}
                type="button"
                onClick={() => setActiveImage(img.public_url)}
                className={`aspect-square overflow-hidden border ${
                  activeImage === img.public_url ? 'border-gold' : 'border-transparent'
                }`}
              >
                <img src={img.public_url} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <p className="text-xs uppercase tracking-[0.28em] text-gold">{category}</p>
        <h1 className="mt-3 font-display text-4xl text-paper">{product.name}</h1>
        {product.is_example && (
          <p className="mt-3 border border-gold/40 px-3 py-2 text-xs text-gold">
            Peça de exemplo para demonstração. Não representa mercadoria real disponível.
          </p>
        )}
        <p className="mt-4 text-xl text-gold">
          {product.is_promo && product.promo_price_cents != null && (
            <span className="mr-3 text-base text-mute line-through">{formatBRL(product.price_cents)}</span>
          )}
          {formatBRL(price)}
        </p>
        <p className="mt-5 whitespace-pre-wrap text-sm leading-relaxed text-mute">{product.description}</p>

        {product.sizes.length > 0 && (
          <fieldset className="mt-8">
            <legend className="text-xs uppercase tracking-[0.2em] text-paper">Tamanho</legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {product.sizes.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setSize(option)}
                  className={`min-h-11 min-w-11 border px-4 ${
                    size === option ? 'border-gold bg-gold text-ink' : 'border-white/20 text-paper'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </fieldset>
        )}

        {product.colors.length > 0 && (
          <fieldset className="mt-6">
            <legend className="text-xs uppercase tracking-[0.2em] text-paper">Cor</legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {product.colors.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setColor(option)}
                  className={`min-h-11 border px-4 ${
                    color === option ? 'border-gold bg-gold text-ink' : 'border-white/20 text-paper'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </fieldset>
        )}

        <div className="mt-8 flex items-center gap-3">
          <label className="text-xs uppercase tracking-[0.2em]" htmlFor="qty">
            Qtd
          </label>
          <div className="flex border border-white/20">
            <button
              type="button"
              className="min-h-11 min-w-11"
              onClick={() => setQty((n) => Math.max(1, n - 1))}
              aria-label="Diminuir quantidade"
            >
              −
            </button>
            <input
              id="qty"
              className="w-14 bg-transparent text-center"
              type="number"
              min={1}
              value={qty}
              onChange={(e) => setQty(Math.max(1, Math.floor(Number(e.target.value) || 1)))}
            />
            <button
              type="button"
              className="min-h-11 min-w-11"
              onClick={() => setQty((n) => n + 1)}
              aria-label="Aumentar quantidade"
            >
              +
            </button>
          </div>
        </div>

        <div className="mt-8">
          <Button type="button" onClick={addToCart} disabled={!product.available}>
            {product.available ? 'Adicionar ao carrinho' : 'Indisponível'}
          </Button>
        </div>
        {message && <p className="mt-4 text-sm text-gold">{message}</p>}
      </div>
    </div>
  )
}
