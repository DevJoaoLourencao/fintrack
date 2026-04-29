export interface InvestmentSnapshot {
  id: string
  user_id: string
  date: string
  acoes: number
  fiis: number
  cripto: number
  internacional: number
  renda_fixa: number
  notes: string | null
  usd_rate: number | null
  created_at: string
}

export type InvestmentSnapshotCreate = Omit<InvestmentSnapshot, 'id' | 'user_id' | 'created_at'>

export type AssetCategory = 'acoes' | 'fiis' | 'cripto' | 'internacional' | 'renda_fixa'

export type AssetCurrency = 'BRL' | 'USD'

export interface InvestmentAsset {
  id: string
  user_id: string
  category: AssetCategory
  name: string
  amount: number
  currency: AssetCurrency
  notes: string | null
  created_at: string
  updated_at: string
}

export type InvestmentAssetCreate = Omit<InvestmentAsset, 'id' | 'user_id' | 'created_at' | 'updated_at'>
