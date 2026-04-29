import { clsx } from 'clsx'
import { useUpcomingInstallments } from '@/hooks/useInstallments'
import { formatDate, formatCurrency } from '@/lib/dateUtils'

export function UpcomingBills() {
  const today = new Date().toISOString().slice(0, 10)
  const { data: items = [], isLoading } = useUpcomingInstallments(5)

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-sm font-medium text-foreground mb-3">Próximas contas</p>

      {isLoading && (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex justify-between animate-pulse">
              <div className="h-4 w-40 bg-muted rounded" />
              <div className="h-4 w-20 bg-muted rounded" />
            </div>
          ))}
        </div>
      )}

      {!isLoading && items.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          Nenhum lançamento pendente.
        </p>
      )}

      {!isLoading && items.length > 0 && (
        <ul className="space-y-2">
          {items.map((item) => {
            const isOverdue = item.due_date < today
            return (
              <li key={item.id} className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={clsx(
                      'text-xs font-medium flex-shrink-0',
                      isOverdue ? 'text-red-500' : 'text-muted-foreground'
                    )}
                  >
                    {formatDate(item.due_date)}
                  </span>
                  <p className="text-sm text-foreground truncate">{item.transaction.description}</p>
                </div>
                <span className="text-sm font-semibold text-foreground flex-shrink-0 ml-3">
                  {formatCurrency(item.amount)}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
