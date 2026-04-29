import type { Card } from './card'
import type { Category } from './category'
import type { Transaction } from './transaction'

export interface Installment {
  id: string
  transaction_id: string
  number: number
  amount: number
  due_date: string
  paid: boolean
}

export interface RichInstallment extends Installment {
  transaction: Transaction
  category: Category
  card: Card | undefined
}

export interface ActiveInstallmentGroup {
  transactionId: string
  description: string
  category_id: string
  card_id: string | null
  purchase_date: string
  monthlyAmount: number
  totalInstallments: number
  remaining: number
}
