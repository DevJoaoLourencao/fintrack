import { useState, useMemo } from 'react'
import { PlusIcon } from '@radix-ui/react-icons'
import { Button } from '@/components/ui/Button'
import { MonthSelector } from '@/components/features/MonthSelector'
import { TransactionDialog } from '@/components/features/transactions/TransactionDialog'
import { InvoiceSection } from '@/components/features/transactions/InvoiceSection'
import { InsightsPanel } from '@/components/features/transactions/InsightsPanel'
import { InstallmentRow } from '@/components/features/transactions/InstallmentRow'
import { useInstallmentsByMonth } from '@/hooks/useInstallments'
import { useFiltersStore } from '@/stores/filtersStore'
import { formatCurrency } from '@/lib/dateUtils'

export function TransactionsPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const { selectedMonth } = useFiltersStore()
  const { data: installments = [], isLoading } = useInstallmentsByMonth(selectedMonth)

  const cardItems = useMemo(
    () => installments.filter(
      (i) => (i.transaction.type === 'credit_card' || i.transaction.type === 'subscription') &&
        !!i.transaction.card_id
    ),
    [installments]
  )

  const standaloneItems = useMemo(
    () => installments
      .filter((i) => !cardItems.includes(i))
      .sort((a, b) => b.amount - a.amount),
    [installments, cardItems]
  )

  const standaloneTotal = standaloneItems.reduce((sum, i) => sum + i.amount, 0)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold text-foreground">Lançamentos</h2>
          <MonthSelector />
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-1">
          <PlusIcon className="h-4 w-4" /> Novo Lançamento
        </Button>
      </div>

      <InsightsPanel />

      <InvoiceSection month={selectedMonth} cardItems={cardItems} />

      <TransactionDialog open={dialogOpen} onOpenChange={setDialogOpen} />

      {isLoading && (
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-lg border border-border bg-card px-4 py-3 animate-pulse">
              <div className="h-4 w-48 bg-muted rounded mb-2" />
              <div className="h-3 w-32 bg-muted rounded" />
            </div>
          ))}
        </div>
      )}

      {!isLoading && standaloneItems.length === 0 && cardItems.length === 0 && (
        <div className="py-16 text-center text-sm text-muted-foreground">
          Nenhum lançamento encontrado para este período.
        </div>
      )}

      {!isLoading && standaloneItems.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Lançamentos Avulsos
          </p>
          <div className="space-y-2">
            {standaloneItems.map((item) => (
              <InstallmentRow key={item.id} item={item} />
            ))}
          </div>
          <div className="flex items-center justify-between px-1 pt-1">
            <span className="text-sm text-muted-foreground">Total</span>
            <span className="text-sm font-semibold tabular-nums text-foreground">
              {formatCurrency(standaloneTotal)}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
