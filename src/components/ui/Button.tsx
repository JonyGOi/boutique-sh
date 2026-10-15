import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'

const variants = {
  gold: 'bg-gold text-ink hover:bg-gold-light',
  outline: 'border border-gold text-gold hover:bg-gold hover:text-ink',
  ghost: 'text-paper hover:text-gold',
  dark: 'bg-ink-2 text-paper hover:text-gold',
} as const

type Variant = keyof typeof variants

const classNameFor = (variant: Variant) =>
  `inline-flex min-h-11 min-w-11 items-center justify-center gap-2 px-5 py-3 text-center text-xs font-medium uppercase tracking-[0.22em] transition ${variants[variant]} disabled:cursor-not-allowed disabled:opacity-50`

export function Button({
  variant = 'gold',
  className = '',
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; children: ReactNode }) {
  return (
    <button className={`${classNameFor(variant)} ${className}`} {...props}>
      {children}
    </button>
  )
}

export function ButtonLink({
  to,
  variant = 'gold',
  className = '',
  children,
}: {
  to: string
  variant?: Variant
  className?: string
  children: ReactNode
}) {
  return (
    <Link to={to} className={`${classNameFor(variant)} ${className}`}>
      {children}
    </Link>
  )
}
