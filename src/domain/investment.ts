export interface InvestmentSnapshot {
  id: string
  user_id: string
  date: string
  acoes: number
  fiis: number
  cripto: number
  internacional: number
  renda_fixa: number
  reserva_oportunidade: number
  notes: string | null
  usd_rate: number | null
  created_at: string
}

export type InvestmentSnapshotCreate = Omit<InvestmentSnapshot, 'id' | 'user_id' | 'created_at'>

export type AssetCategory = 'acoes' | 'fiis' | 'cripto' | 'internacional' | 'renda_fixa' | 'reserva_oportunidade'

export type AssetCurrency = 'BRL' | 'USD'

export interface InvestmentAsset {
  id: string
  user_id: string
  category: AssetCategory
  name: string
  amount: number
  quantity: number | null
  avg_price: number | null
  currency: AssetCurrency
  notes: string | null
  dividendo_anual: number | null
  dy_manual: number | null
  lpa: number | null
  vpa: number | null
  created_at: string
  updated_at: string
}

export type InvestmentAssetCreate = Omit<InvestmentAsset, 'id' | 'user_id' | 'created_at' | 'updated_at'>

export interface AllocationTarget {
  id: string
  user_id: string
  category: AssetCategory
  target_pct: number
  created_at: string
}

export interface InvestmentSnapshotItem {
  id: string
  snapshot_id: string
  user_id: string
  name: string
  category: AssetCategory
  amount: number
  currency: AssetCurrency
  quantity: number | null
  avg_price: number | null
  market_price: number | null
  created_at: string
}
