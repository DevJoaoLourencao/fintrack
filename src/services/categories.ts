import type { Category, CategoryCreate } from '@/domain'
import { supabase } from '@/lib/supabase'

export const categoryService = {
  async list(userId: string): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId)
      .order('created_at')
    if (error) throw error
    return data as Category[]
  },

  async create(userId: string, data: CategoryCreate): Promise<Category> {
    const { data: row, error } = await supabase
      .from('categories')
      .insert({ ...data, user_id: userId })
      .select()
      .single()
    if (error) throw error
    return row as Category
  },

  async update(id: string, data: Partial<CategoryCreate>): Promise<Category> {
    const { data: row, error } = await supabase
      .from('categories')
      .update(data)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return row as Category
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) throw error
  },
}
