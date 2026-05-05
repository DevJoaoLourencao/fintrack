import * as Dialog from '@radix-ui/react-dialog'
import type { RichInstallment } from '@/domain'
import { Button } from '@/components/ui/Button'

interface DeleteInstallmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: RichInstallment
  onDeleteOne: () => void
  onDeleteAll: () => void
  onDeleteFromHere: () => void
  loadingOne?: boolean
  loadingAll?: boolean
  loadingFromHere?: boolean
}

export function DeleteInstallmentDialog({
  open,
  onOpenChange,
  item,
  onDeleteOne,
  onDeleteAll,
  onDeleteFromHere,
  loadingOne,
  loadingAll,
  loadingFromHere,
}: DeleteInstallmentDialogProps) {
  const isRecurring = item.transaction.type === 'recurring' || item.transaction.type === 'subscription'
  const isMulti = item.transaction.total_installments > 1
  const showChoices = isRecurring || isMulti
  const loading = loadingOne || loadingAll || loadingFromHere

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border/50 bg-card p-6 shadow-card-lg focus:outline-none">
          <Dialog.Title className="mb-1 text-base font-semibold text-foreground">
            Excluir lançamento
          </Dialog.Title>
          <p className="mb-4 truncate text-sm text-muted-foreground">
            {item.transaction.description}
          </p>

          {showChoices ? (
            <div className="space-y-3">
              {/* Só este mês — always shown when there are choices */}
              <button
                type="button"
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-left transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                onClick={onDeleteOne}
                disabled={loading}
              >
                <p className="text-sm font-medium text-foreground">Só este mês</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Remove apenas a ocorrência de {item.due_date.slice(0, 7).split('-').reverse().join('/')}
                </p>
              </button>

              {/* Este e próximos — for recurring/subscription */}
              {isRecurring && (
                <button
                  type="button"
                  className="w-full rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-left transition-colors hover:bg-orange-100 focus:outline-none focus:ring-2 focus:ring-orange-400 disabled:opacity-50 dark:border-orange-900/40 dark:bg-orange-950/20 dark:hover:bg-orange-950/30"
                  onClick={onDeleteFromHere}
                  disabled={loading}
                >
                  <p className="text-sm font-medium text-orange-700 dark:text-orange-400">Este e próximos</p>
                  <p className="mt-0.5 text-xs text-orange-600 dark:text-orange-500">
                    Remove a partir de {item.due_date.slice(0, 7).split('-').reverse().join('/')} em diante · histórico anterior preservado
                  </p>
                </button>
              )}

              {/* Parcelamento inteiro — only for non-recurring multi-installment */}
              {isMulti && !isRecurring && (
                <button
                  type="button"
                  className="w-full rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-left transition-colors hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-400 disabled:opacity-50 dark:border-red-900/40 dark:bg-red-950/20 dark:hover:bg-red-950/30"
                  onClick={onDeleteAll}
                  disabled={loading}
                >
                  <p className="text-sm font-medium text-red-600 dark:text-red-400">Parcelamento inteiro</p>
                  <p className="mt-0.5 text-xs text-red-500 dark:text-red-500">
                    Remove todas as {item.transaction.total_installments} parcelas
                  </p>
                </button>
              )}
            </div>
          ) : (
            <p className="mb-4 text-sm text-muted-foreground">
              Tem certeza que deseja excluir este lançamento?
            </p>
          )}

          <div className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            {!showChoices && (
              <Button variant="destructive" onClick={onDeleteAll} loading={loadingAll}>
                Excluir
              </Button>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
