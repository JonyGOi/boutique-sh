export interface SiteVisitor {
  visitor_id: string
  first_visit_at: string
  last_visit_at: string
  visit_count: number
  device_type: string | null
  browser: string | null
  os: string | null
  last_path: string | null
  created_at: string
}

export interface VisitorAnalyticsSummary {
  // 1. Quantas pessoas entraram (Visitantes Únicos)
  totalVisitors: number
  // 2. Quantas vezes entraram no total (Total Geral de Acessos)
  totalVisits: number
  // 3. Média geral de visitas por cliente
  averageVisitsPerVisitor: number
  // 4. Pessoas que entraram mais de uma vez (Clientes Recorrentes)
  returningVisitors: number
  // 5. Taxa de retorno de clientes (%)
  returningRate: number
  // 6. Para quem entra mais de uma vez: média de visitas desse grupo
  averageReturningVisits: number
  // 7. Pessoas que entraram apenas 1 vez (Novos)
  newVisitors: number
  // Distribuição de dispositivos
  deviceStats: {
    mobile: number
    desktop: number
    tablet: number
  }
}
