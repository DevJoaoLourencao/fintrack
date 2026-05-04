import type { PersonalAsset, PersonalAssetCreate } from '@/domain'
import { supabase } from '@/lib/supabase'

export const personalAssetService = {
  async list(userId: string): Promise<PersonalAsset[]> {
    const { data, error } = await supabase
      .from('personal_assets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data as PersonalAsset[]
  },

  async create(userId: string, data: PersonalAssetCreate): Promise<PersonalAsset> {
    const { data: row, error } = await supabase
      .from('personal_assets')
      .insert({ ...data, user_id: userId })
      .select()
      .single()
    if (error) throw error
    return row as PersonalAsset
  },

  async update(id: string, data: Partial<PersonalAssetCreate>): Promise<PersonalAsset> {
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
    const { error } = await supabase.from('personal_assets').delete().eq('id', id)
    if (error) throw error
  },
}
