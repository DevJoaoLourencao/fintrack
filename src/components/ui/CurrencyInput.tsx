import { useEffect, useRef, useState } from 'react'
import { clsx } from 'clsx'

type Currency = 'BRL' | 'USD'

interface CurrencyInputProps {
  value: number
  onChange: (value: number) => void
  currency?: Currency
  id?: string
  className?: string
  hasError?: boolean
  placeholder?: string
  disabled?: boolean
}

const CURRENCY_CONFIG: Record<Currency, { locale: string; prefix: string; placeholder: string }> = {
  BRL: { locale: 'pt-BR', prefix: 'R$', placeholder: '0,00' },
  USD: { locale: 'en-US', prefix: '$',  placeholder: '0.00' },
}

function toRawDigits(n: number): string {
  if (!n || n <= 0) return ''
  return String(Math.round(n * 100))
}

function formatDisplay(digits: string, locale: string): string {
  if (!digits) return ''
  const cents = parseInt(digits, 10)
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100)
}

export function CurrencyInput({
  value,
  onChange,
  currency = 'BRL',
  id,
  className,
  hasError,
  placeholder,
  disabled,
}: CurrencyInputProps) {
  const [rawDigits, setRawDigits] = useState(() => toRawDigits(value))
  const prevValueRef = useRef(value)
  const prevCurrencyRef = useRef(currency)

  // Sync when the parent resets the value (e.g. form reset)
  useEffect(() => {
    if (value !== prevValueRef.current) {
      prevValueRef.current = value
      setRawDigits(toRawDigits(value))
    }
  }, [value])

  // Reset digits when currency changes to avoid confusing display
  useEffect(() => {
    if (currency !== prevCurrencyRef.current) {
      prevCurrencyRef.current = currency
      setRawDigits('')
      prevValueRef.current = 0
      onChange(0)
    }
  }, [currency, onChange])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, '')
    setRawDigits(digits)
    const floatValue = digits ? parseInt(digits, 10) / 100 : 0
    prevValueRef.current = floatValue
    onChange(floatValue)
  }

  const config = CURRENCY_CONFIG[currency]
  const displayPlaceholder = placeholder ?? config.placeholder

  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
        {config.prefix}
      </span>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        value={formatDisplay(rawDigits, config.locale)}
        onChange={handleChange}
        placeholder={displayPlaceholder}
        disabled={disabled}
        className={clsx(
          'w-full rounded-md border bg-background py-2 pl-9 pr-3 text-sm text-foreground',
          'placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-colors',
          hasError ? 'border-red-400 focus:ring-red-400/30' : 'border-border focus:ring-primary',
          disabled && 'cursor-not-allowed opacity-50',
          className
        )}
      />
    </div>
  )
}
