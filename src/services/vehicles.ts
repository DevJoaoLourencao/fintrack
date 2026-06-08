import type { RichVehicleSale, Vehicle, VehicleCreate, VehicleSale, VehicleSaleCreate } from '@/domain'
import { supabase } from '@/lib/supabase'

export const vehicleService = {
  async list(userId: string): Promise<Vehicle[]> {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data as Vehicle[]
  },

  async create(userId: string, data: VehicleCreate): Promise<Vehicle> {
    const { data: row, error } = await supabase
      .from('vehicles')
      .insert({ ...data, user_id: userId })
      .select()
      .single()
    if (error) throw error
    return row as Vehicle
  },

  async update(id: string, data: Partial<VehicleCreate>): Promise<Vehicle> {
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
    const { error } = await supabase.from('vehicles').delete().eq('id', id)
    if (error) throw error
  },
}

export const vehicleSaleService = {
  async list(userId: string): Promise<RichVehicleSale[]> {
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
    const { data: row, error } = await supabase
      .from('vehicle_sales')
      .update(data)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return row as VehicleSale
  },

  async addExtraPayment(saleId: string, currentExtraPaid: number, amount: number): Promise<void> {
    const { error } = await supabase
      .from('vehicle_sales')
      .update({ extra_paid: currentExtraPaid + amount })
      .eq('id', saleId)
    if (error) throw error
  },

  async remove(saleId: string, vehicleId: string): Promise<void> {
    const { error } = await supabase.from('vehicle_sales').delete().eq('id', saleId)
    if (error) throw error
    const { error: vErr } = await supabase
      .from('vehicles')
      .update({ status: 'active' })
      .eq('id', vehicleId)
    if (vErr) throw vErr
  },
}
