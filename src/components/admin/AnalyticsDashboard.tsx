import { useState, useEffect, useMemo } from 'react'
import {
  IconUsers,
  IconChart,
  IconRefresh,
  IconStar,
  IconSparkles,
  IconDeviceMobile,
  IconDeviceDesktop,
} from '../ui/Icons'
import { fetchVisitorAnalytics } from '../../lib/analytics'
import type { SiteVisitor, VisitorAnalyticsSummary } from '../../types/analytics'

export function AnalyticsDashboard() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [summary, setSummary] = useState<VisitorAnalyticsSummary | null>(null)
  const [visitors, setVisitors] = useState<SiteVisitor[]>([])
  const [filterType, setFilterType] = useState<'all' | 'recurring' | 'single'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  async function loadData() {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchVisitorAnalytics()
      setSummary(data.summary)
      setVisitors(data.visitors)
    } catch {
      setError('Não foi possível carregar as estatísticas de visitantes.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  // Filtragem da lista de visitantes
  const filteredVisitors = useMemo(() => {
    return visitors.filter((v) => {
      const count = v.visit_count || 1
      if (filterType === 'recurring' && count <= 1) return false
      if (filterType === 'single' && count > 1) return false

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchId = v.visitor_id.toLowerCase().includes(q)
        const matchDevice = (v.device_type || '').toLowerCase().includes(q)
        const matchBrowser = (v.browser || '').toLowerCase().includes(q)
        const matchOs = (v.os || '').toLowerCase().includes(q)
        const matchPath = (v.last_path || '').toLowerCase().includes(q)
        return matchId || matchDevice || matchBrowser || matchOs || matchPath
      }

      return true
    })
  }, [visitors, filterType, searchQuery])

  function formatDateTime(isoString?: string): string {
    if (!isoString) return '-'
    try {
      const date = new Date(isoString)
      return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return isoString
    }
  }

  function getShortId(id: string): string {
    if (!id) return 'visitante'
    return '#' + id.replace(/^vis_/, '').slice(0, 6).toUpperCase()
  }

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl text-paper">
            Métricas de Clientes & Acessos
          </h2>
          <p className="mt-1 text-xs text-mute max-w-xl">
            Acompanhe quantas pessoas entraram na loja, o total geral de visitas e a média de retorno para clientes que entram mais de uma vez.
          </p>
        </div>
        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded border border-gold/40 bg-gold/10 px-4 py-2 text-xs font-semibold text-gold hover:bg-gold hover:text-ink transition disabled:opacity-50 cursor-pointer self-start sm:self-auto"
        >
          <IconRefresh className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Atualizando…' : 'Atualizar Métricas'}
        </button>
      </div>

      {error && (
        <div className="rounded border border-gold/40 bg-gold/10 p-4 text-xs text-gold">
          {error}
        </div>
      )}

      {/* Cards de Métricas Principais (KPIs) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {/* Card 1: Quantas Pessoas Entraram */}
        <div className="rounded border border-white/15 bg-ink p-4 flex flex-col justify-between shadow-sm hover:border-gold/50 transition">
          <div className="flex items-center justify-between text-mute">
            <span className="text-[11px] uppercase tracking-wider font-semibold">Pessoas que Entraram</span>
            <IconUsers className="w-4 h-4 text-gold" />
          </div>
          <div className="mt-3">
            <span className="font-display text-3xl sm:text-4xl text-paper">
              {summary ? summary.totalVisitors : '…'}
            </span>
            <p className="mt-1 text-[11px] text-mute">
              Visitantes únicos identificados
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-white/10 text-[10px] text-gold font-medium">
            {summary ? `${summary.newVisitors} novos • ${summary.returningVisitors} voltaram` : ''}
          </div>
        </div>

        {/* Card 2: Quantas Vezes Entraram no Total */}
        <div className="rounded border border-white/15 bg-ink p-4 flex flex-col justify-between shadow-sm hover:border-gold/50 transition">
          <div className="flex items-center justify-between text-mute">
            <span className="text-[11px] uppercase tracking-wider font-semibold">Total de Visitas</span>
            <IconChart className="w-4 h-4 text-gold" />
          </div>
          <div className="mt-3">
            <span className="font-display text-3xl sm:text-4xl text-gold">
              {summary ? summary.totalVisits : '…'}
            </span>
            <p className="mt-1 text-[11px] text-mute">
              Total de entradas na boutique
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-white/10 text-[10px] text-paper/80 font-medium">
            Soma de todas as sessões
          </div>
        </div>

        {/* Card 3: Média Geral de Visitas */}
        <div className="rounded border border-white/15 bg-ink p-4 flex flex-col justify-between shadow-sm hover:border-gold/50 transition">
          <div className="flex items-center justify-between text-mute">
            <span className="text-[11px] uppercase tracking-wider font-semibold">Média por Cliente</span>
            <IconSparkles className="w-4 h-4 text-gold" />
          </div>
          <div className="mt-3">
            <span className="font-display text-3xl sm:text-4xl text-paper">
              {summary ? summary.averageVisitsPerVisitor : '…'}
            </span>
            <p className="mt-1 text-[11px] text-mute">
              Visitas em média por visitante
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-white/10 text-[10px] text-gold font-medium">
            Total visitas ÷ Total visitantes
          </div>
        </div>

        {/* Card 4: Clientes que Entraram Mais de Uma Vez (Recorrentes) */}
        <div className="rounded border border-gold/40 bg-gold/5 p-4 flex flex-col justify-between shadow-sm hover:border-gold transition">
          <div className="flex items-center justify-between text-gold">
            <span className="text-[11px] uppercase tracking-wider font-semibold">Entraram 2+ Vezes</span>
            <span className="rounded bg-gold/20 px-1.5 py-0.5 text-[10px] font-bold text-gold">
              {summary ? `${summary.returningRate}%` : '…'}
            </span>
          </div>
          <div className="mt-3">
            <span className="font-display text-3xl sm:text-4xl text-gold">
              {summary ? summary.returningVisitors : '…'}
            </span>
            <p className="mt-1 text-[11px] text-paper/80">
              Clientes que retornaram à loja
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-gold/20 text-[10px] text-gold font-medium">
            {summary ? `${summary.returningRate}% de taxa de fidelidade` : ''}
          </div>
        </div>

        {/* Card 5: Média dos Clientes Recorrentes (DESTAQUE) */}
        <div className="rounded border border-gold bg-ink-2 p-4 flex flex-col justify-between shadow-lg shadow-gold/10">
          <div className="flex items-center justify-between text-gold">
            <span className="text-[11px] uppercase tracking-wider font-bold">Média dos Recorrentes</span>
            <IconStar className="w-4 h-4 text-gold" />
          </div>
          <div className="mt-3">
            <span className="font-display text-3xl sm:text-4xl text-gold">
              {summary ? summary.averageReturningVisits : '…'}
            </span>
            <p className="mt-1 text-[11px] text-paper">
              Visitas em média por cliente fiel
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-white/10 text-[10px] text-gold font-bold">
            Para quem entra mais de 1 vez
          </div>
        </div>
      </div>

      {/* Painel Comparativo: Fidelidade & Dispositivos */}
      {summary && summary.totalVisitors > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {/* Proporção de Fidelidade */}
          <div className="rounded border border-white/10 bg-ink p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="uppercase tracking-wider font-semibold text-paper">Perfil dos Clientes</span>
              <span className="text-gold font-mono">{summary.totalVisitors} pessoas</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-ink-2 border border-white/10 flex">
              <div
                className="bg-gold h-full transition-all duration-500"
                style={{ width: `${summary.returningRate}%` }}
                title={`Recorrentes: ${summary.returningVisitors} (${summary.returningRate}%)`}
              />
              <div
                className="bg-white/20 h-full transition-all duration-500"
                style={{ width: `${100 - summary.returningRate}%` }}
                title={`Primeira visita: ${summary.newVisitors} (${(100 - summary.returningRate).toFixed(1)}%)`}
              />
            </div>
            <div className="flex items-center justify-between text-xs pt-1 text-mute">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-gold" />
                <strong className="text-gold">{summary.returningVisitors}</strong> Clientes Recorrentes ({summary.returningRate}%)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-white/30" />
                <strong className="text-paper">{summary.newVisitors}</strong> 1º Acesso ({(100 - summary.returningRate).toFixed(1)}%)
              </span>
            </div>
          </div>

          {/* Dispositivos de Acesso */}
          <div className="rounded border border-white/10 bg-ink p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="uppercase tracking-wider font-semibold text-paper">Aparelhos dos Clientes</span>
              <span className="text-gold font-mono">Dispositivos</span>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-1">
              <div className="flex flex-col items-center justify-center p-2 rounded bg-ink-2 border border-white/5">
                <IconDeviceMobile className="w-5 h-5 text-gold mb-1" />
                <span className="font-display text-lg text-paper">{summary.deviceStats.mobile}</span>
                <span className="text-[10px] text-mute uppercase tracking-wider">Celulares</span>
              </div>
              <div className="flex flex-col items-center justify-center p-2 rounded bg-ink-2 border border-white/5">
                <IconDeviceDesktop className="w-5 h-5 text-gold mb-1" />
                <span className="font-display text-lg text-paper">{summary.deviceStats.desktop}</span>
                <span className="text-[10px] text-mute uppercase tracking-wider">Computadores</span>
              </div>
              <div className="flex flex-col items-center justify-center p-2 rounded bg-ink-2 border border-white/5">
                <span className="font-display text-lg text-paper mt-1">{summary.deviceStats.tablet}</span>
                <span className="text-[10px] text-mute uppercase tracking-wider">Tablets</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabela de Visitantes & Histórico de Visitas */}
      <div className="rounded border border-white/15 bg-ink p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-paper">
              Lista Individual de Clientes & Frequência
            </h3>
            <p className="text-xs text-mute">
              Veja cada cliente, quantas vezes entrou, primeiro e último acesso e dispositivo utilizado.
            </p>
          </div>

          {/* Filtros por tipo de cliente */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`rounded px-3 py-1 font-medium transition cursor-pointer ${
                filterType === 'all'
                  ? 'bg-gold text-ink font-semibold'
                  : 'border border-white/15 text-paper hover:border-gold/50'
              }`}
            >
              Todos ({visitors.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('recurring')}
              className={`rounded px-3 py-1 font-medium transition cursor-pointer ${
                filterType === 'recurring'
                  ? 'bg-gold text-ink font-semibold'
                  : 'border border-white/15 text-paper hover:border-gold/50'
              }`}
            >
              Recorrentes &gt;1 ({summary?.returningVisitors ?? 0})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('single')}
              className={`rounded px-3 py-1 font-medium transition cursor-pointer ${
                filterType === 'single'
                  ? 'bg-gold text-ink font-semibold'
                  : 'border border-white/15 text-paper hover:border-gold/50'
              }`}
            >
              1 Visita ({summary?.newVisitors ?? 0})
            </button>
          </div>
        </div>

        {/* Barra de Pesquisa */}
        <div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por ID, dispositivo (ex: Celular, iPhone, Chrome) ou página..."
            className="min-h-10 w-full rounded border border-white/15 bg-ink-2 px-3 text-xs text-paper focus:border-gold focus:outline-none"
          />
        </div>

        {/* Tabela de Dados */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-mute uppercase tracking-wider text-[10px]">
                <th className="py-3 px-3">Cliente / ID</th>
                <th className="py-3 px-3 text-center">Quantas Vezes Entrou</th>
                <th className="py-3 px-3">Status de Retorno</th>
                <th className="py-3 px-3">Dispositivo & Sistema</th>
                <th className="py-3 px-3">Primeiro Acesso</th>
                <th className="py-3 px-3">Último Acesso</th>
                <th className="py-3 px-3">Última Página</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredVisitors.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-mute">
                    {loading ? 'Carregando dados de clientes…' : 'Nenhum visitante encontrado.'}
                  </td>
                </tr>
              ) : (
                filteredVisitors.map((v) => {
                  const count = v.visit_count || 1
                  const isRecurring = count > 1
                  const isLoyal = count >= 4

                  return (
                    <tr key={v.visitor_id} className="hover:bg-white/5 transition">
                      {/* ID do Visitante */}
                      <td className="py-3 px-3 font-mono text-paper font-semibold">
                        <span className="rounded bg-ink-2 border border-white/15 px-2 py-1 text-gold">
                          {getShortId(v.visitor_id)}
                        </span>
                      </td>

                      {/* Quantas Vezes Entrou */}
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-flex items-center justify-center min-w-8 px-2 py-0.5 rounded-full font-bold font-mono text-xs ${
                            isLoyal
                              ? 'bg-gold text-ink font-extrabold shadow-sm shadow-gold/20'
                              : isRecurring
                                ? 'bg-gold/20 text-gold border border-gold/40'
                                : 'bg-white/10 text-paper'
                          }`}
                        >
                          {count} {count === 1 ? 'vez' : 'vezes'}
                        </span>
                      </td>

                      {/* Status de Retorno */}
                      <td className="py-3 px-3">
                        {isLoyal ? (
                          <span className="inline-flex items-center gap-1 rounded bg-gold/20 border border-gold px-2 py-0.5 text-[10px] font-bold text-gold uppercase tracking-wider">
                            <IconStar className="w-2.5 h-2.5" />
                            Cliente VIP Fiel
                          </span>
                        ) : isRecurring ? (
                          <span className="inline-flex items-center gap-1 rounded bg-gold/10 border border-gold/40 px-2 py-0.5 text-[10px] font-semibold text-gold uppercase tracking-wider">
                            Recorrente
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] font-medium text-mute uppercase tracking-wider">
                            Primeiro Acesso
                          </span>
                        )}
                      </td>

                      {/* Dispositivo & Sistema */}
                      <td className="py-3 px-3 text-mute">
                        <div className="flex flex-col">
                          <span className="text-paper font-medium">
                            {v.device_type || 'Aparelho'} • {v.browser || 'Web'}
                          </span>
                          <span className="text-[10px] text-mute">{v.os || 'Sistema'}</span>
                        </div>
                      </td>

                      {/* Primeiro Acesso */}
                      <td className="py-3 px-3 text-mute font-mono text-[11px]">
                        {formatDateTime(v.first_visit_at)}
                      </td>

                      {/* Último Acesso */}
                      <td className="py-3 px-3 text-paper font-mono text-[11px] font-medium">
                        {formatDateTime(v.last_visit_at)}
                      </td>

                      {/* Última Página */}
                      <td className="py-3 px-3 text-mute font-mono text-[11px] max-w-[150px] truncate" title={v.last_path ?? ''}>
                        {v.last_path || '/'}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
