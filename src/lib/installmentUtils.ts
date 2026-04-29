import type { Installment, Transaction } from '@/domain'
import type { Card } from '@/domain/card'
import { addMonths, formatMonth, monthOf } from './dateUtils'

export function dueDate(purchaseDate: string, dueDay: number, monthOffset: number): string {
  const [y, m] = purchaseDate.split('-').map(Number)
  const base = new Date(y, m - 1, 1)
  const target = addMonths(base, monthOffset + 1)
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate()
  const day = Math.min(dueDay, lastDay)
  return `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function recurringDueDate(purchaseDate: string, monthOffset: number): string {
  const [y, m, d] = purchaseDate.split('-').map(Number)
  const target = addMonths(new Date(y, m - 1, 1), monthOffset)
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate()
  const day = Math.min(d, lastDay)
  return `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function generateInstallments(
  transactionId: string,
  tx: Pick<Transaction, 'total_amount' | 'total_installments' | 'purchase_date' | 'type' | 'is_recurring'>,
  card?: Card,
  paidUpTo?: number,
): Omit<Installment, 'id'>[] {
  if (tx.is_recurring) {
    return generateRecurringExtension(
      transactionId,
      tx.total_amount,
      tx.purchase_date,
      monthOf(tx.purchase_date),
      1,
      12
    )
  }

  const count = tx.total_installments
  const base = Math.floor((tx.total_amount / count) * 100) / 100
  const last = Math.round((tx.total_amount - base * (count - 1)) * 100) / 100

  return Array.from({ length: count }, (_, i) => {
    let due: string

    if (tx.type === 'credit_card' && card) {
      due = dueDate(tx.purchase_date, card.due_day, i)
    } else {
      const [y, m, d] = tx.purchase_date.split('-').map(Number)
      const target = addMonths(new Date(y, m - 1, d), i)
      due = `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, '0')}-${String(target.getDate()).padStart(2, '0')}`
    }

    return {
      transaction_id: transactionId,
      number: i + 1,
      amount: i === count - 1 ? last : base,
      due_date: due,
      paid: paidUpTo != null && (i + 1) <= paidUpTo,
    }
  })
}

// Generates `count` recurring installments starting from `startMonth`, numbered from `startNumber`.
// Each installment equals the monthly amount (total_amount on the transaction).
export function generateRecurringExtension(
  transactionId: string,
  monthlyAmount: number,
  purchaseDate: string,
  startMonth: string,
  startNumber: number,
  count: number,
): Omit<Installment, 'id'>[] {
  const [sy, sm] = startMonth.split('-').map(Number)
  const [, , d] = purchaseDate.split('-').map(Number)

  return Array.from({ length: count }, (_, i) => {
    const target = addMonths(new Date(sy, sm - 1, 1), i)
    const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate()
    const day = Math.min(d, lastDay)
    const due = `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return {
      transaction_id: transactionId,
      number: startNumber + i,
      amount: monthlyAmount,
      due_date: due,
      paid: false,
    }
  })
}

// Generates installments for numbers startNum..endNum (1-based), each with the given fixed amount.
// Used when extending an existing parcelamento to more installments.
export function generateInstallmentsRange(
  transactionId: string,
  startNum: number,
  endNum: number,
  purchaseDate: string,
  amount: number,
  card?: Card,
): Omit<Installment, 'id'>[] {
  return Array.from({ length: endNum - startNum + 1 }, (_, i) => {
    const idx = startNum - 1 + i // 0-based month offset
    let due: string
    if (card) {
      due = dueDate(purchaseDate, card.due_day, idx)
    } else {
      const [y, m, d] = purchaseDate.split('-').map(Number)
      const target = addMonths(new Date(y, m - 1, d), idx)
      due = `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, '0')}-${String(target.getDate()).padStart(2, '0')}`
    }
    return { transaction_id: transactionId, number: startNum + i, amount, due_date: due, paid: false }
  })
}

// Returns YYYY-MM that is `months` months ahead of today
export function futureMonth(months: number): string {
  return formatMonth(addMonths(new Date(), months))
}
