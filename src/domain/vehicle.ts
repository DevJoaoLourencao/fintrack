export type VehicleStatus = 'active' | 'receivable' | 'sold'

export interface Vehicle {
  id: string
  user_id: string
  name: string
  purchase_price: number
  purchase_date: string | null
  status: VehicleStatus
  notes: string | null
  created_at: string
}

export type VehicleCreate = Omit<Vehicle, 'id' | 'user_id' | 'created_at'>

export interface VehicleSale {
  id: string
  user_id: string
  vehicle_id: string
  total_sale_price: number
  cash_amount: number
  installments_count: number
  installments_amount: number
  installments_paid: number
  trade_description: string | null
  trade_value: number
  notes: string | null
  sale_date: string | null
  completed: boolean
  created_at: string
}

export type VehicleSaleCreate = Omit<VehicleSale, 'id' | 'user_id' | 'created_at'>

export interface RichVehicleSale extends VehicleSale {
  vehicle: Vehicle
}
