import type { InvestmentSnapshot, InvestmentSnapshotCreate, InvestmentAsset, InvestmentAssetCreate, InvestmentSnapshotItem } from '@/domain'
import { supabase } from '@/lib/supabase'

export const investmentService = {
  async list(userId: string): Promise<InvestmentSnapshot[]> {
    const { data, error } = await supabase
      .from('investment_snapshots')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data as InvestmentSnapshot[]
  },

  async create(userId: string, data: InvestmentSnapshotCreate): Promise<InvestmentSnapshot> {
    const { data: row, error } = await supabase
      .from('investment_snapshots')
      .insert({ ...data, user_id: userId })
      .select()
      .single()
    if (error) throw error
    return row as InvestmentSnapshot
  },

  async update(id: string, data: Partial<InvestmentSnapshotCreate>): Promise<InvestmentSnapshot> {
    const { data: row, error } = await supabase
      .from('investment_snapshots')
      .update(data)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return row as InvestmentSnapshot
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('investment_snapshots').delete().eq('id', id)
    if (error) throw error
  },

  async createSnapshotItems(snapshotId: string, userId: string, assets: InvestmentAsset[], quoteMap?: Map<string, number>): Promise<void> {
    if (assets.length === 0) return
    const items = assets.map((a) => {
      const livePrice = quoteMap?.get(a.name.toUpperCase().trim())
      const market_price = livePrice != null
        ? livePrice
        : (a.quantity && a.quantity > 0 ? a.amount / a.quantity : null)
      return {
        snapshot_id: snapshotId,
        user_id: userId,
        name: a.name,
        category: a.category,
        amount: a.amount,
        currency: a.currency,
        quantity: a.quantity ?? null,
        avg_price: a.avg_price ?? null,
        market_price,
      }
    })
    const { error } = await supabase.from('investment_snapshot_items').insert(items)
    if (error) throw error
  },

  async listSnapshotItems(userId: string): Promise<InvestmentSnapshotItem[]> {
    const { data, error } = await supabase
      .from('investment_snapshot_items')
      .select('*')
      .eq('user_id', userId)
      .order('amount', { ascending: false })
    if (error) throw error
    return data as InvestmentSnapshotItem[]
  },
}

export const investmentAssetService = {
  async list(userId: string): Promise<InvestmentAsset[]> {
    const { data, error } = await supabase
      .from('investment_assets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
    if (error) throw error
    return data as InvestmentAsset[]
  },

  async create(userId: string, data: InvestmentAssetCreate): Promise<InvestmentAsset> {
    const { data: row, error } = await supabase
      .from('investment_assets')
      .insert({ ...data, user_id: userId })
      .select()
      .single()
    if (error) throw error
    return row as InvestmentAsset
  },

  async update(id: string, data: Partial<InvestmentAssetCreate>): Promise<InvestmentAsset> {
    const { data: row, error } = await supabase
      .from('investment_assets')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return row as InvestmentAsset
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('investment_assets').delete().eq('id', id)
    if (error) throw error
  },
}
