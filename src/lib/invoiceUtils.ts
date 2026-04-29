import type { Invoice, RichInstallment } from '@/domain'

// Determines which card_ids have a registered invoice for a given month
function invoicedCardIds(invoices: Invoice[], month: string): Set<string> {
  return new Set(
    invoices.filter((inv) => inv.month === month).map((inv) => inv.card_id)
  )
}

// Returns true if an installment should be EXCLUDED from totals because its card has a registered invoice
function isSupersededByInvoice(item: RichInstallment, cardIds: Set<string>): boolean {
  const isCardBased = item.transaction.type === 'credit_card' || item.transaction.type === 'subscription'
  return isCardBased && !!item.transaction.card_id && cardIds.has(item.transaction.card_id)
}

export function computeHybridTotal(
  installments: RichInstallment[],
  invoices: Invoice[],
  month: string
): number {
  const cardIds = invoicedCardIds(invoices, month)
  const installmentTotal = installments
    .filter((i) => i.due_date.startsWith(month))
    .filter((i) => !isSupersededByInvoice(i, cardIds))
    .reduce((s, i) => s + i.amount, 0)
  const invoiceTotal = invoices
    .filter((inv) => inv.month === month)
    .reduce((s, inv) => s + inv.amount, 0)
  return installmentTotal + invoiceTotal
}

export interface CategoryBreakdown {
  id: string
  name: string
  color: string
  total: number
}

// The special key used for aggregated card invoices (no category)
export const INVOICE_CATEGORY_ID = '__card_invoice__'

export function computeHybridByCategory(
  installments: RichInstallment[],
  invoices: Invoice[],
  month: string
): Record<string, CategoryBreakdown> {
  const cardIds = invoicedCardIds(invoices, month)

  const result: Record<string, CategoryBreakdown> = {}

  // Non-superseded installments bucketed by category
  installments
    .filter((i) => i.due_date.startsWith(month))
    .filter((i) => !isSupersededByInvoice(i, cardIds))
    .forEach((i) => {
      const key = i.category.id
      if (!result[key]) {
        result[key] = { id: key, name: i.category.name, color: i.category.color, total: 0 }
      }
      result[key].total += i.amount
    })

  // Invoices as a single "Cartão de Crédito" bucket
  const invoiceMonthTotal = invoices
    .filter((inv) => inv.month === month)
    .reduce((s, inv) => s + inv.amount, 0)

  if (invoiceMonthTotal > 0) {
    result[INVOICE_CATEGORY_ID] = {
      id: INVOICE_CATEGORY_ID,
      name: 'Cartão de Crédito',
      color: '#7c3aed',
      total: invoiceMonthTotal,
    }
  }

  return result
}
