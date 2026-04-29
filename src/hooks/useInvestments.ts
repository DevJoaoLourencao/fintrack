import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { InvestmentSnapshotCreate, InvestmentAssetCreate } from '@/domain'
import { investmentService, investmentAssetService } from '@/services/investments'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/components/ui/Toast'
import { queryKeys } from './queryKeys'

export function useInvestmentSnapshotsQuery() {
  const userId = useAuthStore((s) => s.user!.id)
  return useQuery({
    queryKey: queryKeys.investmentSnapshots(userId),
    queryFn: () => investmentService.list(userId),
    enabled: !!userId,
  })
}

function useInvalidate() {
  const userId = useAuthStore((s) => s.user!.id)
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.investmentSnapshots(userId) })
}

export function useAddSnapshot() {
  const userId = useAuthStore((s) => s.user!.id)
  const { toast } = useToast()
  const invalidate = useInvalidate()

  return useMutation({
    mutationFn: (data: InvestmentSnapshotCreate) => investmentService.create(userId, data),
    onSuccess: () => { invalidate(); toast({ title: 'Snapshot registrado.' }) },
    onError: (err: Error) => toast({ title: 'Erro ao registrar snapshot', description: err.message, variant: 'destructive' }),
  })
}

export function useUpdateSnapshot() {
  const { toast } = useToast()
  const invalidate = useInvalidate()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InvestmentSnapshotCreate> }) =>
      investmentService.update(id, data),
    onSuccess: () => { invalidate(); toast({ title: 'Snapshot atualizado.' }) },
    onError: (err: Error) => toast({ title: 'Erro ao atualizar snapshot', description: err.message, variant: 'destructive' }),
  })
}

export function useRemoveSnapshot() {
  const { toast } = useToast()
  const invalidate = useInvalidate()

  return useMutation({
    mutationFn: (id: string) => investmentService.remove(id),
    onSuccess: () => { invalidate(); toast({ title: 'Snapshot removido.' }) },
    onError: (err: Error) => toast({ title: 'Erro ao remover snapshot', description: err.message, variant: 'destructive' }),
  })
}

// ── Investment Assets ──────────────────────────────────────────────────────────

function useInvalidateAssets() {
  const userId = useAuthStore((s) => s.user!.id)
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.investmentAssets(userId) })
}

export function useInvestmentAssetsQuery() {
  const userId = useAuthStore((s) => s.user!.id)
  return useQuery({
    queryKey: queryKeys.investmentAssets(userId),
    queryFn: () => investmentAssetService.list(userId),
    enabled: !!userId,
  })
}

export function useAddAsset() {
  const userId = useAuthStore((s) => s.user!.id)
  const { toast } = useToast()
  const invalidate = useInvalidateAssets()

  return useMutation({
    mutationFn: (data: InvestmentAssetCreate) => investmentAssetService.create(userId, data),
    onSuccess: () => { invalidate(); toast({ title: 'Ativo adicionado.' }) },
    onError: (err: Error) => toast({ title: 'Erro ao adicionar ativo', description: err.message, variant: 'destructive' }),
  })
}

export function useUpdateAsset() {
  const { toast } = useToast()
  const invalidate = useInvalidateAssets()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InvestmentAssetCreate> }) =>
      investmentAssetService.update(id, data),
    onSuccess: () => { invalidate(); toast({ title: 'Ativo atualizado.' }) },
    onError: (err: Error) => toast({ title: 'Erro ao atualizar ativo', description: err.message, variant: 'destructive' }),
  })
}

export function useRemoveAsset() {
  const { toast } = useToast()
  const invalidate = useInvalidateAssets()

  return useMutation({
    mutationFn: (id: string) => investmentAssetService.remove(id),
    onSuccess: () => { invalidate(); toast({ title: 'Ativo removido.' }) },
    onError: (err: Error) => toast({ title: 'Erro ao remover ativo', description: err.message, variant: 'destructive' }),
  })
}
