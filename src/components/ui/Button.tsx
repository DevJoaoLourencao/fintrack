import { clsx } from 'clsx'
import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'ghost' | 'destructive'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  loading?: boolean
}

const variants: Record<Variant, string> = {
  primary:
    'bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-md shadow-violet-500/20 hover:brightness-110 hover:shadow-lg hover:shadow-violet-500/30 active:scale-[0.97]',
  ghost:
    'bg-transparent text-foreground hover:bg-muted active:scale-[0.97]',
  destructive:
    'bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-md shadow-red-500/20 hover:brightness-110 hover:shadow-lg hover:shadow-red-500/30 active:scale-[0.97]',
}

export function Button({ variant = 'primary', loading, className, children, disabled, ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        className
      )}
      disabled={disabled ?? loading}
      {...props}
    >
      {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : null}
      {children}
    </button>
  )
}
