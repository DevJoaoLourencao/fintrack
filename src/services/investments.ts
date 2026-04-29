import type { InvestmentSnapshot, InvestmentSnapshotCreate, InvestmentAsset, InvestmentAssetCreate } from '@/domain'
import { supabase } from '@/lib/supabase'
import { createMockStorage } from './mock/storage'

const MOCK_ENABLED = import.meta.env.VITE_MOCK_DATA === 'true'
const MOCK_USER_ID = 'mock-00000000-0000-0000-0000-000000000001'

const storage = createMockStorage<InvestmentSnapshot>('fintrack-investment-snapshots')

if (MOCK_ENABLED) {
  storage.seed([
    {
      id: 'mock-inv-1', user_id: MOCK_USER_ID, date: '2025-09-05',
      acoes: 17000, fiis: 13000, cripto: 4800, internacional: 9605, renda_fixa: 123000,
      notes: null, usd_rate: 5.42, created_at: '2025-09-05',
    },
    {
      id: 'mock-inv-2', user_id: MOCK_USER_ID, date: '2025-12-24',
      acoes: 21382, fiis: 16888, cripto: 5090, internacional: 11483, renda_fixa: 141000,
      notes: null, usd_rate: 6.18, created_at: '2025-12-24',
    },
    {
      id: 'mock-inv-3', user_id: MOCK_USER_ID, date: '2026-02-08',
      acoes: 24691, fiis: 17724, cripto: 4424, internacional: 12542, renda_fixa: 40288,
      notes: null, usd_rate: 5.87, created_at: '2026-02-08',
    },
  ])
}

export const investmentService = {
  async list(userId: string): Promise<InvestmentSnapshot[]> {
    if (MOCK_ENABLED) {
      return Promise.resolve(
        storage.list()
          .filter((s) => s.user_id === userId)
          .sort((a, b) => b.date.localeCompare(a.date))
      )
    }
    const { data, error } = await supabase
      .from('investment_snapshots')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
    if (error) throw error
    return data as InvestmentSnapshot[]
  },

  async create(userId: string, data: InvestmentSnapshotCreate): Promise<InvestmentSnapshot> {
    if (MOCK_ENABLED) {
      return Promise.resolve(storage.create({ ...data, user_id: userId }))
    }
    const { data: row, error } = await supabase
      .from('investment_snapshots')
      .insert({ ...data, user_id: userId })
      .select()
      .single()
    if (error) throw error
    return row as InvestmentSnapshot
  },

  async update(id: string, data: Partial<InvestmentSnapshotCreate>): Promise<InvestmentSnapshot> {
    if (MOCK_ENABLED) {
      return Promise.resolve(storage.update(id, data))
    }
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
    if (MOCK_ENABLED) { storage.remove(id); return Promise.resolve() }
    const { error } = await supabase.from('investment_snapshots').delete().eq('id', id)
    if (error) throw error
  },
}

const assetStorage = createMockStorage<InvestmentAsset>('fintrack-investment-assets')

if (MOCK_ENABLED) {
  assetStorage.seed([
    {
      id: 'mock-asset-1', user_id: MOCK_USER_ID, category: 'acoes', name: 'PETR4',
      amount: 8500, currency: 'BRL', notes: null, created_at: '2026-01-10T00:00:00Z', updated_at: '2026-01-10T00:00:00Z',
    },
    {
      id: 'mock-asset-2', user_id: MOCK_USER_ID, category: 'acoes', name: 'VALE3',
      amount: 6200, currency: 'BRL', notes: null, created_at: '2026-01-10T00:00:00Z', updated_at: '2026-01-10T00:00:00Z',
    },
    {
      id: 'mock-asset-3', user_id: MOCK_USER_ID, category: 'fiis', name: 'MXRF11',
      amount: 12400, currency: 'BRL', notes: 'Fundo de papel', created_at: '2026-01-12T00:00:00Z', updated_at: '2026-01-12T00:00:00Z',
    },
    {
      id: 'mock-asset-4', user_id: MOCK_USER_ID, category: 'cripto', name: 'BTC',
      amount: 1200, currency: 'USD', notes: null, created_at: '2026-01-15T00:00:00Z', updated_at: '2026-01-15T00:00:00Z',
    },
    {
      id: 'mock-asset-5', user_id: MOCK_USER_ID, category: 'internacional', name: 'VOO',
      amount: 2500, currency: 'USD', notes: 'ETF S&P 500', created_at: '2026-01-20T00:00:00Z', updated_at: '2026-01-20T00:00:00Z',
    },
    {
      id: 'mock-asset-6', user_id: MOCK_USER_ID, category: 'renda_fixa', name: 'LCI Banco Inter',
      amount: 40000, currency: 'BRL', notes: 'Vence 2027', created_at: '2026-02-01T00:00:00Z', updated_at: '2026-02-01T00:00:00Z',
    },
  ])
}

export const investmentAssetService = {
  async list(userId: string): Promise<InvestmentAsset[]> {
    if (MOCK_ENABLED) {
      return Promise.resolve(
        assetStorage.list().filter((a) => a.user_id === userId)
      )
    }
    const { data, error } = await supabase
      .from('investment_assets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
    if (error) throw error
    return data as InvestmentAsset[]
  },

  async create(userId: string, data: InvestmentAssetCreate): Promise<InvestmentAsset> {
    if (MOCK_ENABLED) {
      const now = new Date().toISOString()
      return Promise.resolve(assetStorage.create({ ...data, user_id: userId, created_at: now, updated_at: now }))
    }
    const { data: row, error } = await supabase
      .from('investment_assets')
      .insert({ ...data, user_id: userId })
      .select()
      .single()
    if (error) throw error
    return row as InvestmentAsset
  },

  async update(id: string, data: Partial<InvestmentAssetCreate>): Promise<InvestmentAsset> {
    if (MOCK_ENABLED) {
      return Promise.resolve(assetStorage.update(id, { ...data, updated_at: new Date().toISOString() }))
    }
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
    if (MOCK_ENABLED) { assetStorage.remove(id); return Promise.resolve() }
    const { error } = await supabase.from('investment_assets').delete().eq('id', id)
    if (error) throw error
  },
}
