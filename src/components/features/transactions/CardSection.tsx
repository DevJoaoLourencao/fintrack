import { Button } from "@/components/ui/Button";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import type { Card, Invoice, RichInstallment } from "@/domain";
import { useCardsQuery } from "@/hooks/useCards";
import { useMarkCardPaid } from "@/hooks/useInstallments";
import {
  useDeleteInvoice,
  useInvoicesQuery,
  useToggleInvoicePaid,
  useUpsertInvoice,
} from "@/hooks/useInvoices";
import { formatCurrency, formatMonthLabel } from "@/lib/dateUtils";
import { useHideValuesStore } from "@/stores/hideValuesStore";
import * as Dialog from "@radix-ui/react-dialog";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  Pencil1Icon,
} from "@radix-ui/react-icons";
import { clsx } from "clsx";
import { useEffect, useState } from "react";
import { InstallmentRow } from "./InstallmentRow";

const HIDDEN_VALUE = "••••••";

// ── InvoiceDialog ─────────────────────────────────────────────────────────────

interface InvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  card: Card;
  month: string;
  existing: Invoice | null;
}

function InvoiceDialog({
  open,
  onOpenChange,
  card,
  month,
  existing,
}: InvoiceDialogProps) {
  const [amount, setAmount] = useState(0);
  const upsert = useUpsertInvoice();
  const remove = useDeleteInvoice();

  useEffect(() => {
    if (open) setAmount(existing ? existing.amount : 0);
  }, [open, existing]);

  function handleSave() {
    if (amount <= 0) return;
    upsert.mutate(
      { card_id: card.id, month, amount },
      { onSuccess: () => onOpenChange(false) },
    );
  }

  function handleDelete() {
    if (!existing) return;
    remove.mutate(existing.id, { onSuccess: () => onOpenChange(false) });
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border/50 bg-card p-6 shadow-card-lg focus:outline-none">
          <Dialog.Title className="mb-1 text-base font-semibold text-foreground">
            {existing ? "Editar Fatura" : "Registrar Fatura"}
          </Dialog.Title>
          <p className="mb-4 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: card.color }}
              />
              {card.name} ···· {card.last_four} · {formatMonthLabel(month)}
            </span>
          </p>

          <div>
            <label
              htmlFor="invoice-amount"
              className="text-sm text-muted-foreground"
            >
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
                disabled={amount <= 0}
                loading={upsert.isPending}
              >
                Salvar
              </Button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ── CardRow ───────────────────────────────────────────────────────────────────

interface CardRowProps {
  card: Card;
  items: RichInstallment[];
  invoice: Invoice | null;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEditInvoice: () => void;
  hideValues: boolean;
  markCardPaidPending: boolean;
  togglePaidPending: boolean;
  onTogglePaid: () => void;
}

function CardRow({
  card,
  items,
  invoice,
  isExpanded,
  onToggleExpand,
  onEditInvoice,
  hideValues,
  markCardPaidPending,
  togglePaidPending,
  onTogglePaid,
}: CardRowProps) {
  const trackedTotal = items.reduce((sum, i) => sum + i.amount, 0);
  const displayTotal = invoice ? invoice.amount : trackedTotal;
  const outrosValue = invoice ? invoice.amount - trackedTotal : 0;
  const isPaid = invoice
    ? invoice.paid
    : items.length > 0 && items.every((i) => i.paid);
  const hasPendingInvoice = !isPaid && (items.length > 0 || !!invoice);
  const isPending = markCardPaidPending || togglePaidPending;
  const hasExpandable = items.length > 0 || (!!invoice && items.length === 0);

  return (
    <div
      className={clsx(
        "rounded-xl border bg-card transition-colors",
        hasPendingInvoice
          ? "border-amber-400/60 dark:border-amber-500/40"
          : "border-border",
      )}
    >
      {/* Header row */}
      <div className="flex items-center gap-2 px-4 py-3">
        {/* Paid toggle */}
        {items.length > 0 ? (
          <button
            type="button"
            className={clsx(
              "h-5 w-5 flex-shrink-0 rounded-full border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-primary",
              isPaid
                ? "border-green-500 bg-green-500"
                : "border-muted-foreground",
              isPending && "cursor-wait opacity-50",
            )}
            onClick={onTogglePaid}
            aria-label={
              isPaid ? "Marcar como não paga" : "Marcar fatura como paga"
            }
          />
        ) : invoice ? (
          <button
            type="button"
            className={clsx(
              "h-5 w-5 flex-shrink-0 rounded-full border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-primary",
              invoice.paid
                ? "border-green-500 bg-green-500"
                : "border-muted-foreground",
              togglePaidPending && "cursor-wait opacity-50",
            )}
            onClick={onTogglePaid}
            aria-label={
              invoice.paid ? "Marcar como não paga" : "Marcar como paga"
            }
          />
        ) : (
          <span className="h-5 w-5 flex-shrink-0" />
        )}

        {/* Color dot */}
        <span
          className="h-3 w-3 flex-shrink-0 rounded-full"
          style={{ backgroundColor: card.color }}
        />

        {/* Card info — left */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
            <span className="text-sm font-medium text-foreground">
              {card.name}
            </span>
            <span className="text-sm text-muted-foreground">
              ···· {card.last_four}
            </span>
            {card.due_day && (
              <span className="rounded-full bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
                vence dia {card.due_day}
              </span>
            )}
          </div>
          {items.length > 0 && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {items.length} {items.length === 1 ? "lançamento" : "lançamentos"}
            </p>
          )}
        </div>

        {/* Right: total + status badge */}
        {displayTotal > 0 && (
          <div className="flex-shrink-0 text-right">
            <p className="text-sm font-semibold tabular-nums text-foreground">
              {hideValues ? HIDDEN_VALUE : formatCurrency(displayTotal)}
            </p>
            {isPaid ? (
              <span className="inline-flex items-center rounded-full bg-green-100 px-1.5 py-0.5 text-[11px] font-medium text-green-700 dark:bg-green-950/40 dark:text-green-400">
                Paga
              </span>
            ) : items.length > 0 || !!invoice ? (
              <span className="inline-flex items-center rounded-full bg-amber-100 px-1.5 py-0.5 text-[11px] font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                Pendente
              </span>
            ) : null}
          </div>
        )}

        {/* Edit invoice */}
        <button
          type="button"
          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          onClick={onEditInvoice}
          aria-label={invoice ? "Editar fatura" : "Registrar fatura"}
        >
          <Pencil1Icon className="h-3.5 w-3.5" />
        </button>

        {/* Expand chevron */}
        {hasExpandable && (
          <button
            type="button"
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            onClick={onToggleExpand}
            aria-label={isExpanded ? "Recolher" : "Expandir"}
          >
            {isExpanded ? (
              <ChevronUpIcon className="h-3.5 w-3.5" />
            ) : (
              <ChevronDownIcon className="h-3.5 w-3.5" />
            )}
          </button>
        )}
      </div>

      {/* Expanded items */}
      {isExpanded && (
        <div className="border-t border-border/50 px-3 pb-3 pt-2 space-y-2">
          {items.map((item) => (
            <InstallmentRow key={item.id} item={item} hidePaidToggle />
          ))}

          {/* Outros lançamentos — difference between invoice and tracked items */}
          {outrosValue > 0 && (
            <div className="flex items-center gap-4 rounded-lg border border-border bg-muted/40 px-4 py-3">
              <span className="h-5 w-5 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-muted-foreground">
                  Outros lançamentos
                </p>
              </div>
              <p className="flex-shrink-0 text-sm font-semibold tabular-nums text-muted-foreground">
                {hideValues ? HIDDEN_VALUE : formatCurrency(outrosValue)}
              </p>
              <span className="h-7 w-7 flex-shrink-0" />
              <span className="h-7 w-7 flex-shrink-0" />
            </div>
          )}

          {/* Manual-only invoice */}
          {items.length === 0 && invoice && (
            <p className="px-1 text-xs text-muted-foreground/60">
              Fatura registrada manualmente · sem itens rastreados
              individualmente
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── CardSection ───────────────────────────────────────────────────────────────

interface CardSectionProps {
  month: string;
  cardItems: RichInstallment[];
}

export function CardSection({ month, cardItems }: CardSectionProps) {
  const { hideValues } = useHideValuesStore();
  const { data: cards = [] } = useCardsQuery();
  const { data: invoices = [] } = useInvoicesQuery();
  const togglePaid = useToggleInvoicePaid();
  const markCardPaid = useMarkCardPaid();

  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [dialogCard, setDialogCard] = useState<{
    card: Card;
    existing: Invoice | null;
  } | null>(null);

  const invoiceByCard = new Map(
    invoices
      .filter((inv) => inv.month === month)
      .map((inv) => [inv.card_id, inv]),
  );

  const relevantCards = cards
    .filter(
      (c) =>
        invoiceByCard.has(c.id) ||
        cardItems.some((i) => i.transaction.card_id === c.id),
    )
    .sort((a, b) => {
      const totalFor = (c: typeof a) => {
        const inv = invoiceByCard.get(c.id)
        const items = cardItems.filter((i) => i.transaction.card_id === c.id)
        return inv ? inv.amount : items.reduce((s, i) => s + i.amount, 0)
      }
      return totalFor(b) - totalFor(a)
    })

  if (relevantCards.length === 0) return null;

  const sectionTotal = (() => {
    let total = 0
    const counted = new Set<string>()
    for (const card of relevantCards) {
      const inv = invoiceByCard.get(card.id)
      const items = cardItems.filter((i) => i.transaction.card_id === card.id)
      total += inv ? inv.amount : items.reduce((s, i) => s + i.amount, 0)
      counted.add(card.id)
    }
    return total
  })()

  function toggleCard(cardId: string) {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      if (next.has(cardId)) next.delete(cardId);
      else next.add(cardId);
      return next;
    });
  }

  return (
    <div className="space-y-1">
      {/* Section header */}
      <div className="flex items-center justify-between px-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Cartões
        </p>
        {sectionTotal > 0 && (
          <span className="text-xs font-medium tabular-nums text-muted-foreground">
            {hideValues ? HIDDEN_VALUE : formatCurrency(sectionTotal)}
          </span>
        )}
      </div>

      <div className="space-y-2">
        {relevantCards.map((card) => {
          const invoice = invoiceByCard.get(card.id) ?? null;
          const items = cardItems
            .filter((i) => i.transaction.card_id === card.id)
            .sort((a, b) => b.amount - a.amount);
          const isPaid = invoice
            ? invoice.paid
            : items.length > 0 && items.every((i) => i.paid);

          function handleTogglePaid() {
            if (items.length > 0) {
              const installmentIds = items.map((i) => i.id);
              markCardPaid.mutate(
                { installmentIds, paid: !isPaid },
                {
                  onSuccess: () =>
                    invoice &&
                    togglePaid.mutate({ id: invoice.id, paid: !isPaid }),
                },
              );
            } else if (invoice) {
              togglePaid.mutate({ id: invoice.id, paid: !invoice.paid });
            }
          }

          return (
            <CardRow
              key={card.id}
              card={card}
              items={items}
              invoice={invoice}
              isExpanded={expandedCards.has(card.id)}
              onToggleExpand={() => toggleCard(card.id)}
              onEditInvoice={() => setDialogCard({ card, existing: invoice })}
              hideValues={hideValues}
              markCardPaidPending={markCardPaid.isPending}
              togglePaidPending={togglePaid.isPending}
              onTogglePaid={handleTogglePaid}
            />
          );
        })}
      </div>

      {dialogCard && (
        <InvoiceDialog
          open={!!dialogCard}
          onOpenChange={(o) => {
            if (!o) setDialogCard(null);
          }}
          card={dialogCard.card}
          month={month}
          existing={dialogCard.existing}
        />
      )}
    </div>
  );
}
