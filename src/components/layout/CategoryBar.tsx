import { useRef } from 'react'
import { Link } from 'react-router-dom'

export const STORE_CATEGORIES_WITH_ICONS = [
  { slug: '', label: 'Todas as Peças', icon: '✨' },
  { slug: 'vestidos', label: 'Vestidos', icon: '👗' },
  { slug: 'blusas', label: 'Blusas', icon: '👚' },
  { slug: 'camisas', label: 'Camisas', icon: '👔' },
  { slug: 'calcas', label: 'Calças', icon: '👖' },
  { slug: 'saias', label: 'Saias', icon: '🩱' },
  { slug: 'conjuntos', label: 'Conjuntos', icon: '🧥' },
  { slug: 'promocoes', label: 'Promoções', icon: '🏷️' },
  { slug: 'lancamentos', label: 'Lançamentos', icon: '⚡' },
] as const

interface CategoryBarProps {
  activeSlug?: string
  onSelect?: (slug: string) => void
  sticky?: boolean
  className?: string
}

export function CategoryBar({
  activeSlug = '',
  onSelect,
  sticky = false,
  className = '',
}: CategoryBarProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  function handleSelect(slug: string, targetEl?: HTMLElement) {
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
    }
    if (onSelect) {
      onSelect(slug)
    }
  }

  return (
    <nav
      aria-label="Categorias de roupas"
      className={`w-full border-y border-white/10 bg-ink-2/95 backdrop-blur-md ${
        sticky ? 'sticky top-14 z-30' : ''
      } ${className}`}
    >
      <div className="mx-auto max-w-6xl">
        <div
          ref={scrollRef}
          className="no-scrollbar flex items-center gap-2 overflow-x-auto px-4 py-2.5 scroll-smooth"
        >
          {STORE_CATEGORIES_WITH_ICONS.map((cat) => {
            const isActive = activeSlug === cat.slug
            const content = (
              <>
                <span className="text-sm leading-none" role="img" aria-hidden="true">
                  {cat.icon}
                </span>
                <span className="whitespace-nowrap text-xs uppercase tracking-[0.16em]">
                  {cat.label}
                </span>
              </>
            )

            const baseClasses = `flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-medium transition active:scale-95 touch-manipulation cursor-pointer ${
              isActive
                ? 'bg-gold text-ink font-semibold shadow-md shadow-gold/20'
                : 'border border-white/15 bg-ink text-paper hover:border-gold/50 hover:text-gold'
            }`

            if (onSelect) {
              return (
                <button
                  key={cat.slug}
                  type="button"
                  onClick={(e) => handleSelect(cat.slug, e.currentTarget)}
                  className={baseClasses}
                  aria-pressed={isActive}
                >
                  {content}
                </button>
              )
            }

            return (
              <Link
                key={cat.slug}
                to={cat.slug ? `/colecao?categoria=${cat.slug}` : '/colecao'}
                className={baseClasses}
              >
                {content}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
