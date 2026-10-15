import { useState, useRef, useEffect } from 'react'
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { CATEGORIES, STORE } from '../../config/store'
import { useCart } from '../../context/CartContext'
import { Logo } from '../Logo'
import { IconCart, IconClose, IconPercent, IconSearch, IconWhatsApp } from '../ui/Icons'
import { buildWhatsAppSupportUrl } from '../../lib/whatsapp'

const nav = [
  { to: '/', label: 'Início' },
  { to: '/colecao', label: 'Coleção' },
  { to: '/colecao?categoria=promocoes', label: 'Promoções' },
]

export function Header() {
  const { count } = useCart()
  const [open, setOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const location = useLocation()

  // Sincroniza termo de busca se houver na URL
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const q = params.get('q')
    if (q) setSearchTerm(q)
  }, [location.search])

  // Foco no campo quando a barra de pesquisa abrir
  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 60)
    }
  }, [searchOpen])

  // Fecha busca ao pressionar a tecla Esc
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && searchOpen) {
        setSearchOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [searchOpen])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchTerm.trim()) {
      navigate(`/colecao?q=${encodeURIComponent(searchTerm.trim())}`)
      setSearchOpen(false)
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-ink/95 backdrop-blur">
      {/* Barra superior de incentivo de desconto / frete */}
      <div className="border-b border-gold/20 bg-gold/10 px-4 py-1.5 text-center text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-gold font-medium">
        <span className="inline-flex items-center gap-1.5">
          <IconPercent className="w-3 h-3 text-gold shrink-0" />
          <span>Incentivo Especial: <strong>5% OFF</strong> acima de R$ 300 e <strong>10% OFF</strong> acima de R$ 500</span>
        </span>
      </div>

      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 sm:gap-4 px-3 sm:px-4 py-3">
        {/* Mobile: Botão Menu à esquerda */}
        <div className="flex items-center md:hidden w-11">
          <button
            type="button"
            className="inline-flex min-h-11 min-w-11 items-center justify-center border border-white/15 rounded"
            aria-expanded={open}
            aria-controls="menu-mobile"
            onClick={() => {
              setOpen((v) => !v)
              if (searchOpen) setSearchOpen(false)
            }}
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

        {/* Lado Direito: Lupa no canto lá de cima, Atendimento & Carrinho */}
        <div className="flex items-center justify-end gap-2 md:flex-1">
          {/* Lupa de pesquisa no canto superior */}
          <button
            type="button"
            onClick={() => {
              setSearchOpen((v) => !v)
              if (open) setOpen(false)
            }}
            className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded border transition ${
              searchOpen
                ? 'border-gold bg-gold/15 text-gold'
                : 'border-white/15 text-paper hover:border-gold hover:text-gold'
            }`}
            aria-label={searchOpen ? 'Fechar pesquisa' : 'Pesquisar no site'}
            title="Pesquisar produtos"
          >
            <IconSearch className="w-5 h-5" />
          </button>

          <a
            href={buildWhatsAppSupportUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden lg:inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.16em] text-mute hover:text-gold mr-1 transition"
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

      {/* Barra de Busca Expansível (Aberta pela Lupa) */}
      {searchOpen && (
        <div className="border-t border-gold/30 bg-ink-2 px-4 py-3.5 shadow-2xl">
          <form onSubmit={handleSearchSubmit} className="mx-auto flex max-w-3xl items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-3.5 flex items-center text-gold pointer-events-none">
                <IconSearch className="w-4 h-4 text-gold" />
              </span>
              <input
                ref={searchInputRef}
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="O que você procura? (ex: Vestido, Camisa de Linho, Sandália...)"
                className="w-full rounded border border-gold/40 bg-ink py-2.5 pl-10 pr-10 text-sm text-paper placeholder-mute focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-3 flex items-center text-mute hover:text-paper"
                  title="Limpar pesquisa"
                >
                  <IconClose className="w-4 h-4" />
                </button>
              )}
            </div>

            <button
              type="submit"
              className="inline-flex min-h-10 items-center justify-center rounded bg-gold px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-ink hover:bg-gold-light transition"
            >
              Buscar
            </button>

            <button
              type="button"
              onClick={() => setSearchOpen(false)}
              className="inline-flex min-h-10 min-w-10 items-center justify-center rounded border border-white/10 text-mute hover:border-white/25 hover:text-paper transition"
              title="Fechar busca"
            >
              <IconClose className="w-4 h-4" />
            </button>
          </form>

          {/* Sugestões rápidas de busca */}
          <div className="mx-auto mt-2.5 flex max-w-3xl flex-wrap items-center gap-1.5 text-xs">
            <span className="text-[10px] uppercase tracking-[0.2em] text-mute mr-1">Sugestões:</span>
            {['Vestidos', 'Camisas', 'Blazers', 'Calças', 'Linho', 'Sandálias', 'Promoções'].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setSearchOpen(false)
                  navigate(`/colecao?q=${encodeURIComponent(item)}`)
                }}
                className="rounded-full border border-white/10 bg-ink px-2.5 py-1 text-[11px] text-paper hover:border-gold/50 hover:text-gold transition"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Menu Gaveta Mobile */}
      {open && (
        <div id="menu-mobile" className="border-t border-white/10 bg-ink-2 px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-3" aria-label="Mobile">
            {/* Campo de pesquisa direta no menu mobile */}
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (searchTerm.trim()) {
                  navigate(`/colecao?q=${encodeURIComponent(searchTerm.trim())}`)
                  setOpen(false)
                }
              }}
              className="relative mb-2"
            >
              <span className="absolute inset-y-0 left-3 flex items-center text-gold pointer-events-none">
                <IconSearch className="w-4 h-4 text-gold" />
              </span>
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar peças, marcas, tecidos..."
                className="w-full rounded border border-white/15 bg-ink py-2.5 pl-9 pr-3 text-xs text-paper placeholder-mute focus:border-gold focus:outline-none"
              />
            </form>

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
