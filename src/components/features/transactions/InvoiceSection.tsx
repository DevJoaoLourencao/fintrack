import { useEffect, useRef, useState } from 'react'
import { clsx } from 'clsx'
import * as Dialog from '@radix-ui/react-dialog'
import { ChevronDownIcon, ChevronUpIcon, ExclamationTriangleIcon, Pencil1Icon } from '@radix-ui/react-icons'
import type { Card, Invoice, RichInstallment } from '@/domain'
import { useCardsQuery } from '@/hooks/useCards'
import { useInvoicesQuery, useUpsertInvoice, useDeleteInvoice, useToggleInvoicePaid } from '@/hooks/useInvoices'
import { Button } from '@/components/ui/Button'
import { CurrencyInput } from '@/components/ui/CurrencyInput'
import { formatCurrency, formatMonthLabel } from '@/lib/dateUtils'

const TYPE_LABELS: Record<string, string> = {
  credit_card: 'Crédito',
  subscription: 'Assinatura',
}

// ── CoveredItem ───────────────────────────────────────────────────────────────

interface CoveredItemProps {
  item: RichInstallment
  faturaPaid: boolean
}

function CoveredItem({ item, faturaPaid }: CoveredItemProps) {
  const isInstallment = item.transaction.total_installments > 1
  return (
    <div className={clsx(
      'flex items-center gap-3 px-4 py-2 text-sm transition-opacity',
      faturaPaid ? 'opacity-50' : 'opacity-100'
    )}>
      <span className="text-muted-foreground">└─</span>
      <span className={clsx('min-w-0 flex-1 truncate', faturaPaid && 'line-through text-muted-foreground')}>
        {item.transaction.description}
        {isInstallment && (
          <span className="ml-1 text-xs text-muted-foreground font-normal">
            ({item.number}/{item.transaction.total_installments})
          </span>
        )}
      </span>
      <span className="flex-shrink-0 text-xs text-muted-foreground">
        {TYPE_LABELS[item.transaction.type] ?? item.transaction.type}
      </span>
      <span className="flex-shrink-0 tabular-nums font-medium text-foreground">
        {formatCurrency(item.amount)}
      </span>
    </div>
  )
}

// ── InvoiceDialog ─────────────────────────────────────────────────────────────

interface InvoiceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  card: Card
  month: string
  existing: Invoice | null
}

function InvoiceDialog({ open, onOpenChange, card, month, existing }: InvoiceDialogProps) {
  const [amount, setAmount] = useState(0)
  const upsert = useUpsertInvoice()
  const remove = useDeleteInvoice()

  useEffect(() => {
    if (open) setAmount(existing ? existing.amount : 0)
  }, [open, existing])

  const isValid = amount > 0

  function handleSave() {
    if (!isValid) return
    upsert.mutate({ card_id: card.id, month, amount }, { onSuccess: () => onOpenChange(false) })
  }

  function handleDelete() {
    if (!existing) return
    remove.mutate(existing.id, { onSuccess: () => onOpenChange(false) })
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card p-6 shadow-xl focus:outline-none">
          <Dialog.Title className="mb-1 text-base font-semibold text-foreground">
            {existing ? 'Editar Fatura' : 'Registrar Fatura'}
          </Dialog.Title>
          <p className="mb-4 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: card.color }} />
              {card.name} ···· {card.last_four} · {formatMonthLabel(month)}
            </span>
          </p>

          <div>
            <label htmlFor="invoice-amount" className="text-sm text-muted-foreground">
              Valor total da fatura
            </label>
            <CurrencyInput
              id="invoice-amount"
              value={amount}
              onChange={setAmount}
              className="mt-1"
            />
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            {existing ? (
              <Button
                variant="ghost"
                className="text-xs text-red-500 hover:text-red-600"
                onClick={handleDelete}
                loading={remove.isPending}
                disabled={upsert.isPending}
              >
                Remover
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={upsert.isPending || remove.isPending}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={!isValid}
                loading={upsert.isPending}
              >
                Salvar
              </Button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

// ── InvoiceSection ────────────────────────────────────────────────────────────

interface InvoiceSectionProps {
  month: string
  cardItems: RichInstallment[]
}

export function InvoiceSection({ month, cardItems }: InvoiceSectionProps) {
  const { data: cards = [] } = useCardsQuery()
  const { data: invoices = [] } = useInvoicesQuery()
  const togglePaid = useToggleInvoicePaid()

  const [collapsed, setCollapsed] = useState(false)
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())
  const [dialogCard, setDialogCard] = useState<{ card: Card; existing: Invoice | null } | null>(null)
  const autoExpanded = useRef(false)

  useEffect(() => {
    if (!autoExpanded.current && cardItems.length > 0) {
      setExpandedCards(new Set(cardItems.map((i) => i.transaction.card_id).filter(Boolean) as string[]))
      autoExpanded.current = true
    }
  }, [cardItems])

  function toggleCard(cardId: string) {
    setExpandedCards((prev) => {
      const next = new Set(prev)
      if (next.has(cardId)) next.delete(cardId)
      else next.add(cardId)
      return next
    })
  }

  if (cards.length === 0) return null

  const invoiceByCard = new Map(
    invoices.filter((inv) => inv.month === month).map((inv) => [inv.card_id, inv])
  )

  const missingCount = cards.filter((c) => !invoiceByCard.has(c.id)).length
  const totalAmount = Array.from(invoiceByCard.values()).reduce((sum, inv) => sum + inv.amount, 0)

  return (
    <div className="rounded-xl border border-border bg-card">
      {/* Header */}
      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">
            Faturas de {formatMonthLabel(month)}
          </span>
          {missingCount > 0 && (
            <span className="flex items-center gap-1 rounded-full bg-warning/[0.12] px-2 py-0.5 text-[11px] font-medium text-warning">
              <ExclamationTriangleIcon className="h-3 w-3" />
              {missingCount} não registrada{missingCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
        {collapsed ? (
          <ChevronUpIcon className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDownIcon className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {/* Body */}
      {!collapsed && (
        <div className="border-t border-border">
          {cards.map((card) => {
            const invoice = invoiceByCard.get(card.id) ?? null
            const coveredItems = cardItems.filter((i) => i.transaction.card_id === card.id)
            const isPaid = invoice?.paid ?? false
            const isExpanded = expandedCards.has(card.id)
            const hasItems = coveredItems.length > 0

            return (
              <div key={card.id} className="border-b border-border last:border-0">
                {/* Card row */}
                <div className="flex items-center gap-3 px-4 py-3">
                  {/* Paid toggle — only shown when invoice exists */}
                  {invoice ? (
                    <button
                      type="button"
                      className={clsx(
                        'h-5 w-5 flex-shrink-0 rounded-full border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-primary',
                        isPaid ? 'border-green-500 bg-green-500' : 'border-muted-foreground'
                      )}
                      onClick={() => togglePaid.mutate({ id: invoice.id, paid: !isPaid })}
                      aria-label={isPaid ? 'Marcar como não paga' : 'Marcar como paga'}
                    />
                  ) : (
                    <span className="h-5 w-5 flex-shrink-0" />
                  )}

                  {/* Card info */}
                  <span className="h-3 w-3 flex-shrink-0 rounded-full" style={{ backgroundColor: card.color }} />
                  <span className="min-w-0 flex-1 text-sm text-foreground">
                    {card.name} <span className="text-muted-foreground">···· {card.last_four}</span>
                    {hasItems && (
                      <span className="ml-1.5 text-xs text-muted-foreground">
                        ({coveredItems.length})
                      </span>
                    )}
                  </span>

                  {/* Amount */}
                  {invoice ? (
                    <span className="text-sm font-medium tabular-nums text-foreground">
                      {formatCurrency(invoice.amount)}
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">Não registrada</span>
                  )}

                  {/* Edit button */}
                  <button
                    type="button"
                    className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    onClick={() => setDialogCard({ card, existing: invoice })}
                    aria-label={invoice ? 'Editar fatura' : 'Registrar fatura'}
                  >
                    <Pencil1Icon className="h-3.5 w-3.5" />
                  </button>

                  {/* Expand/collapse chevron */}
                  {hasItems && (
                    <button
                      type="button"
                      className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      onClick={() => toggleCard(card.id)}
                      aria-label={isExpanded ? 'Recolher' : 'Expandir'}
                    >
                      {isExpanded
                        ? <ChevronUpIcon className="h-3.5 w-3.5" />
                        : <ChevronDownIcon className="h-3.5 w-3.5" />
                      }
                    </button>
                  )}
                </div>

                {/* Covered items — shown only when expanded */}
                {hasItems && isExpanded && (
                  <div className="pb-1">
                    {coveredItems.map((item) => (
                      <CoveredItem key={item.id} item={item} faturaPaid={isPaid} />
                    ))}
                  </div>
                )}
              </div>
            )
          })}

          {/* Total */}
          {totalAmount > 0 && (
            <div className="flex items-center justify-between border-t border-border px-4 py-3">
              <span className="text-sm font-medium text-foreground">Total</span>
              <span className="text-sm font-semibold tabular-nums text-foreground">
                {formatCurrency(totalAmount)}
              </span>
            </div>
          )}
        </div>
      )}

      {dialogCard && (
        <InvoiceDialog
          open={!!dialogCard}
          onOpenChange={(o) => { if (!o) setDialogCard(null) }}
          card={dialogCard.card}
          month={month}
          existing={dialogCard.existing}
        />
      )}
    </div>
  )
}
