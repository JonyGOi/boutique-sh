import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { PRODUCT_CATEGORIES } from '../../config/store'
import { deleteProduct, updateProduct } from '../../lib/adminApi'
import { formatBRL } from '../../lib/money'
import { fetchAdminProducts } from '../../lib/products'
import { exportCatalogJson } from '../../lib/devStore'
import { isSupabaseConfigured, supabase } from '../../lib/supabase'
import { IconDownload, IconKey, IconHanger, IconPercent } from '../../components/ui/Icons'
import { CouponsManager } from '../../components/admin/CouponsManager'
import type { Product } from '../../types/product'

export function AdminDashboard() {
  const location = useLocation()
  const [activeTab, setActiveTab] = useState<'produtos' | 'cupons'>('produtos')
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('todos')
  const [category, setCategory] = useState('')

  useEffect(() => {
    const state = location.state as { notice?: string } | null
    if (state?.notice) {
      setNotice(state.notice)
      window.history.replaceState({}, document.title)
      const timer = setTimeout(() => setNotice(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [location.state])

  async function load() {
    setLoading(true)
    setError(null)
    try {
      setProducts(await fetchAdminProducts())
    } catch {
      setError('Não foi possível carregar os produtos.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (q && !p.name.toLowerCase().includes(q.toLowerCase())) return false
      if (category && p.category !== category) return false
      if (status === 'publicados') return p.published && !p.archived
      if (status === 'rascunhos') return !p.published && !p.archived
      if (status === 'arquivados') return p.archived
      return true
    })
  }, [products, q, status, category])

  async function togglePublish(product: Product) {
    try {
      await updateProduct(product.id, {
        name: product.name,
        description: product.description,
        price_cents: product.price_cents,
        category: product.category,
        sizes: product.sizes,
        colors: product.colors,
        stock: product.stock,
        track_stock: product.track_stock,
        available: product.available,
        published: !product.published,
        is_launch: product.is_launch,
        is_featured: product.is_featured,
        is_promo: product.is_promo,
        promo_price_cents: product.promo_price_cents,
        archived: product.archived,
      })
      await load()
    } catch {
      setError('Não foi possível alterar a publicação.')
    }
  }

  async function archive(product: Product) {
    try {
      await updateProduct(product.id, {
        name: product.name,
        description: product.description,
        price_cents: product.price_cents,
        category: product.category,
        sizes: product.sizes,
        colors: product.colors,
        stock: product.stock,
        track_stock: product.track_stock,
        available: product.available,
        published: false,
        is_launch: product.is_launch,
        is_featured: product.is_featured,
        is_promo: product.is_promo,
        promo_price_cents: product.promo_price_cents,
        archived: !product.archived,
      })
      await load()
    } catch {
      setError('Não foi possível arquivar o produto.')
    }
  }

  async function remove(product: Product) {
    if (!window.confirm(`Excluir "${product.name}"? Esta ação não pode ser desfeita.`)) return
    try {
      await deleteProduct(
        product.id,
        product.images.map((img) => img.path),
      )
      await load()
    } catch {
      setError('Não foi possível excluir o produto.')
    }
  }

  function handleExport() {
    const jsonStr = exportCatalogJson()
    const blob = new Blob([jsonStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `boutique-sh-catalogo-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    setNotice('Arquivo do catálogo exportado com sucesso!')
    setTimeout(() => setNotice(null), 4000)
  }

  async function handleChangePassword() {
    const nova = window.prompt('Digite a nova senha para o Painel de Administração (mínimo 6 caracteres):')
    if (nova === null) return
    if (nova.trim().length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      return
    }
    try {
      if (supabase && isSupabaseConfigured) {
        const { error: supErr } = await supabase.auth.updateUser({ password: nova.trim() })
        if (supErr) {
          throw new Error('Falha ao atualizar no Supabase: ' + supErr.message)
        }
      }
      setNotice('Senha alterada com sucesso! A nova senha já está ativa na nuvem para você e seu sócio.')
      setTimeout(() => setNotice(null), 6000)
    } catch (err: any) {
      setError(err.message || 'Erro ao alterar a senha.')
    }
  }

  return (
    <div>
      {/* Supabase Status Banner */}
      <div className="mb-8 border border-gold/30 bg-ink-2 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-green-400"></span>
              <p className="text-xs uppercase tracking-widest text-gold font-semibold">
                Banco de Dados Conectado (Supabase)
              </p>
            </div>
            <p className="mt-1 text-xs text-mute">
              Todas as peças cadastradas ou modificadas aqui são salvas na nuvem e aparecem imediatamente no site para todos os clientes.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExport}
              title="Baixar backup dos produtos em formato JSON"
              className="inline-flex items-center gap-1.5 border border-white/20 bg-ink px-3 py-1.5 text-xs text-paper hover:border-gold transition"
            >
              <IconDownload className="w-3.5 h-3.5 text-gold" />
              Backup JSON
            </button>
            <button
              type="button"
              onClick={handleChangePassword}
              title="Trocar a senha de acesso da conta no Supabase"
              className="inline-flex items-center gap-1.5 border border-gold/40 bg-gold/10 px-3 py-1.5 text-xs text-gold hover:bg-gold hover:text-ink transition font-medium"
            >
              <IconKey className="w-3.5 h-3.5" />
              Alterar Senha
            </button>
          </div>
        </div>
      </div>

      {notice && (
        <div className="mb-6 border border-gold bg-gold/10 px-4 py-3 text-xs text-gold">
          {notice}
        </div>
      )}

      {/* Abas de Navegação do Painel */}
      <div className="flex border-b border-white/10 mb-8 gap-4">
        <button
          type="button"
          onClick={() => setActiveTab('produtos')}
          className={`inline-flex items-center gap-2 pb-3 px-2 text-xs uppercase tracking-[0.2em] font-semibold border-b-2 transition ${
            activeTab === 'produtos'
              ? 'border-gold text-gold'
              : 'border-transparent text-mute hover:text-paper'
          }`}
        >
          <IconHanger className="w-4 h-4" />
          <span>Produtos ({products.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('cupons')}
          className={`inline-flex items-center gap-2 pb-3 px-2 text-xs uppercase tracking-[0.2em] font-semibold border-b-2 transition ${
            activeTab === 'cupons'
              ? 'border-gold text-gold'
              : 'border-transparent text-mute hover:text-paper'
          }`}
        >
          <IconPercent className="w-3.5 h-3.5" />
          <span>Cupons de Desconto</span>
        </button>
      </div>

      {activeTab === 'cupons' ? (
        <CouponsManager onNotice={(msg) => setNotice(msg)} />
      ) : (
        <>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-display text-4xl">Produtos</h1>
              <p className="mt-2 text-sm text-mute">Cadastre, publique e organize o catálogo da sua loja.</p>
            </div>
            <Link
              to="/admin/produtos/novo"
              className="inline-flex min-h-11 items-center bg-gold px-5 text-xs uppercase tracking-[0.2em] text-ink font-semibold hover:opacity-90 transition"
            >
              + Cadastrar produto
            </Link>
          </div>

      <div className="mt-8 grid gap-3 md:grid-cols-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Pesquisar produto pelo nome..."
          className="min-h-11 border border-white/15 bg-ink-2 px-3 text-sm focus:border-gold focus:outline-none"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="min-h-11 border border-white/15 bg-ink-2 px-3 text-sm focus:border-gold focus:outline-none"
        >
          <option value="">Todas as categorias</option>
          {PRODUCT_CATEGORIES.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.label}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="min-h-11 border border-white/15 bg-ink-2 px-3 text-sm focus:border-gold focus:outline-none"
        >
          <option value="todos">Todos os status</option>
          <option value="publicados">Publicados</option>
          <option value="rascunhos">Rascunhos</option>
          <option value="arquivados">Arquivados</option>
        </select>
      </div>

      {loading && <p className="mt-8 text-sm text-mute">Carregando…</p>}
      {error && <p className="mt-8 text-sm text-gold">{error}</p>}

      <ul className="mt-8 space-y-3">
        {filtered.map((product) => (
          <li key={product.id} className="border border-white/10 bg-ink-2 p-4 transition hover:border-white/20">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                {product.images[0]?.public_url ? (
                  <img
                    src={product.images[0].public_url}
                    alt={product.name}
                    className="h-16 w-16 object-cover border border-white/10"
                  />
                ) : (
                  <div className="h-16 w-16 bg-ink flex items-center justify-center border border-white/10 text-xs text-gold">
                    SH
                  </div>
                )}
                <div>
                  <p className="font-display text-xl text-paper">{product.name}</p>
                  <p className="mt-1 text-xs text-mute">
                    <strong className="text-gold">{formatBRL(product.price_cents)}</strong> · {product.category} ·{' '}
                    <span className={product.published ? 'text-green-400' : 'text-amber-400'}>
                      {product.published ? 'publicado' : 'rascunho'}
                    </span>
                    {product.is_launch && ' · Lançamento'}
                    {product.is_promo && ' · Promoção'}
                    {product.archived && ' · Arquivado'}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  to={`/admin/produtos/${product.id}`}
                  className="inline-flex min-h-11 items-center border border-gold px-4 text-xs uppercase tracking-[0.16em] text-gold hover:bg-gold hover:text-ink transition"
                >
                  Editar
                </Link>
                <Button type="button" variant="outline" onClick={() => void togglePublish(product)}>
                  {product.published ? 'Despublicar' : 'Publicar'}
                </Button>
                <Button type="button" variant="ghost" onClick={() => void archive(product)}>
                  {product.archived ? 'Desarquivar' : 'Arquivar'}
                </Button>
                <Button type="button" variant="ghost" onClick={() => void remove(product)}>
                  Excluir
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ul>
      {!loading && filtered.length === 0 && (
        <div className="mt-8 border border-dashed border-white/15 p-8 text-center text-mute">
          <p>Nenhum produto encontrado.</p>
          <Link
            to="/admin/produtos/novo"
            className="mt-3 inline-block text-xs uppercase tracking-wider text-gold underline"
          >
            Cadastrar primeiro produto agora
          </Link>
        </div>
      )}
    </>
  )}
</div>
  )
}
