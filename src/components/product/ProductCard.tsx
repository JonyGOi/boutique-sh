import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CATEGORIES } from '../../config/store'
import { effectivePriceCents, formatBRL } from '../../lib/money'
import { primaryImage } from '../../lib/products'
import { getColorHex, getColorName } from '../../lib/colors'
import { IconChevronLeft, IconChevronRight } from '../ui/Icons'
import type { Product } from '../../types/product'

export function ProductCard({ product }: { product: Product }) {
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const images = product.images && product.images.length > 0 ? product.images : []
  const image = images[activeImageIndex] ?? primaryImage(product)
  const price = effectivePriceCents(product)
  const category = CATEGORIES.find((c) => c.slug === product.category)?.label ?? product.category

  function handlePrev(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setActiveImageIndex((prev) => (prev <= 0 ? images.length - 1 : prev - 1))
  }

  function handleNext(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setActiveImageIndex((prev) => (prev >= images.length - 1 ? 0 : prev + 1))
  }

  return (
    <article className="group flex flex-col rounded-sm border border-white/10 bg-ink-2 overflow-hidden transition hover:border-gold/50 hover:shadow-lg hover:shadow-black/50">
      <Link to={`/produto/${product.slug}`} className="relative block aspect-[3/4] overflow-hidden bg-ink select-none">
        {image ? (
          <img
            src={image.public_url}
            alt={product.name}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
            onError={(e) => {
              e.currentTarget.src = 'https://placehold.co/600x800/151515/c9a24a?text=SH+Boutique'
            }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-ink">
            <span className="font-display text-3xl tracking-[0.3em] text-gold/70">SH</span>
          </div>
        )}

        {/* Setas de navegação nas fotos do card */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Foto anterior"
              title="Foto anterior"
              className="absolute left-1.5 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-black/75 border border-gold/50 text-gold opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition shadow-md hover:scale-110 hover:bg-black/95 active:scale-95 cursor-pointer z-10"
            >
              <IconChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Próxima foto"
              title="Próxima foto"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-black/75 border border-gold/50 text-gold opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition shadow-md hover:scale-110 hover:bg-black/95 active:scale-95 cursor-pointer z-10"
            >
              <IconChevronRight className="w-3.5 h-3.5" />
            </button>

            {/* Marcadores de fotos (pontinhos) */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 z-10 pointer-events-none">
              {images.map((_, idx) => (
                <span
                  key={idx}
                  className={`h-1 rounded-full transition-all ${
                    idx === activeImageIndex ? 'w-3 bg-gold shadow-sm' : 'w-1 bg-white/40'
                  }`}
                />
              ))}
            </div>
          </>
        )}

        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {product.is_example && <Badge>Exemplo</Badge>}
          {product.is_launch && <Badge color="gold">Lançamento</Badge>}
          {product.is_promo && <Badge color="promo">Promoção</Badge>}
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] uppercase tracking-[0.2em] text-mute">{category}</p>
          {product.colors.length > 0 && (
            <div className="flex items-center gap-1 shrink-0" title={`${product.colors.length} cores disponíveis`}>
              {product.colors.slice(0, 4).map((c) => (
                <span
                  key={c}
                  className="h-2 w-2 rounded-full border border-white/30 shadow-sm"
                  style={{ backgroundColor: getColorHex(c) }}
                  title={getColorName(c)}
                />
              ))}
              {product.colors.length > 4 && (
                <span className="text-[9px] text-mute font-mono">+{product.colors.length - 4}</span>
              )}
            </div>
          )}
        </div>
        <h3 className="mt-1 font-display text-base sm:text-lg leading-tight text-paper group-hover:text-gold transition">
          <Link to={`/produto/${product.slug}`}>{product.name}</Link>
        </h3>
        <p className="mt-auto pt-2 text-sm font-semibold text-gold">
          {product.is_promo && product.promo_price_cents != null ? (
            <>
              <span className="mr-2 text-xs text-mute font-normal line-through">
                {formatBRL(product.price_cents)}
              </span>
              {formatBRL(price)}
            </>
          ) : (
            formatBRL(price)
          )}
        </p>
        <Link
          to={`/produto/${product.slug}`}
          className="mt-2.5 block w-full rounded border border-white/15 bg-ink py-1.5 text-center text-[10px] uppercase tracking-[0.16em] text-paper/90 hover:border-gold hover:text-gold transition active:scale-95 font-medium"
        >
          Ver Peça
        </Link>
      </div>
    </article>
  )
}

function Badge({ children, color = 'normal' }: { children: string; color?: 'normal' | 'gold' | 'promo' }) {
  const colorClasses =
    color === 'promo'
      ? 'bg-rose-950/80 text-rose-300 border-rose-500/40'
      : color === 'gold'
      ? 'bg-gold/90 text-ink font-bold border-gold'
      : 'bg-ink/80 text-gold border-white/15'

  return (
    <span className={`rounded-sm border px-2 py-0.5 text-[9px] uppercase tracking-[0.18em] shadow-sm backdrop-blur-sm ${colorClasses}`}>
      {children}
    </span>
  )
}
