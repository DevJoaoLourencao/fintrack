import type { AllocationTarget, AssetCategory } from '@/domain'
import { supabase } from '@/lib/supabase'

export const allocationTargetService = {
  async list(userId: string): Promise<AllocationTarget[]> {
    const { data, error } = await supabase
      .from('allocation_targets')
      .select('*')
      .eq('user_id', userId)
    if (error) throw error
    return data as AllocationTarget[]
  },

  async upsertAll(userId: string, targets: { category: AssetCategory; target_pct: number }[]): Promise<void> {
    const rows = targets.map((t) => ({ user_id: userId, category: t.category, target_pct: t.target_pct }))
    const { error } = await supabase
      .from('allocation_targets')
      .upsert(rows, { onConflict: 'user_id,category' })
    if (error) throw error
  },
}
