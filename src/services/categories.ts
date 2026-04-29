import type { Category, CategoryCreate } from '@/domain'
import { supabase } from '@/lib/supabase'
import { createMockStorage } from './mock/storage'

const MOCK_ENABLED = import.meta.env.VITE_MOCK_DATA === 'true'
const MOCK_USER_ID = 'mock-00000000-0000-0000-0000-000000000001'

const storage = createMockStorage<Category>('fintrack-categories')

if (MOCK_ENABLED) {
  storage.seed([
    { id: 'mock-cat-1', user_id: MOCK_USER_ID, name: 'Alimentação', color: '#22C55E', icon: 'CookingPotIcon' },
    { id: 'mock-cat-2', user_id: MOCK_USER_ID, name: 'Transporte', color: '#3B82F6', icon: 'CarIcon' },
    { id: 'mock-cat-3', user_id: MOCK_USER_ID, name: 'Lazer', color: '#EC4899', icon: 'StarIcon' },
  ])
}

const mockCategories = {
  async list(userId: string): Promise<Category[]> {
    return Promise.resolve(storage.list().filter((c) => c.user_id === userId))
  },
  async create(userId: string, data: CategoryCreate): Promise<Category> {
    return Promise.resolve(storage.create({ ...data, user_id: userId }))
  },
  async update(id: string, data: Partial<CategoryCreate>): Promise<Category> {
    return Promise.resolve(storage.update(id, data))
  },
  async remove(id: string): Promise<void> {
    storage.remove(id)
    return Promise.resolve()
  },
}

export const categoryService = {
  async list(userId: string): Promise<Category[]> {
    if (MOCK_ENABLED) return mockCategories.list(userId)
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId)
      .order('created_at')
    if (error) throw error
    return data as Category[]
  },

  async create(userId: string, data: CategoryCreate): Promise<Category> {
    if (MOCK_ENABLED) return mockCategories.create(userId, data)
    const { data: row, error } = await supabase
      .from('categories')
      .insert({ ...data, user_id: userId })
      .select()
      .single()
    if (error) throw error
    return row as Category
  },

  async update(id: string, data: Partial<CategoryCreate>): Promise<Category> {
    if (MOCK_ENABLED) return mockCategories.update(id, data)
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
    if (MOCK_ENABLED) return mockCategories.remove(id)
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) throw error
  },
}
