import type { Card, CardCreate } from '@/domain'
import { supabase } from '@/lib/supabase'

export const cardService = {
  async list(userId: string): Promise<Card[]> {
    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .eq('user_id', userId)
      .order('created_at')
    if (error) throw error
    return data as Card[]
  },

  async create(userId: string, data: CardCreate): Promise<Card> {
    const { data: row, error } = await supabase
      .from('cards')
      .insert({ ...data, user_id: userId })
      .select()
      .single()
    if (error) throw error
    return row as Card
  },

  async update(id: string, data: Partial<CardCreate>): Promise<Card> {
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
    const { error } = await supabase.from('cards').delete().eq('id', id)
    if (error) throw error
  },
}
