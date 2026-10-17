'use client'

import type { ButtonHTMLAttributes, InputHTMLAttributes, TextareaHTMLAttributes } from 'react'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'soft' | 'ghost' | 'outline' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  full?: boolean
}

const VARIANTS = {
  primary: 'bg-rose-500 text-white hover:bg-rose-600 shadow-sm shadow-rose-500/20',
  soft: 'bg-rose-100 text-rose-700 hover:bg-rose-300/40',
  ghost: 'text-muted hover:bg-sand',
  outline: 'border border-line bg-white hover:bg-sand',
  danger: 'bg-rose-700 text-white hover:bg-rose-600',
}

const SIZES = { sm: 'px-3 py-1.5 text-sm', md: 'px-4 py-2.5', lg: 'px-6 py-3.5 text-[15px]' }

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  full,
  className = '',
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-medium transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 ${VARIANTS[variant]} ${SIZES[size]} ${full ? 'w-full' : ''} ${className}`}
    >
      {loading && <Spinner />}
      {children}
    </button>
  )
}

export function Spinner({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent ${className}`}
      aria-hidden
    />
  )
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-xs leading-snug text-muted">{hint}</span>}
    </label>
  )
}

const INPUT_CLASS =
  'w-full rounded-xl border border-line bg-white px-4 py-3 outline-none transition placeholder:text-muted/60 focus:border-rose-300 focus:ring-4 focus:ring-rose-100'

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${INPUT_CLASS} ${props.className ?? ''}`} />
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${INPUT_CLASS} resize-none ${props.className ?? ''}`} />
}

export function Chip({
  active,
  onClick,
  children,
  color,
}: {
  active?: boolean
  onClick?: () => void
  children: React.ReactNode
  color?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full border px-3.5 py-2 text-sm font-medium whitespace-nowrap transition active:scale-[0.97] ${
        active
          ? 'border-transparent text-white shadow-sm'
          : 'border-line bg-white text-ink hover:bg-sand'
      }`}
      style={active ? { background: color ?? 'var(--color-rose-500)' } : undefined}
    >
      {children}
    </button>
  )
}

export function Stars({ value, size = 13 }: { value: number; size?: number }) {
  const rounded = Math.round(value * 2) / 2
  return (
    <span className="inline-flex items-center gap-0.5 align-middle" style={{ fontSize: size }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={rounded >= i - 0.25 ? 'text-amber-500' : 'text-line'}>
          ★
        </span>
      ))}
    </span>
  )
}

export function Empty({
  emoji,
  title,
  text,
  action,
}: {
  emoji: string
  title: string
  text?: string
  action?: React.ReactNode
}) {
  return (
    <div className="grid place-items-center px-6 py-16 text-center">
      <div className="text-4xl">{emoji}</div>
      <h3 className="mt-4 font-semibold">{title}</h3>
      {text && <p className="mt-1.5 max-w-xs text-sm leading-relaxed text-muted">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
