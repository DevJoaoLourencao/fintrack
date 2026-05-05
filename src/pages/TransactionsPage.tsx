import { MonthSelector } from "@/components/features/MonthSelector";
import { AssinaturasPanel } from "@/components/features/transactions/AssinaturasPanel";
import { AvulsosSection } from "@/components/features/transactions/AvulsosSection";
import { CardSection } from "@/components/features/transactions/CardSection";
import { RecurrentesSection } from "@/components/features/transactions/RecurrentesSection";
import { TransactionDialog } from "@/components/features/transactions/TransactionDialog";
import { Button } from "@/components/ui/Button";
import { useInstallmentsByMonth } from "@/hooks/useInstallments";
import { useInvoicesQuery } from "@/hooks/useInvoices";
import { formatCurrency } from "@/lib/dateUtils";
import { computeHybridTotal } from "@/lib/invoiceUtils";
import { useFiltersStore } from "@/stores/filtersStore";
import { useHideValuesStore } from "@/stores/hideValuesStore";
import { PlusIcon } from "@radix-ui/react-icons";
import { useMemo, useState } from "react";

const HIDDEN_VALUE = "••••••";

// ── SummaryRow ────────────────────────────────────────────────────────────────

interface SummaryRowProps {
  grandTotal: number;
  cardTotal: number;
  recurrentesTotal: number;
  subscriptionOnCardTotal: number;
  cardStatus: { paid: number; pending: number; total: number };
  hideValues: boolean;
}

function SummaryRow({
  grandTotal,
  cardTotal,
  recurrentesTotal,
  subscriptionOnCardTotal,
  cardStatus,
  hideValues,
}: SummaryRowProps) {
  const fmt = (v: number) => (hideValues ? HIDDEN_VALUE : formatCurrency(v));
  const recurrentesComAssinaturas = recurrentesTotal + subscriptionOnCardTotal;
  const paidPct =
    cardStatus.total > 0 ? (cardStatus.paid / cardStatus.total) * 100 : 0;

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
      <div className="flex flex-col justify-between rounded-xl border border-border bg-card px-4 py-3">
        <div>
          <p className="text-xs text-muted-foreground">Total do mês</p>
          <p className="mt-0.5 text-sm font-semibold tabular-nums text-foreground">
            {fmt(grandTotal)}
          </p>
        </div>
        {!hideValues && grandTotal > 0 && (
          <p className="mt-0.5 text-[11px] text-muted-foreground tabular-nums">
            {cardTotal > 0 && `${formatCurrency(cardTotal)} cartões`}
            {cardTotal > 0 && recurrentesTotal > 0 && " · "}
            {recurrentesTotal > 0 &&
              `${formatCurrency(recurrentesTotal)} recorrentes`}
          </p>
        )}
      </div>
      <div className="flex flex-col justify-between rounded-xl border border-border bg-card px-4 py-3">
        <div>
          <p className="text-xs text-muted-foreground">Cartões</p>
          <p className="mt-0.5 text-sm font-semibold tabular-nums text-foreground">
            {fmt(cardTotal)}
          </p>
        </div>
        {cardStatus.total > 0 && (
          <>
            <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-1 rounded-full bg-green-500 transition-all"
                style={{ width: `${paidPct}%` }}
              />
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {cardStatus.paid > 0 &&
                `${cardStatus.paid} paga${cardStatus.paid > 1 ? "s" : ""}`}
              {cardStatus.paid > 0 && cardStatus.pending > 0 && " · "}
              {cardStatus.pending > 0 &&
                `${cardStatus.pending} pendente${cardStatus.pending > 1 ? "s" : ""}`}
            </p>
          </>
        )}
      </div>
      <div className="flex flex-col justify-between rounded-xl border border-border bg-card px-4 py-3">
        <div>
          <p className="text-xs text-muted-foreground">
            Recorrentes + Assinaturas
          </p>
          <p className="mt-0.5 text-sm font-semibold tabular-nums text-foreground">
            {fmt(recurrentesComAssinaturas)}
          </p>
        </div>
        {!hideValues &&
          (recurrentesTotal > 0 || subscriptionOnCardTotal > 0) && (
            <p className="mt-0.5 text-[11px] text-muted-foreground tabular-nums">
              {recurrentesTotal > 0 &&
                `${formatCurrency(recurrentesTotal)} débito`}
              {recurrentesTotal > 0 && subscriptionOnCardTotal > 0 && " · "}
              {subscriptionOnCardTotal > 0 &&
                `${formatCurrency(subscriptionOnCardTotal)} no cartão`}
            </p>
          )}
      </div>
    </div>
  );
}

// ── TransactionsPage ──────────────────────────────────────────────────────────

export function TransactionsPage() {
  const { hideValues } = useHideValuesStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const { selectedMonth } = useFiltersStore();
  const { data: installments = [], isLoading } =
    useInstallmentsByMonth(selectedMonth);
  const { data: invoices = [] } = useInvoicesQuery();

  // Cartões: tudo que tem card_id (credit_card + subscription no cartão)
  const cardItems = useMemo(
    () => installments.filter((i) => !!i.transaction.card_id),
    [installments],
  );

  // Recorrentes/Débitos: recurring sem cartão (boleto, débito, PIX)
  const recurrentesItems = useMemo(
    () =>
      installments
        .filter(
          (i) => i.transaction.type === "recurring" && !i.transaction.card_id,
        )
        .sort((a, b) => b.amount - a.amount),
    [installments],
  );

  // Avulsos: credit_card sem cartão
  const avulsosItems = useMemo(
    () =>
      installments
        .filter(
          (i) => i.transaction.type === "credit_card" && !i.transaction.card_id,
        )
        .sort((a, b) => b.amount - a.amount),
    [installments],
  );

  const monthInvoices = useMemo(
    () => invoices.filter((inv) => inv.month === selectedMonth),
    [invoices, selectedMonth],
  );

  // Hybrid card total: invoice.amount when registered for a card, tracked items when not
  const cardTotal = useMemo(() => {
    const invoiceByCard = new Map(
      monthInvoices.map((inv) => [inv.card_id, inv]),
    );
    const cardIds = [
      ...new Set(
        cardItems
          .map((i) => i.transaction.card_id)
          .filter((id): id is string => !!id),
      ),
    ];
    const counted = new Set<string>();
    let total = 0;
    for (const cardId of cardIds) {
      const inv = invoiceByCard.get(cardId);
      total += inv
        ? inv.amount
        : cardItems
            .filter((i) => i.transaction.card_id === cardId)
            .reduce((s, i) => s + i.amount, 0);
      counted.add(cardId);
    }
    // invoices for cards without tracked items
    for (const inv of monthInvoices) {
      if (!counted.has(inv.card_id)) total += inv.amount;
    }
    return total;
  }, [cardItems, monthInvoices]);

  const recurrentesTotal = useMemo(
    () => recurrentesItems.reduce((sum, i) => sum + i.amount, 0),
    [recurrentesItems],
  );
  const subscriptionItems = useMemo(
    () =>
      installments
        .filter((i) => i.transaction.type === "subscription")
        .sort((a, b) => b.amount - a.amount),
    [installments],
  );

  // Subscription breakdown for pill 3: amounts from tracked subscription installments on cards
  // (approximate — superseded by invoice when one is registered)
  const subscriptionOnCardTotal = useMemo(
    () =>
      cardItems
        .filter((i) => i.transaction.type === "subscription")
        .reduce((sum, i) => sum + i.amount, 0),
    [cardItems],
  );

  // Grand total: invoices supersede tracked card items; non-card items counted directly
  const grandTotal = useMemo(
    () => computeHybridTotal(installments, monthInvoices, selectedMonth),
    [installments, monthInvoices, selectedMonth],
  );

  const cardStatus = useMemo(() => {
    const invoiceByCard = new Map(
      monthInvoices.map((inv) => [inv.card_id, inv]),
    );
    const cardIds = [
      ...new Set([
        ...cardItems
          .map((i) => i.transaction.card_id)
          .filter((id): id is string => !!id),
        ...monthInvoices.map((inv) => inv.card_id),
      ]),
    ];
    let paid = 0,
      pending = 0;
    for (const cardId of cardIds) {
      const invoice = invoiceByCard.get(cardId);
      const items = cardItems.filter((i) => i.transaction.card_id === cardId);
      const isPaid = invoice
        ? invoice.paid
        : items.length > 0 && items.every((i) => i.paid);
      isPaid ? paid++ : pending++;
    }
    return { paid, pending, total: paid + pending };
  }, [cardItems, monthInvoices]);

  const hasItems = installments.length > 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold text-foreground">Lançamentos</h2>
          <MonthSelector />
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-1">
          <PlusIcon className="h-4 w-4" /> Novo Lançamento
        </Button>
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-lg border border-border bg-card px-4 py-3"
            >
              <div className="mb-2 h-4 w-48 rounded bg-muted" />
              <div className="h-3 w-32 rounded bg-muted" />
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      {!isLoading && hasItems && (
        <SummaryRow
          grandTotal={grandTotal}
          cardTotal={cardTotal}
          recurrentesTotal={recurrentesTotal}
          subscriptionOnCardTotal={subscriptionOnCardTotal}
          cardStatus={cardStatus}
          hideValues={hideValues}
        />
      )}

      {/* Empty state */}
      {!isLoading && !hasItems && (
        <div className="py-16 text-center text-sm text-muted-foreground">
          Nenhum lançamento encontrado para este período.
        </div>
      )}

      {/* Sections */}
      {!isLoading && (
        <>
          <CardSection month={selectedMonth} cardItems={cardItems} />
          <RecurrentesSection items={recurrentesItems} />
          <AssinaturasPanel items={subscriptionItems} />
          <AvulsosSection items={avulsosItems} />
        </>
      )}

      <TransactionDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
