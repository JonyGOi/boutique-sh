import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export function AdminGuard() {
  const { ready, isAdmin, isDevMode, session, signOut } = useAuth()

  if (!ready) {
    return <p className="px-4 py-20 text-center text-mute">Verificando sessão…</p>
  }
  if (!isDevMode && session && !isAdmin) {
    void signOut()
    return <Navigate to="/admin/entrar" replace />
  }
  if (!isAdmin) {
    return <Navigate to="/admin/entrar" replace />
  }
  return <Outlet />
}
