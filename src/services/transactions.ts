import type { ActiveSubscription, Transaction, TransactionCreate } from '@/domain'
import { supabase } from '@/lib/supabase'
import { createMockStorage } from './mock/storage'

const MOCK_ENABLED = import.meta.env.VITE_MOCK_DATA === 'true'
const MOCK_USER_ID = 'mock-00000000-0000-0000-0000-000000000001'

const storage = createMockStorage<Transaction>('fintrack-transactions')

if (MOCK_ENABLED) {
  storage.seed([
    {
      id: 'mock-tx-1',
      user_id: MOCK_USER_ID,
      card_id: 'mock-card-1',
      category_id: 'mock-cat-1',
      description: 'Supermercado',
      total_amount: 300,
      type: 'credit_card',
      total_installments: 3,
      purchase_date: '2026-04-05',
      is_recurring: false,
    },
    {
      id: 'mock-tx-2',
      user_id: MOCK_USER_ID,
      card_id: null,
      category_id: 'mock-cat-2',
      description: 'Uber',
      total_amount: 45,
      type: 'recurring',
      total_installments: 1,
      purchase_date: '2026-04-10',
      is_recurring: false,
    },
    {
      id: 'mock-tx-3',
      user_id: MOCK_USER_ID,
      card_id: 'mock-card-1',
      category_id: 'mock-cat-2',
      description: 'Netflix',
      total_amount: 39.9,
      type: 'subscription',
      total_installments: 1,
      purchase_date: '2026-01-01',
      is_recurring: true,
    },
    {
      id: 'mock-tx-4',
      user_id: MOCK_USER_ID,
      card_id: null,
      category_id: 'mock-cat-2',
      description: 'Spotify',
      total_amount: 21.9,
      type: 'subscription',
      total_installments: 1,
      purchase_date: '2026-01-01',
      is_recurring: true,
    },
  ])
}

const mockTransactions = {
  async list(userId: string): Promise<Transaction[]> {
    return Promise.resolve(storage.list().filter((t) => t.user_id === userId))
  },
  async listRecurring(userId: string): Promise<Transaction[]> {
    return Promise.resolve(storage.list().filter((t) => t.user_id === userId && t.is_recurring))
  },
  async create(userId: string, data: TransactionCreate): Promise<Transaction> {
    return Promise.resolve(storage.create({ ...data, user_id: userId }))
  },
  async update(id: string, data: Partial<Pick<Transaction, 'description' | 'category_id' | 'total_installments' | 'total_amount' | 'purchase_date'>>): Promise<Transaction> {
    return Promise.resolve(storage.update(id, data))
  },
  async remove(id: string): Promise<void> {
    storage.remove(id)
    return Promise.resolve()
  },
}

export const transactionService = {
  async list(userId: string): Promise<Transaction[]> {
    if (MOCK_ENABLED) return mockTransactions.list(userId)
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data as Transaction[]
  },

  async listRecurring(userId: string): Promise<Transaction[]> {
    if (MOCK_ENABLED) return mockTransactions.listRecurring(userId)
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_recurring', true)
    if (error) throw error
    return data as Transaction[]
  },

  async create(userId: string, data: TransactionCreate): Promise<Transaction> {
    if (MOCK_ENABLED) return mockTransactions.create(userId, data)
    const { data: row, error } = await supabase
      .from('transactions')
      .insert({ ...data, user_id: userId })
      .select()
      .single()
    if (error) throw error
    return row as Transaction
  },

  async update(id: string, data: Partial<Pick<Transaction, 'description' | 'category_id' | 'total_installments' | 'total_amount' | 'purchase_date'>>): Promise<Transaction> {
    if (MOCK_ENABLED) return mockTransactions.update(id, data)
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
    if (MOCK_ENABLED) return mockTransactions.remove(id)
    const { error } = await supabase.from('transactions').delete().eq('id', id)
    if (error) throw error
  },

  async listSubscriptions(userId: string): Promise<ActiveSubscription[]> {
    if (MOCK_ENABLED) {
      return Promise.resolve(
        storage
          .list()
          .filter((t) => t.user_id === userId && t.type === 'subscription')
          .map((t) => ({ transactionId: t.id, description: t.description, monthlyAmount: t.total_amount }))
      )
    }
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
