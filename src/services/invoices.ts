import type { Invoice, InvoiceCreate } from '@/domain'
import { supabase } from '@/lib/supabase'

export const invoiceService = {
  async list(userId: string): Promise<Invoice[]> {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('user_id', userId)
      .order('month', { ascending: false })
    if (error) throw error
    return data as Invoice[]
  },

  async upsert(userId: string, invoiceData: InvoiceCreate): Promise<Invoice> {
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
    const { error } = await supabase.from('invoices').delete().eq('id', id)
    if (error) throw error
  },
}
