import { type FormEvent, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { Logo } from '../../components/Logo'
import { useAuth } from '../../context/AuthContext'
import { isSupabaseConfigured } from '../../lib/supabase'

function stripInvisible(str: string): string {
  return str.replace(/[\u200B-\u200D\uFEFF\u00A0\u180E\u2000-\u200A\u202F\u205F\u3000\r\n\t]/g, '').trim()
}

export function AdminLogin() {
  const { signIn, isAdmin, ready } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  if (ready && isAdmin) return <Navigate to="/admin" replace />

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    const cleanEmail = stripInvisible(email)
    const cleanPassword = stripInvisible(password)

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Por favor, informe um e-mail válido.')
      return
    }

    if (!cleanPassword) {
      setError('Por favor, digite sua senha.')
      return
    }

    setPending(true)
    const err = await signIn(cleanEmail, cleanPassword)
    setPending(false)

    if (err) {
      setError(err)
    } else {
      navigate('/admin', { replace: true })
    }
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-ink px-4 py-12">
      <Logo />

      <div className="mt-8 w-full max-w-md border border-gold/30 bg-ink-2 p-6 md:p-8 shadow-2xl">
        <h1 className="font-display text-3xl text-paper">Login Administrativo</h1>
        <p className="mt-1 text-xs text-mute">Conecte-se com sua conta do Supabase para gerenciar a loja.</p>

        {!isSupabaseConfigured && (
          <div className="mt-4 rounded border border-gold/40 bg-gold/10 p-3 text-xs text-gold">
            Atenção: Supabase não detectado nas variáveis de ambiente.
          </div>
        )}

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="block text-xs uppercase tracking-[0.2em] text-mute">
            E-mail
            <input
              className="mt-2 min-h-11 w-full border border-white/15 bg-ink px-3 text-sm text-paper focus:border-gold focus:outline-none"
              type="email"
              autoComplete="username"
              placeholder="exemplo@shboutique.com"
              value={email}
              onChange={(e) => setEmail(stripInvisible(e.target.value))}
              required
            />
          </label>

          <div>
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-mute">
              <span>Senha</span>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[11px] normal-case tracking-normal text-gold hover:underline"
              >
                {showPassword ? 'Ocultar' : 'Mostrar senha'}
              </button>
            </div>
            <input
              className="mt-2 min-h-11 w-full border border-white/15 bg-ink px-3 text-sm text-paper focus:border-gold focus:outline-none"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Sua senha do Supabase"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="text-xs text-gold">{error}</p>}

          <Button type="submit" disabled={pending} className="w-full mt-2">
            {pending ? 'Conectando ao Supabase…' : 'Entrar com Supabase'}
          </Button>
        </form>
      </div>
    </div>
  )
}
