import { Link } from 'react-router-dom'
import { STORE } from '../config/store'

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="group inline-flex items-center gap-2 sm:gap-3 no-underline" aria-label={STORE.name}>
      <span className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center border border-gold text-gold">
        <span className="font-display text-base sm:text-lg tracking-[0.2em]">SH</span>
      </span>
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="font-display text-base sm:text-xl tracking-[0.22em] sm:tracking-[0.28em] text-paper group-hover:text-gold transition whitespace-nowrap">
            {STORE.name}
          </span>
          <span className="mt-1 text-[9px] sm:text-[10px] uppercase tracking-[0.28em] sm:tracking-[0.35em] text-mute whitespace-nowrap">
            Alta Moda & Estilo
          </span>
        </span>
      )}
    </Link>
  )
}
