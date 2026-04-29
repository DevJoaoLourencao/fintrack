import type { Card, CardCreate } from '@/domain'
import { supabase } from '@/lib/supabase'
import { createMockStorage } from './mock/storage'

const MOCK_ENABLED = import.meta.env.VITE_MOCK_DATA === 'true'
const MOCK_USER_ID = 'mock-00000000-0000-0000-0000-000000000001'

const storage = createMockStorage<Card>('fintrack-cards')

if (MOCK_ENABLED) {
  storage.seed([
    { id: 'mock-card-1', user_id: MOCK_USER_ID, name: 'Nubank', last_four: '1234', color: '#8B5CF6', closing_day: 3, due_day: 10 },
    { id: 'mock-card-2', user_id: MOCK_USER_ID, name: 'Inter', last_four: '5678', color: '#F97316', closing_day: 20, due_day: 27 },
  ])
}

const mockCards = {
  async list(userId: string): Promise<Card[]> {
    return Promise.resolve(storage.list().filter((c) => c.user_id === userId))
  },
  async create(userId: string, data: CardCreate): Promise<Card> {
    return Promise.resolve(storage.create({ ...data, user_id: userId }))
  },
  async update(id: string, data: Partial<CardCreate>): Promise<Card> {
    return Promise.resolve(storage.update(id, data))
  },
  async remove(id: string): Promise<void> {
    storage.remove(id)
    return Promise.resolve()
  },
}

export const cardService = {
  async list(userId: string): Promise<Card[]> {
    if (MOCK_ENABLED) return mockCards.list(userId)
    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .eq('user_id', userId)
      .order('created_at')
    if (error) throw error
    return data as Card[]
  },

  async create(userId: string, data: CardCreate): Promise<Card> {
    if (MOCK_ENABLED) return mockCards.create(userId, data)
    const { data: row, error } = await supabase
      .from('cards')
      .insert({ ...data, user_id: userId })
      .select()
      .single()
    if (error) throw error
    return row as Card
  },

  async update(id: string, data: Partial<CardCreate>): Promise<Card> {
    if (MOCK_ENABLED) return mockCards.update(id, data)
    const { data: row, error } = await supabase
      .from('cards')
      .update(data)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return row as Card
  },

  async remove(id: string): Promise<void> {
    if (MOCK_ENABLED) return mockCards.remove(id)
    const { error } = await supabase.from('cards').delete().eq('id', id)
    if (error) throw error
  },
}
