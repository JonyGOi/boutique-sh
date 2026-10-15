import { isSupabaseConfigured, supabase } from './supabase'
import { recordDevVisit } from './devStore'

const VISITOR_ID_KEY = 'sh_boutique_visitor_id'
const SESSION_ACTIVE_KEY = 'sh_boutique_session_active'

/**
 * Obtém ou gera um ID único e persistente para este navegador/cliente.
 */
export function getOrCreateVisitorId(): string {
  if (typeof window === 'undefined') return 'server'
  try {
    let id = localStorage.getItem(VISITOR_ID_KEY)
    if (!id) {
      id = 'vis_' + crypto.randomUUID().replace(/-/g, '').slice(0, 16)
      localStorage.setItem(VISITOR_ID_KEY, id)
    }
    return id
  } catch {
    return 'anon_' + Math.random().toString(36).substring(2, 10)
  }
}

/**
 * Detecta dispositivo, navegador e sistema operacional do cliente.
 */
export function detectClientEnvironment(): {
  deviceType: 'Celular' | 'Tablet' | 'Computador'
  browser: string
  os: string
} {
  if (typeof window === 'undefined') {
    return { deviceType: 'Computador', browser: 'Desconhecido', os: 'Desconhecido' }
  }

  const ua = navigator.userAgent || ''
  const width = window.innerWidth || 1024

  // Dispositivo
  let deviceType: 'Celular' | 'Tablet' | 'Computador' = 'Computador'
  if (/iPad|Tablet|(android(?!.*mobile))/i.test(ua) || (width >= 600 && width <= 1024 && 'ontouchstart' in window)) {
    deviceType = 'Tablet'
  } else if (/Mobi|Android|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua) || width < 768) {
    deviceType = 'Celular'
  }

  // Sistema Operacional
  let os = 'Outro'
  if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS'
  else if (/Android/i.test(ua)) os = 'Android'
  else if (/Windows/i.test(ua)) os = 'Windows'
  else if (/Macintosh|Mac OS X/i.test(ua)) os = 'macOS'
  else if (/Linux/i.test(ua)) os = 'Linux'

  // Navegador
  let browser = 'Navegador Web'
  if (/Edg\//i.test(ua)) browser = 'Edge'
  else if (/Chrome\//i.test(ua) && !/Edg/i.test(ua)) browser = 'Chrome'
  else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari'
  else if (/Firefox\//i.test(ua)) browser = 'Firefox'
  else if (/OPR|Opera/i.test(ua)) browser = 'Opera'
  else if (/SamsungBrowser/i.test(ua)) browser = 'Samsung Internet'

  return { deviceType, browser, os }
}

/**
 * Registra a visita do cliente no Supabase e em fallback local.
 * Identifica se é uma nova sessão (nova entrada no site) ou continuação de navegação.
 */
export async function trackSiteVisit(currentPath: string): Promise<void> {
  if (typeof window === 'undefined') return

  try {
    const visitorId = getOrCreateVisitorId()
    const { deviceType, browser, os } = detectClientEnvironment()

    // Verifica se já existe uma sessão aberta nesta aba/janela
    const hasActiveSession = Boolean(sessionStorage.getItem(SESSION_ACTIVE_KEY))
    const isNewSession = !hasActiveSession

    if (isNewSession) {
      sessionStorage.setItem(SESSION_ACTIVE_KEY, Date.now().toString())
    }

    // Gravação no Supabase via RPC seguro
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.rpc('record_visit', {
          p_visitor_id: visitorId,
          p_device_type: deviceType,
          p_browser: browser,
          p_os: os,
          p_path: currentPath,
          p_is_new_session: isNewSession,
        })
      } catch (err: unknown) {
        console.warn('Registro de visita no Supabase em segundo plano:', err)
      }
    }

    // Gravação no armazenamento local (fallback / dev)
    recordDevVisit(visitorId, deviceType, browser, os, currentPath, isNewSession)
  } catch (err) {
    console.warn('Erro silencioso ao registrar visita:', err)
  }
}
