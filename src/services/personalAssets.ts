import type { PersonalAsset, PersonalAssetCreate } from '@/domain'
import { supabase } from '@/lib/supabase'
import { createMockStorage } from './mock/storage'

const MOCK_ENABLED = import.meta.env.VITE_MOCK_DATA === 'true'
const MOCK_USER_ID = 'mock-00000000-0000-0000-0000-000000000001'

const storage = createMockStorage<PersonalAsset>('fintrack-personal-assets')

if (MOCK_ENABLED) {
  storage.seed([
    {
      id: 'mock-pa-1', user_id: MOCK_USER_ID,
      name: 'Apartamento Centro', category: 'imovel',
      purchase_value: 320000, current_value: 380000,
      notes: null, created_at: '2022-03-10T00:00:00Z',
    },
    {
      id: 'mock-pa-2', user_id: MOCK_USER_ID,
      name: 'Honda Civic 2022', category: 'veiculo',
      purchase_value: 95000, current_value: 82000,
      notes: null, created_at: '2022-08-01T00:00:00Z',
    },
    {
      id: 'mock-pa-3', user_id: MOCK_USER_ID,
      name: 'Notebook Dell', category: 'outros',
      purchase_value: 7500, current_value: null,
      notes: null, created_at: '2023-05-15T00:00:00Z',
    },
  ])
}

export const personalAssetService = {
  async list(userId: string): Promise<PersonalAsset[]> {
    if (MOCK_ENABLED) {
      return Promise.resolve(
        storage.list()
          .filter((a) => a.user_id === userId)
          .sort((a, b) => b.created_at.localeCompare(a.created_at))
      )
    }
    const { data, error } = await supabase
      .from('personal_assets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data as PersonalAsset[]
  },

  async create(userId: string, data: PersonalAssetCreate): Promise<PersonalAsset> {
    if (MOCK_ENABLED) {
      return Promise.resolve(
        storage.create({ ...data, user_id: userId, created_at: new Date().toISOString() })
      )
    }
    const { data: row, error } = await supabase
      .from('personal_assets')
      .insert({ ...data, user_id: userId })
      .select()
      .single()
    if (error) throw error
    return row as PersonalAsset
  },

  async update(id: string, data: Partial<PersonalAssetCreate>): Promise<PersonalAsset> {
    if (MOCK_ENABLED) {
      return Promise.resolve(storage.update(id, data))
    }
    const { data: row, error } = await supabase
      .from('personal_assets')
      .update(data)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return row as PersonalAsset
  },

  async remove(id: string): Promise<void> {
    if (MOCK_ENABLED) { storage.remove(id); return Promise.resolve() }
    const { error } = await supabase.from('personal_assets').delete().eq('id', id)
    if (error) throw error
  },
}
