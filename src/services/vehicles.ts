import type { RichVehicleSale, Vehicle, VehicleCreate, VehicleSale, VehicleSaleCreate } from '@/domain'
import { supabase } from '@/lib/supabase'
import { createMockStorage } from './mock/storage'

const MOCK_ENABLED = import.meta.env.VITE_MOCK_DATA === 'true'
const MOCK_USER_ID = 'mock-00000000-0000-0000-0000-000000000001'

const vehicleStorage = createMockStorage<Vehicle>('fintrack-vehicles')
const saleStorage = createMockStorage<VehicleSale>('fintrack-vehicle-sales')

if (MOCK_ENABLED) {
  vehicleStorage.seed([
    { id: 'mock-v-1', user_id: MOCK_USER_ID, name: 'Intruder 2007', purchase_price: 4500, purchase_date: null, status: 'active', notes: null, created_at: '2026-01-01' },
    { id: 'mock-v-2', user_id: MOCK_USER_ID, name: 'Twister 2008', purchase_price: 8000, purchase_date: null, status: 'active', notes: null, created_at: '2026-01-02' },
    { id: 'mock-v-3', user_id: MOCK_USER_ID, name: 'Titan 1997', purchase_price: 3000, purchase_date: null, status: 'receivable', notes: null, created_at: '2025-06-01' },
    { id: 'mock-v-4', user_id: MOCK_USER_ID, name: 'Hayabusa 2007', purchase_price: 28000, purchase_date: null, status: 'sold', notes: null, created_at: '2024-01-01' },
  ])
  saleStorage.seed([
    {
      id: 'mock-s-1', user_id: MOCK_USER_ID, vehicle_id: 'mock-v-3',
      total_sale_price: 6000, cash_amount: 0, installments_count: 12,
      installments_amount: 500, installments_paid: 9,
      trade_description: null, trade_value: 0, notes: null,
      sale_date: '2025-06-01', completed: false, created_at: '2025-06-01',
    },
    {
      id: 'mock-s-2', user_id: MOCK_USER_ID, vehicle_id: 'mock-v-4',
      total_sale_price: 30500, cash_amount: 30500, installments_count: 0,
      installments_amount: 0, installments_paid: 0,
      trade_description: null, trade_value: 0, notes: '500 comissão Dionísio',
      sale_date: '2024-03-01', completed: true, created_at: '2024-03-01',
    },
  ])
}

function buildRichSale(sale: VehicleSale): RichVehicleSale {
  const vehicle = vehicleStorage.list().find((v) => v.id === sale.vehicle_id)!
  return { ...sale, vehicle }
}

export const vehicleService = {
  async list(userId: string): Promise<Vehicle[]> {
    if (MOCK_ENABLED) {
      return Promise.resolve(vehicleStorage.list().filter((v) => v.user_id === userId))
    }
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data as Vehicle[]
  },

  async create(userId: string, data: VehicleCreate): Promise<Vehicle> {
    if (MOCK_ENABLED) {
      return Promise.resolve(vehicleStorage.create({ ...data, user_id: userId }))
    }
    const { data: row, error } = await supabase
      .from('vehicles')
      .insert({ ...data, user_id: userId })
      .select()
      .single()
    if (error) throw error
    return row as Vehicle
  },

  async update(id: string, data: Partial<VehicleCreate>): Promise<Vehicle> {
    if (MOCK_ENABLED) {
      return Promise.resolve(vehicleStorage.update(id, data))
    }
    const { data: row, error } = await supabase
      .from('vehicles')
      .update(data)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return row as Vehicle
  },

  async remove(id: string): Promise<void> {
    if (MOCK_ENABLED) { vehicleStorage.remove(id); return Promise.resolve() }
    const { error } = await supabase.from('vehicles').delete().eq('id', id)
    if (error) throw error
  },
}

export const vehicleSaleService = {
  async list(userId: string): Promise<RichVehicleSale[]> {
    if (MOCK_ENABLED) {
      return Promise.resolve(
        saleStorage.list()
          .filter((s) => s.user_id === userId)
          .map(buildRichSale)
      )
    }
    const { data, error } = await supabase
      .from('vehicle_sales')
      .select('*, vehicle:vehicles(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data as unknown as Array<VehicleSale & { vehicle: Vehicle }>).map((row) => ({
      ...row,
      vehicle: row.vehicle,
    }))
  },

  async create(userId: string, saleData: VehicleSaleCreate): Promise<VehicleSale> {
    if (MOCK_ENABLED) {
      const sale = saleStorage.create({ ...saleData, user_id: userId })
      vehicleStorage.update(saleData.vehicle_id, {
        status: saleData.installments_count > 0 ? 'receivable' : 'sold',
      })
      return Promise.resolve(sale)
    }
    const newStatus = saleData.installments_count > 0 ? 'receivable' : 'sold'
    const { data: row, error } = await supabase
      .from('vehicle_sales')
      .insert({ ...saleData, user_id: userId })
      .select()
      .single()
    if (error) throw error
    const { error: vErr } = await supabase
      .from('vehicles')
      .update({ status: newStatus })
      .eq('id', saleData.vehicle_id)
    if (vErr) throw vErr
    return row as VehicleSale
  },

  async markInstallmentPaid(sale: RichVehicleSale): Promise<void> {
    const newPaid = sale.installments_paid + 1
    const nowCompleted = newPaid >= sale.installments_count

    if (MOCK_ENABLED) {
      saleStorage.update(sale.id, { installments_paid: newPaid, completed: nowCompleted })
      if (nowCompleted) vehicleStorage.update(sale.vehicle_id, { status: 'sold' })
      return Promise.resolve()
    }
    const { error: sErr } = await supabase
      .from('vehicle_sales')
      .update({ installments_paid: newPaid, completed: nowCompleted })
      .eq('id', sale.id)
    if (sErr) throw sErr
    if (nowCompleted) {
      const { error: vErr } = await supabase
        .from('vehicles')
        .update({ status: 'sold' })
        .eq('id', sale.vehicle_id)
      if (vErr) throw vErr
    }
  },

  async update(id: string, data: Partial<Omit<VehicleSale, 'id' | 'user_id' | 'vehicle_id' | 'created_at'>>): Promise<VehicleSale> {
    if (MOCK_ENABLED) {
      return Promise.resolve(saleStorage.update(id, data))
    }
    const { data: row, error } = await supabase
      .from('vehicle_sales')
      .update(data)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return row as VehicleSale
  },

  async remove(saleId: string, vehicleId: string): Promise<void> {
    if (MOCK_ENABLED) {
      saleStorage.remove(saleId)
      vehicleStorage.update(vehicleId, { status: 'active' })
      return Promise.resolve()
    }
    const { error } = await supabase.from('vehicle_sales').delete().eq('id', saleId)
    if (error) throw error
    const { error: vErr } = await supabase
      .from('vehicles')
      .update({ status: 'active' })
      .eq('id', vehicleId)
    if (vErr) throw vErr
  },
}
