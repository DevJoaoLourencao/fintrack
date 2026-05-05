import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { RichInstallment } from '@/domain'
import { installmentService } from '@/services/installments'
import { invoiceService } from '@/services/invoices'
import { useAuthStore } from '@/stores/authStore'
import { useFiltersStore } from '@/stores/filtersStore'
import { useToast } from '@/components/ui/Toast'
import { addMonths, formatMonth } from '@/lib/dateUtils'
import { computeHybridByCategory, computeHybridTotal } from '@/lib/invoiceUtils'
import { queryKeys } from './queryKeys'
import { useInvoicesQuery } from './useInvoices'

export function useInstallmentsByMonth(month: string) {
  const userId = useAuthStore((s) => s.user!.id)
  return useQuery({
    queryKey: queryKeys.installmentsByMonth(userId, month),
    queryFn: () => installmentService.listByMonth(userId, month),
    enabled: !!userId,
  })
}

export function useTogglePaid() {
  const userId = useAuthStore((s) => s.user!.id)
  const { selectedMonth } = useFiltersStore()
  const queryClient = useQueryClient()
  const key = queryKeys.installmentsByMonth(userId, selectedMonth)

  return useMutation({
    mutationFn: ({ id, paid }: { id: string; paid: boolean }) =>
      installmentService.togglePaid(id, paid),
    onMutate: async ({ id, paid }) => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData(key)
      queryClient.setQueryData(key, (old: RichInstallment[] | undefined) =>
        old?.map((i) => (i.id === id ? { ...i, paid } : i))
      )
      return { previous }
    },
    onError: (_err, _vars, context) => {
      queryClient.setQueryData(key, context?.previous)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key })
      queryClient.invalidateQueries({ queryKey: queryKeys.installmentsUpcoming(userId) })
    },
  })
}

export function useUpcomingInstallments(limit: number) {
  const userId = useAuthStore((s) => s.user!.id)
  return useQuery({
    queryKey: queryKeys.installmentsUpcoming(userId),
    queryFn: () => installmentService.listUpcoming(userId, limit),
    enabled: !!userId,
  })
}

export function useSpendingTrend() {
  const userId = useAuthStore((s) => s.user!.id)
  return useQuery({
    queryKey: queryKeys.installmentsTrend(userId),
    queryFn: async () => {
      const today = new Date()
      const fromMonth = formatMonth(addMonths(today, -5))
      const toMonth = formatMonth(today)

      const [items, invoices] = await Promise.all([
        installmentService.listByDateRange(userId, fromMonth, toMonth),
        invoiceService.list(userId),
      ])

      const months: string[] = []
      for (let i = -5; i <= 0; i++) {
        months.push(formatMonth(addMonths(today, i)))
      }

      return months.map((month) => ({
        month,
        total: computeHybridTotal(items, invoices, month),
      }))
    },
    enabled: !!userId,
  })
}

export function useActiveInstallmentGroups() {
  const userId = useAuthStore((s) => s.user!.id)
  const { selectedMonth } = useFiltersStore()
  const today = new Date().toISOString().slice(0, 10)
  const fromDate = selectedMonth > today.slice(0, 7) ? `${selectedMonth}-01` : today
  return useQuery({
    queryKey: [...queryKeys.activeInstallments(userId), fromDate],
    queryFn: () => installmentService.listActiveInstallmentGroups(userId, fromDate),
    enabled: !!userId,
  })
}

export function useDeleteFromDateOnward() {
  const userId = useAuthStore((s) => s.user!.id)
  const { selectedMonth } = useFiltersStore()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ transactionId, fromDueDate }: { transactionId: string; fromDueDate: string }) =>
      installmentService.deleteFromDateOnward(transactionId, fromDueDate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.installmentsByMonth(userId, selectedMonth) })
      queryClient.invalidateQueries({ queryKey: queryKeys.installmentsUpcoming(userId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.installmentsTrend(userId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.activeInstallments(userId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions(userId) })
      toast({ title: 'Lançamento excluído a partir deste mês.' })
    },
    onError: (err: Error) => {
      toast({ title: 'Erro ao excluir lançamento', description: err.message, variant: 'destructive' })
    },
  })
}

export function useMarkCardPaid() {
  const userId = useAuthStore((s) => s.user!.id)
  const { selectedMonth } = useFiltersStore()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ installmentIds, paid }: { installmentIds: string[]; paid: boolean }) =>
      installmentService.setPaidBulk(installmentIds, paid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.installmentsByMonth(userId, selectedMonth) })
      queryClient.invalidateQueries({ queryKey: queryKeys.installmentsUpcoming(userId) })
      toast({ title: 'Fatura marcada como paga.' })
    },
    onError: (err: Error) => {
      toast({ title: 'Erro ao pagar fatura', description: err.message, variant: 'destructive' })
    },
  })
}

export function useDeleteInstallment() {
  const userId = useAuthStore((s) => s.user!.id)
  const { selectedMonth } = useFiltersStore()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (installmentId: string) => installmentService.deleteOne(installmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.installmentsByMonth(userId, selectedMonth) })
      queryClient.invalidateQueries({ queryKey: queryKeys.installmentsUpcoming(userId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.installmentsTrend(userId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.activeInstallments(userId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions(userId) })
      toast({ title: 'Parcela excluída.' })
    },
    onError: (err: Error) => {
      toast({ title: 'Erro ao excluir parcela', description: err.message, variant: 'destructive' })
    },
  })
}

export function useInstallmentsByMonthForDashboard(month: string) {
  const userId = useAuthStore((s) => s.user!.id)

  const { data: installments = [], isLoading: installmentsLoading } = useQuery({
    queryKey: queryKeys.installmentsByMonth(userId, month),
    queryFn: () => installmentService.listByMonth(userId, month),
    enabled: !!userId,
  })

  const { data: allInvoices = [], isLoading: invoicesLoading } = useInvoicesQuery()

  const data = useMemo(() => {
    const monthInvoices = allInvoices.filter((inv) => inv.month === month)
    const totalGasto = computeHybridTotal(installments, monthInvoices, month)
    const byCategory = computeHybridByCategory(installments, monthInvoices, month)

    const invoicedCardIds = new Set(monthInvoices.map((inv) => inv.card_id))
    const nonSupersededInstallments = installments.filter((i) => {
      const isCardBased = i.transaction.type === 'credit_card' || i.transaction.type === 'subscription'
      return !(isCardBased && i.transaction.card_id && invoicedCardIds.has(i.transaction.card_id))
    })
    const invoiceTotal = monthInvoices
      .filter((inv) => inv.paid)
      .reduce((s, inv) => s + inv.amount, 0)
    const totalPago = nonSupersededInstallments
      .filter((i) => i.paid)
      .reduce((s, i) => s + i.amount, 0) + invoiceTotal
    const totalPendente = Math.max(0, totalGasto - totalPago)

    return {
      data: installments,
      totalGasto,
      totalPago,
      totalPendente,
      byCategory: Object.values(byCategory),
    }
  }, [installments, allInvoices, month])

  return {
    data,
    isLoading: installmentsLoading || invoicesLoading,
  }
}
