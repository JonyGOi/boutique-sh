import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ProductCard } from '../components/product/ProductCard'
import { CategoryBar, STORE_CATEGORIES_WITH_ICONS } from '../components/layout/CategoryBar'
import { usePublishedProducts } from '../hooks/usePublishedProducts'
import { effectivePriceCents } from '../lib/money'

type SortKey = 'recentes' | 'preco-asc' | 'preco-desc' | 'nome'

export function Catalog() {
  const { products, loading, error } = usePublishedProducts()
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const categoria = params.get('categoria') ?? ''
  const sort = (params.get('ordenar') as SortKey) || 'recentes'

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    let list = products.filter((p) => {
      if (query && !`${p.name} ${p.description}`.toLowerCase().includes(query)) return false
      if (categoria === 'lancamentos') return p.is_launch
      if (categoria === 'promocoes') return p.is_promo
      if (categoria) return p.category === categoria
      return true
    })
    list = [...list].sort((a, b) => {
      if (sort === 'preco-asc') return effectivePriceCents(a) - effectivePriceCents(b)
      if (sort === 'preco-desc') return effectivePriceCents(b) - effectivePriceCents(a)
      if (sort === 'nome') return a.name.localeCompare(b.name, 'pt-BR')
      return +new Date(b.created_at) - +new Date(a.created_at)
    })
    return list
  }, [products, q, categoria, sort])

  function update(key: string, value: string) {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next)
  }

  function clearFilters() {
    const next = new URLSearchParams()
    if (sort !== 'recentes') next.set('ordenar', sort)
    setParams(next)
  }

  const activeCategoryLabel = STORE_CATEGORIES_WITH_ICONS.find((c) => c.slug === categoria)?.label

  return (
    <div>
      {/* Barra de Categorias Horizontal Superior (Fixa ao Rolar) */}
      <CategoryBar
        activeSlug={categoria}
        onSelect={(slug) => update('categoria', slug)}
        sticky
      />

      <div className="mx-auto max-w-6xl px-4 py-6 md:py-10">
        {/* Cabeçalho da Coleção */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.32em] text-gold">Boutique SH • Catálogo</p>
            <h1 className="mt-1 font-display text-3xl sm:text-4xl text-paper">
              {activeCategoryLabel && activeCategoryLabel !== 'Todas as Peças'
                ? activeCategoryLabel
                : 'Coleção Exclusiva'}
            </h1>
          </div>
          <p className="text-xs text-mute">
            {filtered.length} {filtered.length === 1 ? 'peça encontrada' : 'peças encontradas'}
          </p>
        </div>

        {/* Barra de Filtros e Busca Rápida para Celular e Desktop */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          {/* Campo de Busca com ícone e botão de limpar */}
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-3 flex items-center text-mute pointer-events-none text-sm">
              🔍
            </span>
            <input
              type="search"
              value={q}
              onChange={(e) => update('q', e.target.value)}
              placeholder="Pesquisar por nome ou detalhe..."
              className="min-h-11 w-full rounded border border-white/15 bg-ink-2 pl-9 pr-8 text-sm text-paper placeholder:text-mute focus:border-gold focus:outline-none transition"
            />
            {q && (
              <button
                type="button"
                onClick={() => update('q', '')}
                className="absolute inset-y-0 right-2 flex items-center px-1 text-xs text-mute hover:text-paper"
                title="Limpar busca"
              >
                ✕
              </button>
            )}
          </div>

          {/* Ordenação */}
          <div className="sm:w-56 shrink-0">
            <select
              value={sort}
              onChange={(e) => update('ordenar', e.target.value)}
              className="min-h-11 w-full rounded border border-white/15 bg-ink-2 px-3 text-sm text-paper focus:border-gold focus:outline-none transition cursor-pointer"
            >
              <option value="recentes">Mais recentes</option>
              <option value="preco-asc">Menor preço</option>
              <option value="preco-desc">Maior preço</option>
              <option value="nome">Nome (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Tags de Filtros Ativos */}
        {(categoria || q) && (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-mute text-[11px] uppercase tracking-wider">Filtros:</span>
            {categoria && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-2.5 py-1 text-gold">
                {activeCategoryLabel}
                <button
                  type="button"
                  onClick={() => update('categoria', '')}
                  className="hover:opacity-75 font-bold"
                  title="Remover categoria"
                >
                  ✕
                </button>
              </span>
            )}
            {q && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/5 px-2.5 py-1 text-paper">
                &ldquo;{q}&rdquo;
                <button
                  type="button"
                  onClick={() => update('q', '')}
                  className="hover:opacity-75 font-bold"
                  title="Remover busca"
                >
                  ✕
                </button>
              </span>
            )}
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs text-mute underline hover:text-gold transition ml-1"
            >
              Limpar todos
            </button>
          </div>
        )}

        {/* Grade de Produtos Mobile First */}
        <div className="mt-6">
          {loading && (
            <div className="py-12 text-center">
              <p className="text-sm text-mute animate-pulse">Carregando catálogo da boutique…</p>
            </div>
          )}

          {error && (
            <div className="rounded border border-gold/30 bg-ink-2 p-4 text-center">
              <p className="text-sm text-gold">{error}</p>
            </div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div className="py-16 text-center border border-white/10 bg-ink-2 p-8 rounded">
              <span className="text-3xl">👗</span>
              <p className="mt-3 font-display text-2xl text-paper">Nenhuma peça encontrada</p>
              <p className="mt-1 text-xs text-mute max-w-sm mx-auto">
                Tente selecionar outra categoria de roupa na barra superior ou limpe a busca para ver todos os produtos.
              </p>
              <button
                type="button"
                onClick={clearFilters}
                className="mt-4 rounded bg-gold px-4 py-2 text-xs uppercase tracking-widest text-ink font-semibold hover:bg-gold-light transition"
              >
                Ver Todas as Peças
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 md:gap-5">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
