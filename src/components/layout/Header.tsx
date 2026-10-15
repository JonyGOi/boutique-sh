import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { CATEGORIES, STORE } from '../../config/store'
import { useCart } from '../../context/CartContext'
import { Logo } from '../Logo'

const nav = [
  { to: '/', label: 'Início' },
  { to: '/colecao', label: 'Coleção' },
  { to: '/carrinho', label: 'Carrinho' },
]

export function Header() {
  const { count } = useCart()
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-ink/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Logo compact={false} />

        <nav className="hidden items-center gap-6 md:flex" aria-label="Principal">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `text-xs uppercase tracking-[0.22em] ${isActive ? 'text-gold' : 'text-paper hover:text-gold'}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            to="/carrinho"
            className="relative inline-flex min-h-11 min-w-11 items-center justify-center border border-gold/40 px-3 text-gold"
            aria-label={`Carrinho, ${count} ${count === 1 ? 'item' : 'itens'}`}
          >
            <CartIcon />
            <span className="ml-2 hidden text-xs tracking-[0.18em] sm:inline">{count}</span>
            {count > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center bg-gold px-1 text-[10px] text-ink">
                {count}
              </span>
            )}
          </Link>
          <button
            type="button"
            className="inline-flex min-h-11 min-w-11 items-center justify-center border border-white/15 md:hidden"
            aria-expanded={open}
            aria-controls="menu-mobile"
            onClick={() => setOpen((v) => !v)}
          >
            <span className="sr-only">{open ? 'Fechar menu' : 'Abrir menu'}</span>
            <span className="flex flex-col gap-1.5">
              <span className="block h-px w-5 bg-gold" />
              <span className="block h-px w-5 bg-gold" />
              <span className="block h-px w-5 bg-gold" />
            </span>
          </button>
        </div>
      </div>

      {open && (
        <div id="menu-mobile" className="border-t border-white/10 bg-ink-2 px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-3" aria-label="Mobile">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="min-h-11 py-2 text-sm uppercase tracking-[0.2em] text-paper"
              >
                {item.label}
              </NavLink>
            ))}
            <p className="pt-3 text-[10px] uppercase tracking-[0.3em] text-mute">Categorias</p>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((cat) => (
                <Link
                  key={cat.slug}
                  to={`/colecao?categoria=${cat.slug}`}
                  onClick={() => setOpen(false)}
                  className="min-h-11 border border-white/10 px-3 py-3 text-xs uppercase tracking-[0.16em] text-gold"
                >
                  {cat.label}
                </Link>
              ))}
            </div>
            <p className="pt-2 text-xs text-mute">{STORE.name}</p>
          </nav>
        </div>
      )}
    </header>
  )
}

function CartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 7h15l-1.5 9h-12L5 4H2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="9" cy="20" r="1.2" fill="currentColor" />
      <circle cx="18" cy="20" r="1.2" fill="currentColor" />
    </svg>
  )
}
