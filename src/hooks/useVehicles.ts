import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { RichVehicleSale, VehicleCreate, VehicleSaleCreate } from '@/domain'
import { vehicleService, vehicleSaleService } from '@/services/vehicles'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/components/ui/Toast'
import { queryKeys } from './queryKeys'

export function useVehiclesQuery() {
  const userId = useAuthStore((s) => s.user!.id)
  return useQuery({
    queryKey: queryKeys.vehicles(userId),
    queryFn: () => vehicleService.list(userId),
    enabled: !!userId,
  })
}

export function useVehicleSalesQuery() {
  const userId = useAuthStore((s) => s.user!.id)
  return useQuery({
    queryKey: queryKeys.vehicleSales(userId),
    queryFn: () => vehicleSaleService.list(userId),
    enabled: !!userId,
  })
}

function useInvalidateAll() {
  const userId = useAuthStore((s) => s.user!.id)
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.vehicles(userId) })
    queryClient.invalidateQueries({ queryKey: queryKeys.vehicleSales(userId) })
  }
}

export function useAddVehicle() {
  const userId = useAuthStore((s) => s.user!.id)
  const { toast } = useToast()
  const invalidate = useInvalidateAll()

  return useMutation({
    mutationFn: (data: VehicleCreate) => vehicleService.create(userId, data),
    onSuccess: () => { invalidate(); toast({ title: 'Veículo adicionado ao estoque.' }) },
    onError: (err: Error) => toast({ title: 'Erro ao adicionar veículo', description: err.message, variant: 'destructive' }),
  })
}

export function useUpdateVehicle() {
  const { toast } = useToast()
  const invalidate = useInvalidateAll()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<VehicleCreate> }) =>
      vehicleService.update(id, data),
    onSuccess: () => { invalidate(); toast({ title: 'Veículo atualizado.' }) },
    onError: (err: Error) => toast({ title: 'Erro ao atualizar veículo', description: err.message, variant: 'destructive' }),
  })
}

export function useRemoveVehicle() {
  const { toast } = useToast()
  const invalidate = useInvalidateAll()

  return useMutation({
    mutationFn: (id: string) => vehicleService.remove(id),
    onSuccess: () => { invalidate(); toast({ title: 'Veículo removido.' }) },
    onError: (err: Error) => toast({ title: 'Erro ao remover veículo', description: err.message, variant: 'destructive' }),
  })
}

export function useSellVehicle() {
  const userId = useAuthStore((s) => s.user!.id)
  const { toast } = useToast()
  const invalidate = useInvalidateAll()

  return useMutation({
    mutationFn: (data: VehicleSaleCreate) => vehicleSaleService.create(userId, data),
    onSuccess: () => { invalidate(); toast({ title: 'Venda registrada.' }) },
    onError: (err: Error) => toast({ title: 'Erro ao registrar venda', description: err.message, variant: 'destructive' }),
  })
}

export function useUpdateVehicleSale() {
  const { toast } = useToast()
  const invalidate = useInvalidateAll()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof vehicleSaleService.update>[1] }) =>
      vehicleSaleService.update(id, data),
    onSuccess: () => { invalidate(); toast({ title: 'Venda atualizada.' }) },
    onError: (err: Error) => toast({ title: 'Erro ao atualizar venda', description: err.message, variant: 'destructive' }),
  })
}

export function useMarkInstallmentPaid() {
  const { toast } = useToast()
  const invalidate = useInvalidateAll()

  return useMutation({
    mutationFn: (sale: RichVehicleSale) => vehicleSaleService.markInstallmentPaid(sale),
    onSuccess: (_, sale) => {
      invalidate()
      const newPaid = sale.installments_paid + 1
      const done = newPaid >= sale.installments_count
      toast({ title: done ? 'Último pagamento recebido! Venda concluída.' : `Parcela ${newPaid}/${sale.installments_count} registrada.` })
    },
    onError: (err: Error) => toast({ title: 'Erro ao registrar parcela', description: err.message, variant: 'destructive' }),
  })
}

export function useUnmarkInstallmentPaid() {
  const { toast } = useToast()
  const invalidate = useInvalidateAll()

  return useMutation({
    mutationFn: (sale: RichVehicleSale) =>
      vehicleSaleService.update(sale.id, {
        installments_paid: Math.max(0, sale.installments_paid - 1),
        completed: false,
      }),
    onSuccess: (_, sale) => {
      invalidate()
      const newPaid = Math.max(0, sale.installments_paid - 1)
      toast({ title: `Parcela ${newPaid + 1} removida. Agora ${newPaid}/${sale.installments_count} pagas.` })
    },
    onError: (err: Error) => toast({ title: 'Erro ao remover parcela', description: err.message, variant: 'destructive' }),
  })
}

export function useRemoveVehicleSale() {
  const { toast } = useToast()
  const invalidate = useInvalidateAll()

  return useMutation({
    mutationFn: ({ saleId, vehicleId }: { saleId: string; vehicleId: string }) =>
      vehicleSaleService.remove(saleId, vehicleId),
    onSuccess: () => { invalidate(); toast({ title: 'Venda cancelada. Veículo voltou ao estoque.' }) },
    onError: (err: Error) => toast({ title: 'Erro ao cancelar venda', description: err.message, variant: 'destructive' }),
  })
}
