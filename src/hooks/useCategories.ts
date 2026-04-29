import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { CategoryCreate } from '@/domain'
import { categoryService } from '@/services/categories'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/components/ui/Toast'
import { queryKeys } from './queryKeys'

export function useCategoriesQuery() {
  const userId = useAuthStore((s) => s.user!.id)
  return useQuery({
    queryKey: queryKeys.categories(userId),
    queryFn: () => categoryService.list(userId),
    enabled: !!userId,
  })
}

export function useCreateCategory() {
  const userId = useAuthStore((s) => s.user!.id)
  const { toast } = useToast()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CategoryCreate) => categoryService.create(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories(userId) })
      toast({ title: 'Categoria criada com sucesso.' })
    },
    onError: (err: Error) => {
      toast({ title: 'Erro ao criar categoria', description: err.message, variant: 'destructive' })
    },
  })
}

export function useUpdateCategory() {
  const userId = useAuthStore((s) => s.user!.id)
  const { toast } = useToast()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CategoryCreate> }) =>
      categoryService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories(userId) })
      toast({ title: 'Categoria atualizada com sucesso.' })
    },
    onError: (err: Error) => {
      toast({ title: 'Erro ao atualizar categoria', description: err.message, variant: 'destructive' })
    },
  })
}

export function useDeleteCategory() {
  const userId = useAuthStore((s) => s.user!.id)
  const { toast } = useToast()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => categoryService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories(userId) })
      toast({ title: 'Categoria removida.' })
    },
    onError: (err: Error) => {
      const isFK = err.message.includes('foreign key') || err.message.includes('violates')
      toast({
        title: isFK ? 'Categoria em uso' : 'Erro ao remover categoria',
        description: isFK
          ? 'Esta categoria possui lançamentos vinculados e não pode ser excluída.'
          : err.message,
        variant: 'destructive',
      })
    },
  })
}
