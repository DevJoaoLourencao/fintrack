import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Card, TransactionCreate } from '@/domain'
import { transactionService } from '@/services/transactions'
import { installmentService } from '@/services/installments'
import { generateInstallments } from '@/lib/installmentUtils'
import { addMonths } from '@/lib/dateUtils'
import { useAuthStore } from '@/stores/authStore'
import { useFiltersStore } from '@/stores/filtersStore'
import { useToast } from '@/components/ui/Toast'
import { queryKeys } from './queryKeys'

export interface TransactionFormData {
  type: TransactionCreate['type']
  description: string
  total_amount: number
  category_id: string
  card_id: string | null
  total_installments: number
  purchase_date: string
  current_installment: number
}

export function useActiveSubscriptions() {
  const userId = useAuthStore((s) => s.user!.id)
  return useQuery({
    queryKey: queryKeys.subscriptions(userId),
    queryFn: () => transactionService.listSubscriptions(userId),
    enabled: !!userId,
  })
}

export function useDeleteTransaction() {
  const userId = useAuthStore((s) => s.user!.id)
  const { selectedMonth } = useFiltersStore()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (transactionId: string) => transactionService.remove(transactionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.installmentsByMonth(userId, selectedMonth) })
      queryClient.invalidateQueries({ queryKey: queryKeys.installmentsUpcoming(userId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.installmentsTrend(userId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.activeInstallments(userId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions(userId) })
      toast({ title: 'Lançamento excluído.' })
    },
    onError: (err: Error) => {
      toast({ title: 'Erro ao excluir lançamento', description: err.message, variant: 'destructive' })
    },
  })
}

export function useUpdateTransaction() {
  const userId = useAuthStore((s) => s.user!.id)
  const { selectedMonth } = useFiltersStore()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { description: string; category_id: string } }) =>
      transactionService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.installmentsByMonth(userId, selectedMonth) })
      queryClient.invalidateQueries({ queryKey: queryKeys.installmentsUpcoming(userId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.installmentsTrend(userId) })
      toast({ title: 'Lançamento atualizado.' })
    },
    onError: (err: Error) => {
      toast({ title: 'Erro ao atualizar lançamento', description: err.message, variant: 'destructive' })
    },
  })
}

export function useAddTransaction() {
  const userId = useAuthStore((s) => s.user!.id)
  const { selectedMonth } = useFiltersStore()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (formData: TransactionFormData) => {
      const isRecurring = formData.type === 'recurring' || formData.type === 'subscription'
      const totalInstallments =
        formData.type === 'credit_card' ? formData.total_installments : 1

      const currentInstallment = formData.current_installment ?? 1
      const effectivePurchaseDate =
        formData.type === 'credit_card' && currentInstallment > 1
          ? (() => {
              const d = addMonths(new Date(`${selectedMonth}-01`), -currentInstallment)
              return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
            })()
          : formData.purchase_date

      const txData: TransactionCreate = {
        card_id: (formData.type === 'credit_card' || formData.type === 'subscription') ? formData.card_id : null,
        category_id: formData.category_id,
        description: formData.description,
        total_amount: formData.total_amount,
        type: formData.type,
        total_installments: totalInstallments,
        purchase_date: effectivePurchaseDate,
        is_recurring: isRecurring,
      }

      const transaction = await transactionService.create(userId, txData)

      const cachedCards = queryClient.getQueryData<Card[]>(queryKeys.cards(userId))
      const card = cachedCards?.find((c) => c.id === formData.card_id)

      const paidUpTo = currentInstallment > 1 ? currentInstallment - 1 : undefined
      const installments = generateInstallments(transaction.id, transaction, card, paidUpTo)
      await installmentService.createBatch(installments)

      return { transaction, installmentCount: installments.length }
    },
    onSuccess: ({ installmentCount }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.installmentsByMonth(userId, selectedMonth) })
      queryClient.invalidateQueries({ queryKey: queryKeys.installmentsUpcoming(userId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.installmentsTrend(userId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.activeInstallments(userId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions(userId) })
      toast({
        title: 'Lançamento adicionado!',
        description: `${installmentCount} parcela${installmentCount > 1 ? 's' : ''} gerada${installmentCount > 1 ? 's' : ''}.`,
      })
    },
    onError: (err: Error) => {
      toast({ title: 'Erro ao salvar lançamento', description: err.message, variant: 'destructive' })
    },
  })
}
