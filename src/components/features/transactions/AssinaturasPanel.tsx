import { useState } from 'react'
import { clsx } from 'clsx'
import { ChevronDownIcon, ChevronUpIcon } from '@radix-ui/react-icons'
import type { RichInstallment } from '@/domain'
import { formatCurrency } from '@/lib/dateUtils'
import { useHideValuesStore } from '@/stores/hideValuesStore'

const HIDDEN_VALUE = '••••••'

interface AssinaturasPanelProps {
  items: RichInstallment[]
}

export function AssinaturasPanel({ items }: AssinaturasPanelProps) {
  const { hideValues } = useHideValuesStore()
  const [collapsed, setCollapsed] = useState(true)

  if (items.length === 0) return null

  const monthlyTotal = items.reduce((sum, i) => sum + i.amount, 0)
  const annualTotal = monthlyTotal * 12
  const fmt = (v: number) => hideValues ? HIDDEN_VALUE : formatCurrency(v)

  return (
    <div className="rounded-xl border border-border bg-card">
      {/* Header */}
      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">Assinaturas Ativas</span>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {items.length}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold tabular-nums text-foreground">
            {fmt(monthlyTotal)}<span className="ml-1 text-xs font-normal text-muted-foreground">/mês</span>
          </span>
          {collapsed
            ? <ChevronUpIcon className="h-4 w-4 text-muted-foreground" />
            : <ChevronDownIcon className="h-4 w-4 text-muted-foreground" />
          }
        </div>
      </button>

      {/* Body */}
      {!collapsed && (
        <div className="border-t border-border">
          {/* Subscription rows */}
          <div className="space-y-2 px-3 py-3">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2.5">
                {/* Name + card */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {item.transaction.description}
                  </p>
                  <div className="mt-0.5 flex items-center gap-2">
                    <span
                      className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[11px] font-medium text-white"
                      style={{ backgroundColor: item.category.color }}
                    >
                      {item.category.name}
                    </span>
                    {item.card && (
                      <span className="text-xs text-muted-foreground">
                        {item.card.name} ···· {item.card.last_four}
                      </span>
                    )}
                  </div>
                </div>

                {/* Amount */}
                <div className="flex-shrink-0 text-right">
                  <p className="text-sm font-semibold tabular-nums text-foreground">
                    {fmt(item.amount)}
                  </p>
                  <p className="text-[11px] text-muted-foreground tabular-nums">
                    {fmt(item.amount * 12)}/ano
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Footer totals */}
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">Total mensal</p>
              <p className="text-sm font-semibold tabular-nums text-foreground">{fmt(monthlyTotal)}</p>
            </div>
            <div className="text-right space-y-0.5">
              <p className="text-xs text-muted-foreground">Projeção anual</p>
              <p className="text-sm font-semibold tabular-nums text-foreground">{fmt(annualTotal)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
