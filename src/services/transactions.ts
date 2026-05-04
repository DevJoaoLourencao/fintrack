import type { ActiveSubscription, Transaction, TransactionCreate } from '@/domain'
import { supabase } from '@/lib/supabase'

export const transactionService = {
  async list(userId: string): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data as Transaction[]
  },

  async listRecurring(userId: string): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_recurring', true)
    if (error) throw error
    return data as Transaction[]
  },

  async create(userId: string, data: TransactionCreate): Promise<Transaction> {
    const { data: row, error } = await supabase
      .from('transactions')
      .insert({ ...data, user_id: userId })
      .select()
      .single()
    if (error) throw error
    return row as Transaction
  },

  async update(id: string, data: Partial<Pick<Transaction, 'description' | 'category_id' | 'total_installments' | 'total_amount' | 'purchase_date'>>): Promise<Transaction> {
    const { data: row, error } = await supabase
      .from('transactions')
      .update(data)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return row as Transaction
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('transactions').delete().eq('id', id)
    if (error) throw error
  },

  async listSubscriptions(userId: string): Promise<ActiveSubscription[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('id, description, total_amount')
      .eq('user_id', userId)
      .eq('type', 'subscription')
      .order('description')
    if (error) throw error
    return (data as { id: string; description: string; total_amount: number }[]).map((t) => ({
      transactionId: t.id,
      description: t.description,
      monthlyAmount: t.total_amount,
    }))
  },
}
