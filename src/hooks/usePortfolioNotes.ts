import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { portfolioNotesService } from '@/services/portfolioNotes'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/components/ui/Toast'

const KEY = (userId: string) => ['portfolio_notes', userId]

export function usePortfolioNotesQuery() {
  const userId = useAuthStore((s) => s.user!.id)
  return useQuery({
    queryKey: KEY(userId),
    queryFn: () => portfolioNotesService.list(userId),
    enabled: !!userId,
  })
}

export function useAddPortfolioNote() {
  const userId = useAuthStore((s) => s.user!.id)
  const queryClient = useQueryClient()
  const { toast } = useToast()
  return useMutation({
    mutationFn: (content: string) => portfolioNotesService.create(userId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEY(userId) })
      toast({ title: 'Nota publicada.' })
    },
    onError: (err: Error) => {
      toast({ title: 'Erro ao publicar', description: err.message, variant: 'destructive' })
    },
  })
}

export function useUpdatePortfolioNote() {
  const userId = useAuthStore((s) => s.user!.id)
  const queryClient = useQueryClient()
  const { toast } = useToast()
  return useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) =>
      portfolioNotesService.update(id, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEY(userId) })
      toast({ title: 'Nota atualizada.' })
    },
    onError: (err: Error) => {
      toast({ title: 'Erro ao atualizar', description: err.message, variant: 'destructive' })
    },
  })
}

export function useDeletePortfolioNote() {
  const userId = useAuthStore((s) => s.user!.id)
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => portfolioNotesService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEY(userId) })
    },
  })
}
