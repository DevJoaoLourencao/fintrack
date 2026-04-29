import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Invoice, InvoiceCreate } from '@/domain'
import { invoiceService } from '@/services/invoices'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/components/ui/Toast'
import { queryKeys } from './queryKeys'

export function useInvoicesQuery() {
  const userId = useAuthStore((s) => s.user!.id)
  return useQuery({
    queryKey: queryKeys.invoices(userId),
    queryFn: () => invoiceService.list(userId),
    enabled: !!userId,
  })
}

export function useUpsertInvoice() {
  const userId = useAuthStore((s) => s.user!.id)
  const { toast } = useToast()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: InvoiceCreate) => invoiceService.upsert(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices(userId) })
      toast({ title: 'Fatura salva.' })
    },
    onError: (err: Error) => {
      toast({ title: 'Erro ao salvar fatura', description: err.message, variant: 'destructive' })
    },
  })
}

export function useToggleInvoicePaid() {
  const userId = useAuthStore((s) => s.user!.id)
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, paid }: { id: string; paid: boolean }) =>
      invoiceService.togglePaid(id, paid),
    onMutate: async ({ id, paid }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.invoices(userId) })
      const previous = queryClient.getQueryData<Invoice[]>(queryKeys.invoices(userId))
      queryClient.setQueryData<Invoice[]>(queryKeys.invoices(userId), (old) =>
        old?.map((inv) => (inv.id === id ? { ...inv, paid } : inv)) ?? []
      )
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.invoices(userId), context.previous)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices(userId) })
    },
  })
}

export function useDeleteInvoice() {
  const userId = useAuthStore((s) => s.user!.id)
  const { toast } = useToast()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => invoiceService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices(userId) })
      toast({ title: 'Fatura removida.' })
    },
    onError: (err: Error) => {
      toast({ title: 'Erro ao remover fatura', description: err.message, variant: 'destructive' })
    },
  })
}
