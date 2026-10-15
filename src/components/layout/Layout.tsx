import { useState } from 'react'
import { Link, Outlet } from 'react-router-dom'
import { Footer } from './Footer'
import { Header } from './Header'
import { MobileBottomNav } from './MobileBottomNav'
import { isSupabaseConfigured } from '../../lib/supabase'
import { IconClose } from '../ui/Icons'

export function Layout() {
  const [dismissed, setDismissed] = useState(false)

  return (
    <div className="flex min-h-dvh flex-col bg-ink text-paper">
      {!isSupabaseConfigured && !dismissed && (
        <aside className="relative flex items-center justify-between bg-gold px-4 py-2 text-xs text-ink" aria-label="Aviso do ambiente de desenvolvimento">
          <p className="flex-1 text-center font-medium">
            <strong>Modo Demonstração / Dev Ativo:</strong> catálogo funcionando com armazenamento local.{' '}
            <Link to="/admin" className="ml-1 font-bold underline hover:opacity-80">
              Acessar Painel de Produtos (Senha: admin123)
            </Link>
          </p>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            aria-label="Fechar aviso"
            className="ml-2 px-1 text-ink hover:opacity-70"
            title="Fechar aviso"
          >
            <IconClose className="w-4 h-4" />
          </button>
        </aside>
      )}
      <Header />
      <main className="flex-1 pb-16 md:pb-0">
        <Outlet />
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  )
}
