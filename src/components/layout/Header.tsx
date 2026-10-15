import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { CATEGORIES, STORE } from '../../config/store'
import { useCart } from '../../context/CartContext'
import { Logo } from '../Logo'
import { IconCart, IconPercent, IconWhatsApp } from '../ui/Icons'
import { buildWhatsAppSupportUrl } from '../../lib/whatsapp'

const nav = [
  { to: '/', label: 'Início' },
  { to: '/colecao', label: 'Coleção' },
  { to: '/colecao?categoria=promocoes', label: 'Promoções' },
]

export function Header() {
  const { count } = useCart()
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-ink/95 backdrop-blur">
      {/* Barra superior de incentivo de desconto / frete */}
      <div className="border-b border-gold/20 bg-gold/10 px-4 py-1.5 text-center text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-gold font-medium">
        <span className="inline-flex items-center gap-1.5">
          <IconPercent className="w-3 h-3 text-gold shrink-0" />
          <span>Incentivo Especial: <strong>5% OFF</strong> acima de R$ 300 e <strong>10% OFF</strong> acima de R$ 500</span>
        </span>
      </div>

      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        {/* Mobile: Botão Menu à esquerda */}
        <div className="flex items-center md:hidden w-11">
          <button
            type="button"
            className="inline-flex min-h-11 min-w-11 items-center justify-center border border-white/15 rounded"
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

        {/* Desktop: Links à esquerda */}
        <nav className="hidden items-center gap-6 md:flex flex-1" aria-label="Principal">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `text-xs uppercase tracking-[0.22em] transition ${isActive ? 'text-gold font-semibold' : 'text-paper hover:text-gold'}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* LOGO CENTRALIZADA E PROMINENTE (Mobile & Desktop) */}
        <div className="flex justify-center flex-shrink-0">
          <Logo compact={false} />
        </div>

        {/* Lado Direito: Atendimento & Carrinho */}
        <div className="flex items-center justify-end gap-2 md:flex-1">
          <a
            href={buildWhatsAppSupportUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden lg:inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.16em] text-mute hover:text-gold mr-2 transition"
            title="Atendimento no WhatsApp"
          >
            <IconWhatsApp className="w-3.5 h-3.5 text-gold" />
            <span>Atendimento</span>
          </a>

          <Link
            to="/carrinho"
            className="relative inline-flex min-h-11 min-w-11 items-center justify-center border border-gold/40 px-3 text-gold hover:border-gold transition rounded"
            aria-label={`Carrinho, ${count} ${count === 1 ? 'item' : 'itens'}`}
          >
            <IconCart className="w-5 h-5 text-gold" />
            <span className="ml-2 hidden text-xs tracking-[0.18em] sm:inline">{count}</span>
            {count > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-ink">
                {count}
              </span>
            )}
          </Link>
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
