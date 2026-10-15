import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { trackSiteVisit } from '../lib/tracker'

export function SiteTracker() {
  const { pathname } = useLocation()

  useEffect(() => {
    // Não contabiliza navegação administrativa do lojista como visita de cliente
    if (pathname.startsWith('/admin')) return
    void trackSiteVisit(pathname)
  }, [pathname])

  return null
}
