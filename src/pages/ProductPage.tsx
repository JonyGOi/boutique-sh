import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CATEGORIES } from '../config/store'
import { useCart } from '../context/CartContext'
import { effectivePriceCents, formatBRL } from '../lib/money'
import { fetchPublishedProductBySlug, primaryImage } from '../lib/products'
import type { Product } from '../types/product'
import { IconCart, IconRuler, IconShield, IconTruck } from '../components/ui/Icons'
import { SizeGuideModal } from '../components/product/SizeGuideModal'

export function ProductPage() {
  const { slug = '' } = useParams()
  const navigate = useNavigate()
  const { addItem } = useCart()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [size, setSize] = useState<string | null>(null)
  const [color, setColor] = useState<string | null>(null)
  const [qty, setQty] = useState(1)
  const [message, setMessage] = useState<string | null>(null)
  const [activeImage, setActiveImage] = useState<string | null>(null)
  const [showSizeModal, setShowSizeModal] = useState(false)

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
  const categoryObj = CATEGORIES.find((c) => c.slug === product.category)
  const categoryLabel = categoryObj?.label ?? product.category
  const main = activeImage

  function validateSelection(): boolean {
    setMessage(null)
    if (product!.sizes.length > 0 && !size) {
      setMessage('Por favor, selecione um tamanho antes de continuar.')
      return false
    }
    if (product!.colors.length > 0 && !color) {
      setMessage('Por favor, selecione uma cor antes de continuar.')
      return false
    }
    if (!Number.isInteger(qty) || qty < 1) {
      setMessage('Informe uma quantidade válida.')
      return false
    }
    if (product!.track_stock && (product!.stock ?? 0) < qty) {
      setMessage('Quantidade indisponível no estoque atual.')
      return false
    }
    return true
  }

  function addToCart() {
    if (!validateSelection()) return
    addItem({
      productId: product!.id,
      size: product!.sizes.length ? size : null,
      color: product!.colors.length ? color : null,
      quantity: qty,
    })
    setMessage('Peça adicionada à sacola!')
    setTimeout(() => setMessage(null), 3500)
  }

  function buyNow() {
    if (!validateSelection()) return
    addItem({
      productId: product!.id,
      size: product!.sizes.length ? size : null,
      color: product!.colors.length ? color : null,
      quantity: qty,
    })
    navigate('/carrinho')
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:py-12 pb-24 md:pb-12">
      <div className="grid gap-10 md:grid-cols-2">
        {/* Galeria de Fotos */}
        <div>
          <div className="aspect-[3/4] overflow-hidden rounded border border-white/10 bg-ink-2">
            {main ? (
              <img src={main} alt={product.name} className="h-full w-full object-cover transition duration-300" />
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
                  className={`aspect-square overflow-hidden rounded border transition ${
                    activeImage === img.public_url ? 'border-gold shadow-md shadow-gold/20' : 'border-white/10 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img.public_url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Informações da Peça */}
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-[0.28em] text-gold font-medium">{categoryLabel}</span>
            {product.gender && (
              <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-paper font-semibold">
                {product.gender}
              </span>
            )}
            {product.brand && (
              <span className="rounded border border-gold/40 px-2 py-0.5 text-[10px] uppercase tracking-wider text-gold font-semibold">
                {product.brand}
              </span>
            )}
          </div>

          <h1 className="mt-3 font-display text-3xl sm:text-4xl text-paper">{product.name}</h1>

          {product.is_example && (
            <p className="mt-3 border border-gold/40 bg-gold/10 px-3 py-2 text-xs text-gold">
              Peça de demonstração da boutique.
            </p>
          )}

          <div className="mt-4 flex items-baseline gap-3">
            {product.is_promo && product.promo_price_cents != null && (
              <span className="text-base text-mute line-through">{formatBRL(product.price_cents)}</span>
            )}
            <span className="text-2xl sm:text-3xl font-display text-gold">{formatBRL(price)}</span>
            {product.is_promo && (
              <span className="rounded bg-red-950/80 border border-red-500/40 px-2 py-0.5 text-[10px] uppercase tracking-wider text-red-200 font-bold">
                Promoção
              </span>
            )}
          </div>

          <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-mute">{product.description}</p>

          {/* Ficha Técnica / Subcategorias */}
          {(product.brand || product.material || product.model_type) && (
            <div className="mt-6 rounded border border-white/10 bg-ink-2 p-3.5 text-xs">
              <p className="text-[10px] uppercase tracking-[0.25em] text-gold font-semibold mb-2">Detalhes da Peça</p>
              <div className="grid grid-cols-2 gap-2 text-mute">
                {product.brand && (
                  <p><strong className="text-paper">Marca:</strong> {product.brand}</p>
                )}
                {product.material && (
                  <p><strong className="text-paper">Tecido:</strong> {product.material}</p>
                )}
                {product.model_type && (
                  <p><strong className="text-paper">Modelo:</strong> {product.model_type}</p>
                )}
                {product.gender && (
                  <p><strong className="text-paper">Gênero:</strong> {product.gender}</p>
                )}
              </div>
            </div>
          )}

          {/* Seletor de Tamanhos com Botão da Tabela de Medidas */}
          {product.sizes.length > 0 && (
            <fieldset className="mt-7">
              <div className="flex items-center justify-between">
                <legend className="text-xs uppercase tracking-[0.2em] text-paper font-semibold">Tamanho</legend>
                <button
                  type="button"
                  onClick={() => setShowSizeModal(true)}
                  className="inline-flex items-center gap-1.5 text-xs text-gold hover:underline transition cursor-pointer"
                >
                  <IconRuler className="w-3.5 h-3.5" />
                  <span>Tabela de Medidas</span>
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {product.sizes.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setSize(option)}
                    className={`min-h-11 min-w-11 rounded border px-4 text-xs font-semibold uppercase tracking-wider transition ${
                      size === option
                        ? 'border-gold bg-gold text-ink shadow-md shadow-gold/20'
                        : 'border-white/20 text-paper hover:border-gold/50'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          {/* Seletor de Cores */}
          {product.colors.length > 0 && (
            <fieldset className="mt-6">
              <legend className="text-xs uppercase tracking-[0.2em] text-paper font-semibold">Cor</legend>
              <div className="mt-3 flex flex-wrap gap-2">
                {product.colors.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setColor(option)}
                    className={`min-h-11 rounded border px-4 text-xs font-medium uppercase tracking-wider transition ${
                      color === option
                        ? 'border-gold bg-gold text-ink shadow-md shadow-gold/20'
                        : 'border-white/20 text-paper hover:border-gold/50'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          {/* Quantidade */}
          <div className="mt-6 flex items-center gap-3">
            <label className="text-xs uppercase tracking-[0.2em] text-paper font-semibold" htmlFor="qty">
              Qtd
            </label>
            <div className="flex rounded border border-white/20 bg-ink-2">
              <button
                type="button"
                className="min-h-11 min-w-11 text-lg text-paper hover:text-gold transition"
                onClick={() => setQty((n) => Math.max(1, n - 1))}
                aria-label="Diminuir quantidade"
              >
                −
              </button>
              <input
                id="qty"
                className="w-14 bg-transparent text-center text-sm font-semibold text-paper"
                type="number"
                min={1}
                value={qty}
                onChange={(e) => setQty(Math.max(1, Math.floor(Number(e.target.value) || 1)))}
              />
              <button
                type="button"
                className="min-h-11 min-w-11 text-lg text-paper hover:text-gold transition"
                onClick={() => setQty((n) => n + 1)}
                aria-label="Aumentar quantidade"
              >
                +
              </button>
            </div>
          </div>

          {/* BOTÃO ESTILO SHOPEE: Carrinho [🛒] ao lado + COMPRAR AGORA principal */}
          <div className="mt-8 flex items-center gap-3">
            <button
              type="button"
              onClick={addToCart}
              disabled={!product.available}
              title="Adicionar à sacola de compras"
              className="flex h-12 w-14 shrink-0 items-center justify-center rounded border border-gold/70 bg-gold/10 text-gold hover:bg-gold hover:text-ink transition active:scale-95 disabled:opacity-40"
            >
              <IconCart className="w-6 h-6" />
              <span className="sr-only">Adicionar à sacola</span>
            </button>

            <button
              type="button"
              onClick={buyNow}
              disabled={!product.available}
              className="flex-1 min-h-12 rounded bg-gold px-6 text-xs sm:text-sm uppercase tracking-[0.22em] font-bold text-ink hover:bg-gold-light transition shadow-lg shadow-gold/20 active:scale-95 disabled:opacity-50"
            >
              {product.available ? 'Comprar Agora' : 'Indisponível'}
            </button>
          </div>

          {message && (
            <div className="mt-4 rounded border border-gold/40 bg-gold/10 p-3 text-xs text-gold animate-fadeIn">
              {message}
            </div>
          )}

          {/* Selos de Confiança na Página do Produto */}
          <div className="mt-8 border-t border-white/10 pt-5 grid grid-cols-2 gap-3 text-[11px] text-mute">
            <div className="flex items-center gap-2">
              <IconTruck className="w-4 h-4 text-gold shrink-0" />
              <span>Envio para todo o Brasil</span>
            </div>
            <div className="flex items-center gap-2">
              <IconShield className="w-4 h-4 text-gold shrink-0" />
              <span>Troca fácil garantida</span>
            </div>
          </div>
        </div>
      </div>

      {/* BARRA FIXA FLUTUANTE PARA CELULAR (Estilo Shopee) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-ink/95 backdrop-blur-lg p-2.5 md:hidden shadow-2xl flex items-center gap-2.5">
        <button
          type="button"
          onClick={addToCart}
          disabled={!product.available}
          title="Adicionar à sacola"
          className="flex h-11 w-12 shrink-0 items-center justify-center rounded border border-gold/60 bg-gold/10 text-gold hover:bg-gold hover:text-ink transition active:scale-95 disabled:opacity-40"
        >
          <IconCart className="w-5 h-5" />
          <span className="sr-only">Adicionar à sacola</span>
        </button>

        <button
          type="button"
          onClick={buyNow}
          disabled={!product.available}
          className="flex-1 min-h-11 rounded bg-gold px-4 text-xs uppercase tracking-[0.2em] font-bold text-ink hover:bg-gold-light transition shadow-md shadow-gold/20 active:scale-95 disabled:opacity-50"
        >
          {product.available ? 'Comprar Agora' : 'Indisponível'}
        </button>
      </div>

      {/* Modal da Tabela de Medidas */}
      <SizeGuideModal
        category={product.category}
        isOpen={showSizeModal}
        onClose={() => setShowSizeModal(false)}
      />
    </div>
  )
}
