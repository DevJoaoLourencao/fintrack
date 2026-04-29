import { useEffect, useState } from 'react'
import { clsx } from 'clsx'
import * as Dialog from '@radix-ui/react-dialog'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import * as Select from '@radix-ui/react-select'
import { CheckIcon, ChevronDownIcon, DotsHorizontalIcon, Pencil1Icon, TrashIcon } from '@radix-ui/react-icons'
import { useQueryClient } from '@tanstack/react-query'
import type { RichInstallment } from '@/domain'
import { useTogglePaid } from '@/hooks/useInstallments'
import { useDeleteTransaction } from '@/hooks/useTransactions'
import { useCategoriesQuery } from '@/hooks/useCategories'
import { useAuthStore } from '@/stores/authStore'
import { useFiltersStore } from '@/stores/filtersStore'
import { useToast } from '@/components/ui/Toast'
import { transactionService } from '@/services/transactions'
import { installmentService } from '@/services/installments'
import { queryKeys } from '@/hooks/queryKeys'
import { ConfirmDialog } from '../ConfirmDialog'
import { Button } from '@/components/ui/Button'
import { CurrencyInput } from '@/components/ui/CurrencyInput'
import { formatCurrency } from '@/lib/dateUtils'

const TYPE_LABELS: Record<string, string> = {
  credit_card: 'Crédito',
  recurring: 'Recorrente',
  subscription: 'Assinatura',
}

const SELECT_ITEM_CLASS =
  'flex cursor-pointer items-center gap-2 rounded px-3 py-2 text-sm hover:bg-muted focus:bg-muted focus:outline-none'

// ── Edit dialog ───────────────────────────────────────────────────────────────

interface EditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: RichInstallment
}

function EditDialog({ open, onOpenChange, item }: EditDialogProps) {
  const { data: categories = [] } = useCategoriesQuery()
  const queryClient = useQueryClient()
  const userId = useAuthStore((s) => s.user!.id)
  const { selectedMonth } = useFiltersStore()
  const { toast } = useToast()

  const [description, setDescription] = useState(item.transaction.description)
  const [categoryId, setCategoryId] = useState(item.transaction.category_id)
  const [amount, setAmount] = useState(item.amount)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setDescription(item.transaction.description)
      setCategoryId(item.transaction.category_id)
      setAmount(item.amount)
    }
  }, [open, item])

  const amountValid = amount > 0

  async function handleSave() {
    if (!description.trim() || !amountValid) return
    setSaving(true)
    try {
      await Promise.all([
        transactionService.update(item.transaction_id, { description, category_id: categoryId }),
        amount !== item.amount ? installmentService.updateAmount(item.id, amount) : Promise.resolve(),
      ])
      queryClient.invalidateQueries({ queryKey: queryKeys.installmentsByMonth(userId, selectedMonth) })
      queryClient.invalidateQueries({ queryKey: queryKeys.installmentsUpcoming(userId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.installmentsTrend(userId) })
      toast({ title: 'Lançamento atualizado.' })
      onOpenChange(false)
    } catch (err) {
      toast({ title: 'Erro ao atualizar', description: (err as Error).message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card p-6 shadow-xl focus:outline-none">
          <Dialog.Title className="mb-4 text-base font-semibold text-foreground">
            Editar Lançamento
          </Dialog.Title>

          <div className="space-y-4">
            <div>
              <label htmlFor="edit-desc" className="text-sm text-muted-foreground">Descrição</label>
              <input
                id="edit-desc"
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="edit-amount" className="text-sm text-muted-foreground">
                Valor{item.transaction.total_installments > 1 && (
                  <span className="ml-1 text-xs text-muted-foreground">— parcela {item.number}/{item.transaction.total_installments}</span>
                )}
              </label>
              <CurrencyInput
                id="edit-amount"
                value={amount}
                onChange={setAmount}
                className="mt-1"
              />
            </div>

            <div>
              <span className="text-sm text-muted-foreground">Categoria</span>
              <Select.Root value={categoryId} onValueChange={setCategoryId}>
                <Select.Trigger className="mt-1 flex w-full items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                  <Select.Value />
                  <ChevronDownIcon />
                </Select.Trigger>
                <Select.Portal>
                  <Select.Content className="z-50 rounded-md border border-border bg-card shadow-lg">
                    <Select.Viewport className="p-1">
                      {categories.map((cat) => (
                        <Select.Item key={cat.id} value={cat.id} className={SELECT_ITEM_CLASS}>
                          <Select.ItemIndicator><CheckIcon /></Select.ItemIndicator>
                          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: cat.color }} />
                          <Select.ItemText>{cat.name}</Select.ItemText>
                        </Select.Item>
                      ))}
                    </Select.Viewport>
                  </Select.Content>
                </Select.Portal>
              </Select.Root>
            </div>
          </div>

          <div className="mt-5 flex justify-end gap-3">
            <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              loading={saving}
              disabled={!description.trim() || !amountValid}
            >
              Salvar
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

// ── InstallmentRow ────────────────────────────────────────────────────────────

interface InstallmentRowProps {
  item: RichInstallment
  showProgress?: boolean
}

export function InstallmentRow({ item, showProgress }: InstallmentRowProps) {
  const toggle = useTogglePaid()
  const deleteTransaction = useDeleteTransaction()
  const isCredit = item.transaction.type === 'credit_card'
  const totalParcelas = item.transaction.total_installments

  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const remaining = item.transaction.total_installments - item.number
  const progressPct = (item.number / item.transaction.total_installments) * 100

  return (
    <>
      <div className={clsx(
        'rounded-lg border border-border bg-card px-4 py-3 transition-opacity',
        item.paid ? 'opacity-60' : ''
      )}>
        <div className="flex items-center gap-4">
        {/* Paid toggle */}
        <button
          className={clsx(
            'h-5 w-5 flex-shrink-0 rounded-full border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-primary',
            item.paid ? 'border-green-500 bg-green-500' : 'border-muted-foreground'
          )}
          onClick={() => toggle.mutate({ id: item.id, paid: !item.paid })}
          aria-label={item.paid ? 'Marcar como pendente' : 'Marcar como pago'}
        />

        {/* Info */}
        <div className="min-w-0 flex-1">
          <p className={clsx('truncate text-sm font-medium', item.paid && 'line-through text-muted-foreground')}>
            {item.transaction.description}
            {isCredit && totalParcelas > 1 && (
              <span className="font-normal text-muted-foreground"> ({item.number}/{totalParcelas})</span>
            )}
          </p>
          <div className="mt-0.5 flex items-center gap-2">
            <span
              className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium text-white"
              style={{ backgroundColor: item.category.color }}
            >
              {item.category.name}
            </span>
            {item.card && (
              <span className="text-xs text-muted-foreground">
                {item.card.name} •••• {item.card.last_four}
              </span>
            )}
          </div>
        </div>

        {/* Amount + type */}
        <div className="flex-shrink-0 text-right">
          <p className={clsx('text-sm font-semibold', item.paid ? 'text-muted-foreground' : 'text-foreground')}>
            {formatCurrency(item.amount)}
          </p>
          <span className="text-xs text-muted-foreground">
            {TYPE_LABELS[item.transaction.type]}
          </span>
        </div>

        {/* Actions — three-dot menu */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label="Opções"
            >
              <DotsHorizontalIcon className="h-4 w-4" />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className="z-50 min-w-[140px] rounded-lg border border-border bg-card p-1 shadow-lg"
              align="end"
              sideOffset={4}
            >
              <DropdownMenu.Item
                className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground outline-none hover:bg-muted focus:bg-muted"
                onClick={() => setEditOpen(true)}
              >
                <Pencil1Icon className="h-3.5 w-3.5 text-muted-foreground" />
                Editar
              </DropdownMenu.Item>
              <DropdownMenu.Item
                className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-red-500 outline-none hover:bg-red-50 focus:bg-red-50 dark:hover:bg-red-950/30 dark:focus:bg-red-950/30"
                onClick={() => setDeleteOpen(true)}
              >
                <TrashIcon className="h-3.5 w-3.5" />
                Excluir
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
        </div>

        {showProgress && (
          <div className="mt-2 border-t border-border/50 pt-2">
            <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
              <span>Parcela {item.number} de {item.transaction.total_installments}</span>
              <span>{remaining} restante{remaining !== 1 ? 's' : ''}</span>
            </div>
            <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-1 rounded-full bg-primary transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <EditDialog open={editOpen} onOpenChange={setEditOpen} item={item} />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={(o) => { if (!o) setDeleteOpen(false) }}
        title="Excluir lançamento"
        description={
          item.transaction.total_installments > 1
            ? `Isso excluirá todas as ${item.transaction.total_installments} parcelas deste lançamento.`
            : 'Tem certeza que deseja excluir este lançamento?'
        }
        onConfirm={() =>
          deleteTransaction.mutate(item.transaction_id, { onSuccess: () => setDeleteOpen(false) })
        }
        loading={deleteTransaction.isPending}
      />
    </>
  )
}
