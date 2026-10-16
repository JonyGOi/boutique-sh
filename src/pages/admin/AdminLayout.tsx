import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { Logo } from '../../components/Logo'
import { useAuth } from '../../context/AuthContext'
import { IconSparkles } from '../../components/ui/Icons'

export function AdminLayout() {
  const { signOut, user } = useAuth()
  const location = useLocation()
  const isNovo = location.pathname === '/admin/produtos/novo' && !location.search.includes('aba=rapido')
  const isRapido = location.pathname === '/admin/produtos/novo' && location.search.includes('aba=rapido')

  return (
    <div className="min-h-dvh bg-ink">
      <header className="border-b border-white/10 px-4 py-3">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <Logo compact />
          <nav className="flex items-center gap-4 text-xs uppercase tracking-[0.18em]">
            <NavLink to="/admin" end className={({ isActive }) => (isActive ? 'text-gold' : 'text-paper')}>
              Produtos
            </NavLink>
            <Link to="/admin/produtos/novo" className={isNovo ? 'text-gold font-semibold' : 'text-paper'}>
              Novo
            </Link>
            <Link
              to="/admin/produtos/novo?aba=rapido"
              className={`inline-flex items-center gap-1.5 ${isRapido ? 'text-gold font-semibold' : 'text-paper'}`}
            >
              <IconSparkles className="w-3.5 h-3.5 text-gold" />
              <span>Cadastro Rápido</span>
            </Link>
            <Link to="/" className="text-mute">
              Ver loja
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <span className="hidden max-w-[140px] truncate text-xs text-mute sm:block">{user?.email}</span>
            <Button type="button" variant="outline" onClick={() => void signOut()}>
              Sair
            </Button>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </div>
    </div>
  )
}
