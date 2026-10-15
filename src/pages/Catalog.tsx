import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ProductCard } from '../components/product/ProductCard'
import { CategoryBar, STORE_CATEGORIES_WITH_ICONS } from '../components/layout/CategoryBar'
import { usePublishedProducts } from '../hooks/usePublishedProducts'
import { effectivePriceCents } from '../lib/money'
import { IconSearch, IconClose, IconHanger } from '../components/ui/Icons'

type SortKey = 'recentes' | 'preco-asc' | 'preco-desc' | 'nome'

export function Catalog() {
  const { products, loading, error } = usePublishedProducts()
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const categoria = params.get('categoria') ?? ''
  const marca = params.get('marca') ?? ''
  const tecido = params.get('tecido') ?? ''
  const sexo = params.get('sexo') ?? ''
  const modelo = params.get('modelo') ?? ''
  const sort = (params.get('ordenar') as SortKey) || 'recentes'

  // Facetas disponíveis baseadas nos produtos
  const availableBrands = useMemo(() => {
    const set = new Set<string>()
    products.forEach((p) => {
      if ((!categoria || categoria === 'promocoes' || p.category === categoria) && p.brand) set.add(p.brand)
    })
    return [...set].sort()
  }, [products, categoria])

  const availableMaterials = useMemo(() => {
    const set = new Set<string>()
    products.forEach((p) => {
      if ((!categoria || categoria === 'promocoes' || p.category === categoria) && p.material) set.add(p.material)
    })
    return [...set].sort()
  }, [products, categoria])

  const availableGenders = ['Feminino', 'Masculino', 'Unissex']

  const availableModels = useMemo(() => {
    if (categoria === 'acessorios') {
      return ['Bolsas', 'Relógios', 'Pulseiras']
    }
    const set = new Set<string>()
    products.forEach((p) => {
      if ((!categoria || p.category === categoria) && p.model_type) set.add(p.model_type)
    })
    return [...set].sort()
  }, [products, categoria])

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    let list = products.filter((p) => {
      if (query && !`${p.name} ${p.description} ${p.brand ?? ''} ${p.material ?? ''}`.toLowerCase().includes(query))
        return false
      if (categoria === 'promocoes' && !p.is_promo) return false
      if (categoria && categoria !== 'promocoes' && p.category !== categoria) return false
      if (marca && p.brand?.toLowerCase() !== marca.toLowerCase()) return false
      if (tecido && p.material?.toLowerCase() !== tecido.toLowerCase()) return false
      if (sexo && p.gender?.toLowerCase() !== sexo.toLowerCase()) return false
      if (modelo && (p.model_type?.toLowerCase() !== modelo.toLowerCase())) return false
      return true
    })
    list = [...list].sort((a, b) => {
      if (sort === 'preco-asc') return effectivePriceCents(a) - effectivePriceCents(b)
      if (sort === 'preco-desc') return effectivePriceCents(b) - effectivePriceCents(a)
      if (sort === 'nome') return a.name.localeCompare(b.name, 'pt-BR')
      return +new Date(b.created_at) - +new Date(a.created_at)
    })
    return list
  }, [products, q, categoria, marca, tecido, sexo, modelo, sort])

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

  const hasSubfilters =
    (categoria === 'camisas' || categoria === 'calcas' || categoria === 'bermudas' || categoria === 'vestidos' || categoria === 'blazers' || categoria === 'blusas' || categoria === 'calcados' || categoria === 'acessorios' || categoria === 'promocoes')

  return (
    <div>
      {/* Barra de Categorias Horizontal Superior (Fixa ao Rolar) */}
      <CategoryBar
        activeSlug={categoria}
        onSelect={(slug) => {
          const next = new URLSearchParams()
          if (slug) next.set('categoria', slug)
          if (sort !== 'recentes') next.set('ordenar', sort)
          setParams(next)
        }}
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
            <span className="absolute inset-y-0 left-3 flex items-center text-mute pointer-events-none">
              <IconSearch className="w-4 h-4 text-mute" />
            </span>
            <input
              type="search"
              value={q}
              onChange={(e) => update('q', e.target.value)}
              placeholder="Pesquisar por nome, marca ou detalhe..."
              className="min-h-11 w-full rounded border border-white/15 bg-ink-2 pl-9 pr-8 text-sm text-paper placeholder:text-mute focus:border-gold focus:outline-none transition"
            />
            {q && (
              <button
                type="button"
                onClick={() => update('q', '')}
                className="absolute inset-y-0 right-2 flex items-center px-1 text-mute hover:text-paper"
                title="Limpar busca"
              >
                <IconClose className="w-3.5 h-3.5" />
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

        {/* SUBCATEGORIAS ESPECÍFICAS DA CATEGORIA SELECIONADA */}
        {hasSubfilters && (
          <div className="mt-4 flex flex-wrap items-center gap-2 rounded border border-white/10 bg-ink-2/60 p-3">
            <span className="text-[10px] uppercase tracking-wider text-gold font-bold mr-1">Filtrar por:</span>

            {/* Sexo (Camisas, Calças, Bermudas) */}
            {(categoria === 'camisas' || categoria === 'calcas' || categoria === 'bermudas') && (
              <select
                value={sexo}
                onChange={(e) => update('sexo', e.target.value)}
                className="h-8 rounded border border-white/15 bg-ink px-2 text-xs text-paper focus:border-gold focus:outline-none"
              >
                <option value="">Todos os sexos</option>
                {availableGenders.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            )}

            {/* Marcas (se houver marcas cadastradas) */}
            {availableBrands.length > 0 && (
              <select
                value={marca}
                onChange={(e) => update('marca', e.target.value)}
                className="h-8 rounded border border-white/15 bg-ink px-2 text-xs text-paper focus:border-gold focus:outline-none"
              >
                <option value="">Todas as marcas</option>
                {availableBrands.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            )}

            {/* Tecido (se houver tecidos cadastrados) */}
            {categoria !== 'calcados' && categoria !== 'acessorios' && availableMaterials.length > 0 && (
              <select
                value={tecido}
                onChange={(e) => update('tecido', e.target.value)}
                className="h-8 rounded border border-white/15 bg-ink px-2 text-xs text-paper focus:border-gold focus:outline-none"
              >
                <option value="">Todos os tecidos</option>
                {availableMaterials.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            )}

            {/* Modelo / Tipo (Blusas, Calçados, Acessórios) */}
            {(categoria === 'blusas' || categoria === 'calcados' || categoria === 'acessorios') && availableModels.length > 0 && (
              <select
                value={modelo}
                onChange={(e) => update('modelo', e.target.value)}
                className="h-8 rounded border border-white/15 bg-ink px-2 text-xs text-paper focus:border-gold focus:outline-none"
              >
                <option value="">{categoria === 'acessorios' ? 'Todos os tipos' : 'Todos os modelos'}</option>
                {availableModels.map((mod) => (
                  <option key={mod} value={mod}>{mod}</option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* Tags de Filtros Ativos */}
        {(categoria || q || marca || tecido || sexo || modelo) && (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-mute text-[11px] uppercase tracking-wider">Filtros ativos:</span>
            {categoria && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-2.5 py-1 text-gold font-medium">
                {activeCategoryLabel}
                <button
                  type="button"
                  onClick={() => update('categoria', '')}
                  className="hover:opacity-75"
                  title="Remover categoria"
                >
                  <IconClose className="w-3 h-3" />
                </button>
              </span>
            )}
            {sexo && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-2.5 py-1 text-gold">
                Sexo: {sexo}
                <button type="button" onClick={() => update('sexo', '')} className="hover:opacity-75">
                  <IconClose className="w-3 h-3" />
                </button>
              </span>
            )}
            {marca && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-2.5 py-1 text-gold">
                Marca: {marca}
                <button type="button" onClick={() => update('marca', '')} className="hover:opacity-75">
                  <IconClose className="w-3 h-3" />
                </button>
              </span>
            )}
            {tecido && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-2.5 py-1 text-gold">
                Tecido: {tecido}
                <button type="button" onClick={() => update('tecido', '')} className="hover:opacity-75">
                  <IconClose className="w-3 h-3" />
                </button>
              </span>
            )}
            {modelo && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-2.5 py-1 text-gold">
                Modelo: {modelo}
                <button type="button" onClick={() => update('modelo', '')} className="hover:opacity-75">
                  <IconClose className="w-3 h-3" />
                </button>
              </span>
            )}
            {q && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/5 px-2.5 py-1 text-paper">
                &ldquo;{q}&rdquo;
                <button type="button" onClick={() => update('q', '')} className="hover:opacity-75">
                  <IconClose className="w-3 h-3" />
                </button>
              </span>
            )}
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs text-mute underline hover:text-gold transition ml-1 cursor-pointer"
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
              <IconHanger className="mx-auto w-10 h-10 text-gold/70 mb-2" />
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
