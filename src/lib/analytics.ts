import { isSupabaseConfigured, supabase } from './supabase'
import { getDevVisitors } from './devStore'
import type { SiteVisitor, VisitorAnalyticsSummary } from '../types/analytics'

/**
 * Carrega a lista completa de visitantes e calcula todas as métricas e médias.
 */
export async function fetchVisitorAnalytics(): Promise<{
  summary: VisitorAnalyticsSummary
  visitors: SiteVisitor[]
}> {
  let visitors: SiteVisitor[] = []

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('site_visitors')
        .select('*')
        .order('last_visit_at', { ascending: false })

      if (!error && Array.isArray(data)) {
        visitors = data as SiteVisitor[]
      } else {
        visitors = getDevVisitors()
      }
    } catch {
      visitors = getDevVisitors()
    }
  } else {
    visitors = getDevVisitors()
  }

  // 1. Quantas pessoas entraram (Visitantes Únicos)
  const totalVisitors = visitors.length

  // 2. Quantas vezes entraram no total (Total Geral de Acessos)
  const totalVisits = visitors.reduce((sum, v) => sum + (v.visit_count || 1), 0)

  // 3. Média geral de visitas por cliente
  const averageVisitsPerVisitor =
    totalVisitors > 0 ? +(totalVisits / totalVisitors).toFixed(2) : 0

  // 4. Pessoas que entraram mais de uma vez (Clientes Recorrentes)
  const returningList = visitors.filter((v) => (v.visit_count || 1) > 1)
  const returningVisitors = returningList.length

  // 5. Taxa de retorno de clientes (%)
  const returningRate =
    totalVisitors > 0 ? +((returningVisitors / totalVisitors) * 100).toFixed(1) : 0

  // 6. Para quem entra mais de uma vez: quantas vezes entraram no total e média desse grupo
  const returningVisitsTotal = returningList.reduce(
    (sum, v) => sum + (v.visit_count || 1),
    0,
  )
  const averageReturningVisits =
    returningVisitors > 0 ? +(returningVisitsTotal / returningVisitors).toFixed(2) : 0

  // 7. Pessoas que entraram apenas 1 vez (Novos)
  const newVisitors = totalVisitors - returningVisitors

  // Dispositivos
  const deviceStats = {
    mobile: 0,
    desktop: 0,
    tablet: 0,
  }

  visitors.forEach((v) => {
    const dev = (v.device_type || '').toLowerCase()
    if (dev === 'celular' || dev === 'mobile') deviceStats.mobile += 1
    else if (dev === 'tablet') deviceStats.tablet += 1
    else deviceStats.desktop += 1
  })

  return {
    summary: {
      totalVisitors,
      totalVisits,
      averageVisitsPerVisitor,
      returningVisitors,
      returningRate,
      averageReturningVisits,
      newVisitors,
      deviceStats,
    },
    visitors,
  }
}
