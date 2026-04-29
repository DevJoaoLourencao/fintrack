import type { Invoice, InvoiceCreate } from '@/domain'
import { supabase } from '@/lib/supabase'
import { createMockStorage } from './mock/storage'

const MOCK_ENABLED = import.meta.env.VITE_MOCK_DATA === 'true'

const storage = createMockStorage<Invoice>('fintrack-invoices')

const mockInvoices = {
  async list(userId: string): Promise<Invoice[]> {
    return Promise.resolve(storage.list().filter((i) => i.user_id === userId))
  },
  async upsert(userId: string, data: InvoiceCreate): Promise<Invoice> {
    const existing = storage.list().find(
      (i) => i.user_id === userId && i.card_id === data.card_id && i.month === data.month
    )
    if (existing) {
      // Preserve paid status when updating amount
      return Promise.resolve(storage.update(existing.id, { amount: data.amount }))
    }
    return Promise.resolve(storage.create({ ...data, user_id: userId, paid: false }))
  },
  async togglePaid(id: string, paid: boolean): Promise<Invoice> {
    return Promise.resolve(storage.update(id, { paid }))
  },
  async remove(id: string): Promise<void> {
    storage.remove(id)
    return Promise.resolve()
  },
}

export const invoiceService = {
  async list(userId: string): Promise<Invoice[]> {
    if (MOCK_ENABLED) return mockInvoices.list(userId)
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('user_id', userId)
      .order('month', { ascending: false })
    if (error) throw error
    return data as Invoice[]
  },

  async upsert(userId: string, invoiceData: InvoiceCreate): Promise<Invoice> {
    if (MOCK_ENABLED) return mockInvoices.upsert(userId, invoiceData)
    const { data, error } = await supabase
      .from('invoices')
      .upsert(
        { ...invoiceData, user_id: userId },
        { onConflict: 'card_id,month', ignoreDuplicates: false }
      )
      .select()
      .single()
    if (error) throw error
    return data as Invoice
  },

  async togglePaid(id: string, paid: boolean): Promise<Invoice> {
    if (MOCK_ENABLED) return mockInvoices.togglePaid(id, paid)
    const { data, error } = await supabase
      .from('invoices')
      .update({ paid })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data as Invoice
  },

  async remove(id: string): Promise<void> {
    if (MOCK_ENABLED) return mockInvoices.remove(id)
    const { error } = await supabase.from('invoices').delete().eq('id', id)
    if (error) throw error
  },
}
