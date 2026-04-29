export type PersonalAssetCategory =
  | 'imovel'
  | 'veiculo'
  | 'outros'

export interface PersonalAsset {
  id: string
  user_id: string
  name: string
  category: PersonalAssetCategory
  purchase_value: number
  current_value: number | null
  notes: string | null
  created_at: string
}

export type PersonalAssetCreate = Omit<PersonalAsset, 'id' | 'user_id' | 'created_at'>
