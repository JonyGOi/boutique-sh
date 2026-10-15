import { Link } from 'react-router-dom'
import { STORE } from '../config/store'

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="group inline-flex items-center gap-3 no-underline" aria-label={STORE.name}>
      <span className="flex h-11 w-11 items-center justify-center border border-gold text-gold">
        <span className="font-display text-lg tracking-[0.2em]">SH</span>
      </span>
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="font-display text-xl tracking-[0.28em] text-paper group-hover:text-gold transition">{STORE.name}</span>
          <span className="mt-1 text-[10px] uppercase tracking-[0.35em] text-mute">Alta Moda & Estilo</span>
        </span>
      )}
    </Link>
  )
}
