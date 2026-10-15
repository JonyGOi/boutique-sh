import { Link } from 'react-router-dom'
import { ProductCard } from '../components/product/ProductCard'
import { ButtonLink } from '../components/ui/Button'
import { CategoryBar, STORE_CATEGORIES_WITH_ICONS } from '../components/layout/CategoryBar'
import { usePublishedProducts } from '../hooks/usePublishedProducts'
import { buildWhatsAppSupportUrl } from '../lib/whatsapp'
import { IconWhatsApp } from '../components/ui/Icons'

export function Home() {
  const { products, loading, error } = usePublishedProducts()
  const launches = products.filter((p) => p.is_launch).slice(0, 4)
  const featured = products.filter((p) => p.is_featured).slice(0, 4)

  return (
    <div>
      {/* Hero Section */}
      <section className="relative min-h-[72dvh] sm:min-h-[78dvh] overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1800&q=80"
          alt="Boutique SH Moda Feminina"
          className="absolute inset-0 h-full w-full object-cover"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/70 to-ink/30" />
        <div className="relative mx-auto flex min-h-[72dvh] sm:min-h-[78dvh] max-w-6xl flex-col justify-end px-4 pb-12 sm:pb-16 pt-24">
          <p className="text-xs uppercase tracking-[0.4em] text-gold">Boutique SH • Alta Moda</p>
          <h1 className="mt-3 max-w-xl font-display text-4xl sm:text-6xl md:text-7xl leading-tight text-paper">
            Elegância em cada detalhe.
          </h1>
          <p className="mt-4 max-w-md text-xs sm:text-sm leading-relaxed text-mute">
            Peças exclusivas selecionadas para o seu estilo. Escolha no catálogo e faça o pedido com um clique no WhatsApp.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <ButtonLink to="/colecao">Ver Coleção Completa</ButtonLink>
            <a
              href={buildWhatsAppSupportUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded border border-gold/50 bg-ink/70 px-5 text-xs uppercase tracking-[0.18em] text-gold hover:bg-gold hover:text-ink transition"
            >
              <IconWhatsApp className="w-4 h-4" />
              WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* Barra de Tipos de Roupas com Rolagem Horizontal (Super intuitiva para celular) */}
      <CategoryBar sticky />

      {/* Lançamentos */}
      <section className="mx-auto max-w-6xl px-4 py-10 md:py-16">
        <HeaderRow title="Lançamentos" to="/colecao?categoria=lancamentos" />
        <ProductSection loading={loading} error={error} products={launches} empty="Nenhum lançamento publicado no momento." />
      </section>

      {/* Destaques */}
      <section className="mx-auto max-w-6xl px-4 py-8 md:py-12">
        <HeaderRow title="Destaques da Coleção" to="/colecao" />
        <ProductSection loading={loading} error={error} products={featured} empty="Nenhum destaque publicado no momento." />
      </section>

      {/* Grade de Categorias Visual */}
      <section className="mx-auto max-w-6xl px-4 py-10 md:py-16">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-gold">Explore</p>
            <h2 className="mt-1 font-display text-3xl sm:text-4xl text-paper">Categorias</h2>
          </div>
          <Link to="/colecao" className="text-xs uppercase tracking-[0.2em] text-gold hover:underline">
            Todas
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4">
          {STORE_CATEGORIES_WITH_ICONS.filter((c) => c.slug !== '').map((cat) => {
            const Icon = cat.icon
            return (
              <Link
                key={cat.slug}
                to={`/colecao?categoria=${cat.slug}`}
                className="group flex flex-col items-center justify-center rounded border border-white/10 bg-ink-2 p-5 text-center transition hover:border-gold/50 hover:bg-ink active:scale-95"
              >
                <span className="text-gold transition group-hover:scale-110">
                  <Icon className="w-7 h-7 sm:w-8 sm:h-8" />
                </span>
                <span className="mt-2.5 text-xs uppercase tracking-[0.18em] text-paper group-hover:text-gold transition font-medium">
                  {cat.label}
                </span>
              </Link>
            )
          })}
        </div>
      </section>

      {/* Atendimento no WhatsApp */}
      <section className="mx-auto max-w-6xl px-4 pb-16 md:pb-24">
        <div className="rounded border border-gold/30 bg-ink-2 px-6 py-10 text-center sm:px-12 md:px-16 shadow-xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-gold/40 bg-gold/10 text-gold mb-3">
            <IconWhatsApp className="w-7 h-7" />
          </div>
          <p className="mt-2 text-xs uppercase tracking-[0.32em] text-gold">Atendimento Imediato</p>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl text-paper">Dúvidas ou Pedidos pelo WhatsApp</h2>
          <p className="mx-auto mt-3 max-w-md text-xs sm:text-sm leading-relaxed text-mute">
            Consulte tamanhos, cores disponíveis e faça pedidos personalizados diretamente com nossa equipe.
          </p>
          <a
            href={buildWhatsAppSupportUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded bg-gold px-7 text-xs uppercase tracking-[0.22em] text-ink font-semibold hover:bg-gold-light transition shadow-lg shadow-gold/20"
          >
            <IconWhatsApp className="w-4 h-4" />
            Falar no WhatsApp
          </a>
        </div>
      </section>
    </div>
  )
}

function HeaderRow({ title, to }: { title: string; to: string }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <h2 className="font-display text-2xl sm:text-3xl text-paper">{title}</h2>
      <Link to={to} className="text-xs uppercase tracking-[0.2em] text-gold hover:underline font-medium">
        Ver tudo →
      </Link>
    </div>
  )
}

function ProductSection({
  loading,
  error,
  products,
  empty,
}: {
  loading: boolean
  error: string | null
  products: ReturnType<typeof usePublishedProducts>['products']
  empty: string
}) {
  if (loading) return <p className="text-sm text-mute animate-pulse">Carregando peças…</p>
  if (error) return <p className="text-sm text-gold">{error}</p>
  if (products.length === 0) return <p className="text-sm text-mute">{empty}</p>
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-5">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
