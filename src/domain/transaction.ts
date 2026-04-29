export type TransactionType = 'credit_card' | 'recurring' | 'subscription'

export interface Transaction {
  id: string
  user_id: string
  card_id: string | null
  category_id: string
  description: string
  total_amount: number
  type: TransactionType
  total_installments: number
  purchase_date: string
  is_recurring: boolean
}

export type TransactionCreate = Omit<Transaction, 'id' | 'user_id'>

export interface ActiveSubscription {
  transactionId: string
  description: string
  monthlyAmount: number
}
