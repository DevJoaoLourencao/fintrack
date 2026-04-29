import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { CardCreate } from '@/domain'
import { cardService } from '@/services/cards'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/components/ui/Toast'
import { queryKeys } from './queryKeys'

export function useCardsQuery() {
  const userId = useAuthStore((s) => s.user!.id)
  return useQuery({
    queryKey: queryKeys.cards(userId),
    queryFn: () => cardService.list(userId),
    enabled: !!userId,
  })
}

export function useCreateCard() {
  const userId = useAuthStore((s) => s.user!.id)
  const { toast } = useToast()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CardCreate) => cardService.create(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cards(userId) })
      toast({ title: 'Cartão criado com sucesso.' })
    },
    onError: (err: Error) => {
      toast({ title: 'Erro ao criar cartão', description: err.message, variant: 'destructive' })
    },
  })
}

export function useUpdateCard() {
  const userId = useAuthStore((s) => s.user!.id)
  const { toast } = useToast()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CardCreate> }) =>
      cardService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cards(userId) })
      toast({ title: 'Cartão atualizado com sucesso.' })
    },
    onError: (err: Error) => {
      toast({ title: 'Erro ao atualizar cartão', description: err.message, variant: 'destructive' })
    },
  })
}

export function useDeleteCard() {
  const userId = useAuthStore((s) => s.user!.id)
  const { toast } = useToast()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => cardService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cards(userId) })
      toast({ title: 'Cartão removido.' })
    },
    onError: (err: Error) => {
      toast({ title: 'Erro ao remover cartão', description: err.message, variant: 'destructive' })
    },
  })
}
