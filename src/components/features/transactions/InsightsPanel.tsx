import { useEffect, useState } from 'react'
import { ChevronDownIcon, ChevronUpIcon, CheckIcon, Pencil1Icon } from '@radix-ui/react-icons'
import * as Dialog from '@radix-ui/react-dialog'
import * as Select from '@radix-ui/react-select'
import { useQueryClient } from '@tanstack/react-query'
import { useActiveInstallmentGroups } from '@/hooks/useInstallments'
import { useActiveSubscriptions } from '@/hooks/useTransactions'
import { useCategoriesQuery } from '@/hooks/useCategories'
import { useCardsQuery } from '@/hooks/useCards'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/components/ui/Toast'
import { transactionService } from '@/services/transactions'
import { installmentService } from '@/services/installments'
import { generateInstallmentsRange } from '@/lib/installmentUtils'
import { queryKeys } from '@/hooks/queryKeys'
import { Button } from '@/components/ui/Button'
import { CurrencyInput } from '@/components/ui/CurrencyInput'
import { formatCurrency } from '@/lib/dateUtils'
import type { ActiveInstallmentGroup } from '@/domain'

const SELECT_ITEM_CLASS =
  'flex cursor-pointer items-center gap-2 rounded px-3 py-2 text-sm hover:bg-muted focus:bg-muted focus:outline-none'

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3 animate-pulse">
      <div className="h-4 w-44 bg-muted rounded" />
    </div>
  )
}

function Badge({ count }: { count: number }) {
  return (
    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary tabular-nums">
      {count}
    </span>
  )
}

// ── Edit Dialog ───────────────────────────────────────────────────────────────

interface EditInstallmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  group: ActiveInstallmentGroup
}

function EditInstallmentDialog({ open, onOpenChange, group }: EditInstallmentDialogProps) {
  const { data: categories = [] } = useCategoriesQuery()
  const { data: cards = [] } = useCardsQuery()
  const queryClient = useQueryClient()
  const userId = useAuthStore((s) => s.user!.id)
  const { toast } = useToast()

  const paidCount = group.totalInstallments - group.remaining

  const [description, setDescription] = useState(group.description)
  const [categoryId, setCategoryId] = useState(group.category_id)
  const [amount, setAmount] = useState(group.monthlyAmount)
  const [totalInstallments, setTotalInstallments] = useState(group.totalInstallments)
  const [purchaseDate, setPurchaseDate] = useState(group.purchase_date)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setDescription(group.description)
      setCategoryId(group.category_id)
      setAmount(group.monthlyAmount)
      setTotalInstallments(group.totalInstallments)
      setPurchaseDate(group.purchase_date)
    }
  }, [open, group])

  async function handleSave() {
    if (!description.trim() || amount <= 0) return
    setSaving(true)
    try {
      const txUpdate: Parameters<typeof transactionService.update>[1] = {
        description,
        category_id: categoryId,
      }

      const card = group.card_id ? cards.find((c) => c.id === group.card_id) : undefined

      if (amount !== group.monthlyAmount) {
        await installmentService.updateAllUnpaid(group.transactionId, amount)
      }

      if (totalInstallments !== group.totalInstallments) {
        txUpdate.total_installments = totalInstallments
        txUpdate.total_amount = totalInstallments * amount

        if (totalInstallments > group.totalInstallments) {
          const newInstallments = generateInstallmentsRange(
            group.transactionId,
            group.totalInstallments + 1,
            totalInstallments,
            purchaseDate,
            amount,
            card,
          )
          await installmentService.createBatchSafe(newInstallments)
        } else {
          await installmentService.deleteUnpaidAfter(group.transactionId, totalInstallments)
        }
      }

      if (purchaseDate !== group.purchase_date) {
        txUpdate.purchase_date = purchaseDate
        await installmentService.updateDueDates(group.transactionId, purchaseDate, card)
      }

      await transactionService.update(group.transactionId, txUpdate)

      queryClient.invalidateQueries({ queryKey: ['installments', 'month', userId] })
      queryClient.invalidateQueries({ queryKey: queryKeys.activeInstallments(userId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.installmentsUpcoming(userId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.installmentsTrend(userId) })
      toast({ title: 'Parcelamento atualizado.' })
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
          <Dialog.Title className="mb-1 text-base font-semibold text-foreground">
            Editar Parcelamento
          </Dialog.Title>
          <p className="mb-4 text-xs text-muted-foreground">
            {group.remaining}/{group.totalInstallments} parcelas restantes · valor e quantidade se aplicam às parcelas pendentes
          </p>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground">Descrição</label>
              <input
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm text-muted-foreground">Data da compra</label>
              <input
                type="date"
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
              />
              {purchaseDate !== group.purchase_date && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Datas de vencimento das parcelas pendentes serão recalculadas
                </p>
              )}
            </div>

            <div>
              <label className="text-sm text-muted-foreground">Valor por parcela</label>
              <CurrencyInput value={amount} onChange={setAmount} className="mt-1" />
            </div>

            <div>
              <span className="text-sm text-muted-foreground">Total de parcelas</span>
              <Select.Root
                value={String(totalInstallments)}
                onValueChange={(v) => setTotalInstallments(Number(v))}
              >
                <Select.Trigger className="mt-1 flex w-full items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                  <Select.Value />
                  <ChevronDownIcon />
                </Select.Trigger>
                <Select.Portal>
                  <Select.Content
                    className="z-50 max-h-56 overflow-hidden rounded-md border border-border bg-card shadow-lg"
                    position="popper"
                    sideOffset={4}
                  >
                    <Select.ScrollUpButton className="flex h-6 cursor-default items-center justify-center bg-card text-muted-foreground">
                      <ChevronUpIcon />
                    </Select.ScrollUpButton>
                    <Select.Viewport className="p-1">
                      {Array.from({ length: 48 }, (_, i) => i + 1)
                        .filter((n) => n >= paidCount || n === group.totalInstallments)
                        .map((n) => (
                          <Select.Item key={n} value={String(n)} className={SELECT_ITEM_CLASS}>
                            <Select.ItemIndicator><CheckIcon /></Select.ItemIndicator>
                            <Select.ItemText>
                              {n}x{n === group.totalInstallments ? ' (atual)' : ''}
                            </Select.ItemText>
                          </Select.Item>
                        ))}
                    </Select.Viewport>
                    <Select.ScrollDownButton className="flex h-6 cursor-default items-center justify-center bg-card text-muted-foreground">
                      <ChevronDownIcon />
                    </Select.ScrollDownButton>
                  </Select.Content>
                </Select.Portal>
              </Select.Root>
              {totalInstallments !== group.totalInstallments && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {totalInstallments > group.totalInstallments
                    ? `+${totalInstallments - group.totalInstallments} parcelas serão criadas`
                    : `${group.totalInstallments - totalInstallments} parcelas pendentes serão removidas`}
                </p>
              )}
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

            {amount > 0 && (
              <div className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
                Total: <span className="font-semibold text-foreground">{formatCurrency(totalInstallments * amount)}</span>
                {totalInstallments !== group.totalInstallments || amount !== group.monthlyAmount
                  ? <span className="ml-1">(antes: {formatCurrency(group.totalInstallments * group.monthlyAmount)})</span>
                  : null}
              </div>
            )}
          </div>

          <div className="mt-5 flex justify-end gap-3">
            <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} loading={saving} disabled={!description.trim() || amount <= 0}>
              Salvar
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

// ── InsightsPanel ─────────────────────────────────────────────────────────────

export function InsightsPanel() {
  const { data: groups = [], isLoading: loadingGroups } = useActiveInstallmentGroups()
  const { data: subscriptions = [], isLoading: loadingSubs } = useActiveSubscriptions()

  const [showInstallments, setShowInstallments] = useState(false)
  const [showSubscriptions, setShowSubscriptions] = useState(false)
  const [editGroup, setEditGroup] = useState<ActiveInstallmentGroup | null>(null)

  const hasInstallments = groups.length > 0
  const hasSubscriptions = subscriptions.length > 0

  const isLoading = loadingGroups || loadingSubs
  const nothingToShow = !isLoading && !hasInstallments && !hasSubscriptions

  if (nothingToShow) return null

  const subscriptionsTotal = subscriptions.reduce((sum, s) => sum + s.monthlyAmount, 0)

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
        {/* ── Parcelamentos ─────────────────────────────────────── */}
        {loadingGroups ? (
          <SkeletonCard />
        ) : hasInstallments ? (
          <div className="rounded-xl border border-border bg-card">
            <button
              type="button"
              onClick={() => setShowInstallments((v) => !v)}
              className="flex w-full items-center justify-between px-4 py-3 text-left"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">Parcelamentos ativos</span>
                <Badge count={groups.length} />
              </div>
              {showInstallments
                ? <ChevronUpIcon className="h-4 w-4 text-muted-foreground" />
                : <ChevronDownIcon className="h-4 w-4 text-muted-foreground" />
              }
            </button>

            {showInstallments && (
              <div className="border-t border-border">
                {groups.map((g) => (
                  <div key={g.transactionId} className="flex items-center gap-3 px-4 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-foreground">{g.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {g.remaining}/{g.totalInstallments} parcelas restantes
                      </p>
                    </div>
                    <span className="flex-shrink-0 text-sm tabular-nums text-foreground">
                      {formatCurrency(g.monthlyAmount)}/mês
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditGroup(g)}
                      className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      aria-label="Editar parcelamento"
                    >
                      <Pencil1Icon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}

        {/* ── Assinaturas ───────────────────────────────────────── */}
        {loadingSubs ? (
          <SkeletonCard />
        ) : hasSubscriptions ? (
          <div className="rounded-xl border border-border bg-card">
            <button
              type="button"
              onClick={() => setShowSubscriptions((v) => !v)}
              className="flex w-full items-center justify-between px-4 py-3 text-left"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm font-medium text-foreground">Assinaturas</span>
                <Badge count={subscriptions.length} />
                <span className="text-xs text-muted-foreground truncate">
                  · {formatCurrency(subscriptionsTotal)}/mês
                </span>
              </div>
              {showSubscriptions
                ? <ChevronUpIcon className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                : <ChevronDownIcon className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
              }
            </button>

            {showSubscriptions && (
              <div className="border-t border-border">
                {subscriptions.map((s) => (
                  <div
                    key={s.transactionId}
                    className="flex items-center justify-between gap-3 px-4 py-2.5"
                  >
                    <span className="min-w-0 truncate text-sm text-foreground">{s.description}</span>
                    <span className="flex-shrink-0 text-sm tabular-nums text-foreground">
                      {formatCurrency(s.monthlyAmount)}/mês
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </div>

      {editGroup && (
        <EditInstallmentDialog
          open={!!editGroup}
          onOpenChange={(o) => { if (!o) setEditGroup(null) }}
          group={editGroup}
        />
      )}
    </>
  )
}
