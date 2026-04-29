import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { PersonalAssetCreate } from '@/domain'
import { personalAssetService } from '@/services/personalAssets'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/components/ui/Toast'
import { queryKeys } from './queryKeys'

export function usePersonalAssetsQuery() {
  const userId = useAuthStore((s) => s.user!.id)
  return useQuery({
    queryKey: queryKeys.personalAssets(userId),
    queryFn: () => personalAssetService.list(userId),
    enabled: !!userId,
  })
}

function useInvalidate() {
  const userId = useAuthStore((s) => s.user!.id)
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.personalAssets(userId) })
}

export function useAddPersonalAsset() {
  const userId = useAuthStore((s) => s.user!.id)
  const { toast } = useToast()
  const invalidate = useInvalidate()

  return useMutation({
    mutationFn: (data: PersonalAssetCreate) => personalAssetService.create(userId, data),
    onSuccess: () => { invalidate(); toast({ title: 'Bem cadastrado.' }) },
    onError: (err: Error) => toast({ title: 'Erro ao cadastrar bem', description: err.message, variant: 'destructive' }),
  })
}

export function useUpdatePersonalAsset() {
  const { toast } = useToast()
  const invalidate = useInvalidate()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PersonalAssetCreate> }) =>
      personalAssetService.update(id, data),
    onSuccess: () => { invalidate(); toast({ title: 'Bem atualizado.' }) },
    onError: (err: Error) => toast({ title: 'Erro ao atualizar bem', description: err.message, variant: 'destructive' }),
  })
}

export function useRemovePersonalAsset() {
  const { toast } = useToast()
  const invalidate = useInvalidate()

  return useMutation({
    mutationFn: (id: string) => personalAssetService.remove(id),
    onSuccess: () => { invalidate(); toast({ title: 'Bem removido.' }) },
    onError: (err: Error) => toast({ title: 'Erro ao remover bem', description: err.message, variant: 'destructive' }),
  })
}
