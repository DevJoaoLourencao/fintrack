import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { AssetCategory } from '@/domain'
import { allocationTargetService } from '@/services/allocationTargets'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/components/ui/Toast'

const KEY = (userId: string) => ['allocation_targets', userId]

export function useAllocationTargetsQuery() {
  const userId = useAuthStore((s) => s.user!.id)
  return useQuery({
    queryKey: KEY(userId),
    queryFn: () => allocationTargetService.list(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  })
}

export function useSaveAllocationTargets() {
  const userId = useAuthStore((s) => s.user!.id)
  const queryClient = useQueryClient()
  const { toast } = useToast()
  return useMutation({
    mutationFn: (targets: { category: AssetCategory; target_pct: number }[]) =>
      allocationTargetService.upsertAll(userId, targets),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEY(userId) })
      toast({ title: 'Metas salvas.' })
    },
    onError: (err: Error) => {
      toast({ title: 'Erro ao salvar metas', description: err.message, variant: 'destructive' })
    },
  })
}
