import { supabase } from '@/lib/supabase'

export interface PortfolioNote {
  id: string
  user_id: string
  content: string
  created_at: string
}

export const portfolioNotesService = {
  async list(userId: string): Promise<PortfolioNote[]> {
    const { data, error } = await supabase
      .from('portfolio_notes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data as PortfolioNote[]
  },

  async create(userId: string, content: string): Promise<PortfolioNote> {
    const { data, error } = await supabase
      .from('portfolio_notes')
      .insert({ user_id: userId, content })
      .select()
      .single()
    if (error) throw error
    return data as PortfolioNote
  },

  async update(id: string, content: string): Promise<void> {
    const { error } = await supabase.from('portfolio_notes').update({ content }).eq('id', id)
    if (error) throw error
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('portfolio_notes').delete().eq('id', id)
    if (error) throw error
  },
}
