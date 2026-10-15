import { lazy, Suspense } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { Layout } from './components/layout/Layout'
import { Home } from './pages/Home'
import { Catalog } from './pages/Catalog'
import { ProductPage } from './pages/ProductPage'
import { CartPage } from './pages/CartPage'
import { Privacy } from './pages/Privacy'
import { NotFound } from './pages/NotFound'
import { ScrollToTop } from './components/ScrollToTop'
import { SiteTracker } from './components/SiteTracker'

const AdminLogin = lazy(() =>
  import('./pages/admin/AdminLogin').then((m) => ({ default: m.AdminLogin })),
)
const AdminGuard = lazy(() =>
  import('./pages/admin/AdminGuard').then((m) => ({ default: m.AdminGuard })),
)
const AdminLayout = lazy(() =>
  import('./pages/admin/AdminLayout').then((m) => ({ default: m.AdminLayout })),
)
const AdminDashboard = lazy(() =>
  import('./pages/admin/AdminDashboard').then((m) => ({ default: m.AdminDashboard })),
)
const ProductFormPage = lazy(() =>
  import('./pages/admin/ProductFormPage').then((m) => ({ default: m.ProductFormPage })),
)

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <HashRouter>
          <ScrollToTop />
          <SiteTracker />
          <Suspense fallback={<p className="px-4 py-20 text-center text-mute">Carregando…</p>}>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/colecao" element={<Catalog />} />
              <Route path="/produto/:slug" element={<ProductPage />} />
              <Route path="/carrinho" element={<CartPage />} />
              <Route path="/privacidade" element={<Privacy />} />
              <Route path="*" element={<NotFound />} />
            </Route>
            <Route path="/admin/entrar" element={<AdminLogin />} />
            <Route element={<AdminGuard />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="produtos/novo" element={<ProductFormPage />} />
                <Route path="produtos/:id" element={<ProductFormPage />} />
              </Route>
            </Route>
            <Route path="/login" element={<Navigate to="/admin/entrar" replace />} />
          </Routes>
          </Suspense>
        </HashRouter>
      </CartProvider>
    </AuthProvider>
  )
}
