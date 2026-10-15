import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { isDevLoggedIn, setDevLoggedIn, verifyDevPassword } from '../lib/devStore'

type AuthContextValue = {
  ready: boolean
  session: Session | null
  user: User | null
  isAdmin: boolean
  isDevMode: boolean
  configured: boolean
  signIn: (email: string, password: string) => Promise<string | null>
  signInDev: (password: string) => Promise<string | null>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

async function checkAdmin(userId: string): Promise<boolean> {
  if (!supabase) return false
  const { data, error } = await supabase
    .from('admin_users')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) return false
  return Boolean(data)
}

function cleanCredential(str: string): string {
  if (!str) return ''
  return str.replace(/[\u200B-\u200D\uFEFF\u00A0\u180E\u2000-\u200A\u202F\u205F\u3000\r\n\t]/g, '').trim()
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [session, setSession] = useState<Session | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isDevMode, setIsDevMode] = useState(false)

  useEffect(() => {
    const devAuthed = isDevLoggedIn()
    if (devAuthed) {
      setIsAdmin(true)
      setIsDevMode(true)
    }

    if (!supabase) {
      setReady(true)
      return
    }

    let active = true

    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return
      setSession(data.session)
      if (data.session?.user) {
        const admin = await checkAdmin(data.session.user.id)
        if (admin) setIsAdmin(true)
      }
      setReady(true)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
      if (next?.user) {
        void checkAdmin(next.user.id).then((adm) => {
          if (adm) setIsAdmin(true)
        })
      } else if (!isDevLoggedIn()) {
        setIsAdmin(false)
      }
    })

    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) return 'O banco de dados Supabase ainda não foi configurado.'
    const cleanEmail = cleanCredential(email)
    const cleanPass = cleanCredential(password)

    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: cleanPass,
    })
    if (error || !data.user) {
      if (error?.message === 'Invalid login credentials') {
        return 'E-mail ou senha incorretos. Verifique os dados digitados.'
      }
      return error?.message ?? 'E-mail ou senha inválidos no Supabase.'
    }
    const admin = await checkAdmin(data.user.id)
    if (!admin) {
      const { error: insErr } = await supabase.from('admin_users').insert({ user_id: data.user.id })
      if (insErr && !(await checkAdmin(data.user.id))) {
        await supabase.auth.signOut()
        return 'Esta conta não tem permissão administrativa no Supabase.'
      }
    }
    setIsAdmin(true)
    setIsDevMode(false)
    return null
  }, [])

  const signInDev = useCallback(async (password: string) => {
    if (verifyDevPassword(password)) {
      setDevLoggedIn(true)
      setIsAdmin(true)
      setIsDevMode(true)
      return null
    }
    return 'Senha incorreta. A senha padrão do Painel Dev é admin123'
  }, [])

  const signOut = useCallback(async () => {
    setDevLoggedIn(false)
    setIsDevMode(false)
    if (supabase) await supabase.auth.signOut()
    setIsAdmin(false)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      ready,
      session,
      user: session?.user ?? null,
      isAdmin,
      isDevMode,
      configured: isSupabaseConfigured || isDevMode || isDevLoggedIn(),
      signIn,
      signInDev,
      signOut,
    }),
    [ready, session, isAdmin, isDevMode, signIn, signInDev, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider.')
  return ctx
}
