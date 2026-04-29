export interface Invoice {
  id: string
  user_id: string
  card_id: string
  month: string // YYYY-MM
  amount: number
  paid: boolean
}

export type InvoiceCreate = Omit<Invoice, 'id' | 'user_id' | 'paid'>
