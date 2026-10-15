import { Link, useLocation } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import { buildWhatsAppSupportUrl } from '../../lib/whatsapp'

export function MobileBottomNav() {
  const { count } = useCart()
  const location = useLocation()
  const path = location.pathname

  const isHome = path === '/'
  const isCatalog = path === '/colecao'
  const isCart = path === '/carrinho'

  return (
    <nav
      aria-label="Navegação rápida móvel"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-ink/95 backdrop-blur-lg md:hidden"
    >
      <div className="mx-auto grid grid-cols-4 items-center px-2 py-1.5 text-center">
        {/* Início */}
        <Link
          to="/"
          className={`flex flex-col items-center justify-center py-1.5 transition active:scale-95 ${
            isHome ? 'text-gold' : 'text-mute hover:text-paper'
          }`}
        >
          <span className="text-xl">🏠</span>
          <span className="mt-0.5 text-[10px] uppercase tracking-wider font-medium">Início</span>
        </Link>

        {/* Coleção / Roupas */}
        <Link
          to="/colecao"
          className={`flex flex-col items-center justify-center py-1.5 transition active:scale-95 ${
            isCatalog ? 'text-gold' : 'text-mute hover:text-paper'
          }`}
        >
          <span className="text-xl">👗</span>
          <span className="mt-0.5 text-[10px] uppercase tracking-wider font-medium">Coleção</span>
        </Link>

        {/* WhatsApp Direto */}
        <a
          href={buildWhatsAppSupportUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center py-1.5 text-green-400 hover:text-green-300 transition active:scale-95"
          title="Falar no WhatsApp"
        >
          <span className="relative flex items-center justify-center text-xl">
            💬
            <span className="absolute -top-0.5 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
          </span>
          <span className="mt-0.5 text-[10px] uppercase tracking-wider font-semibold">Whats</span>
        </a>

        {/* Carrinho / Sacola */}
        <Link
          to="/carrinho"
          className={`relative flex flex-col items-center justify-center py-1.5 transition active:scale-95 ${
            isCart ? 'text-gold' : 'text-mute hover:text-paper'
          }`}
        >
          <span className="relative text-xl">
            🛍️
            {count > 0 && (
              <span className="absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[9px] font-bold text-ink">
                {count}
              </span>
            )}
          </span>
          <span className="mt-0.5 text-[10px] uppercase tracking-wider font-medium">Sacola</span>
        </Link>
      </div>
    </nav>
  )
}
