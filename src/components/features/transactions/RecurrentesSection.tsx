import { useState } from 'react'
import { ChevronDownIcon, ChevronUpIcon } from '@radix-ui/react-icons'
import type { RichInstallment } from '@/domain'
import { InstallmentRow } from './InstallmentRow'
import { formatCurrency } from '@/lib/dateUtils'
import { useHideValuesStore } from '@/stores/hideValuesStore'

const HIDDEN_VALUE = '••••••'

interface RecurrentesSectionProps {
  items: RichInstallment[]
}

export function RecurrentesSection({ items }: RecurrentesSectionProps) {
  const { hideValues } = useHideValuesStore()
  const [collapsed, setCollapsed] = useState(true)

  if (items.length === 0) return null

  const total = items.reduce((sum, i) => sum + i.amount, 0)

  return (
    <div className="rounded-xl border border-border bg-card">
      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">Recorrentes / Débitos</span>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {items.length}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold tabular-nums text-foreground">
            {hideValues ? HIDDEN_VALUE : formatCurrency(total)}
          </span>
          {collapsed
            ? <ChevronDownIcon className="h-4 w-4 text-muted-foreground" />
            : <ChevronUpIcon className="h-4 w-4 text-muted-foreground" />
          }
        </div>
      </button>

      {!collapsed && (
        <div className="border-t border-border px-3 pb-3 pt-2 space-y-2">
          {items.map((item) => (
            <InstallmentRow key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}
