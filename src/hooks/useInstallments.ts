import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Invoice, RichInstallment } from '@/domain'
import { installmentService } from '@/services/installments'
import { invoiceService } from '@/services/invoices'
import { useAuthStore } from '@/stores/authStore'
import { useFiltersStore } from '@/stores/filtersStore'
import { addMonths, formatMonth } from '@/lib/dateUtils'
import { computeHybridByCategory, computeHybridTotal } from '@/lib/invoiceUtils'
import { queryKeys } from './queryKeys'

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

export function useInstallmentsByMonthForDashboard(month: string) {
  const userId = useAuthStore((s) => s.user!.id)
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: queryKeys.installmentsByMonth(userId, month),
    queryFn: () => installmentService.listByMonth(userId, month),
    enabled: !!userId,
    select: (data: RichInstallment[]) => {
      const invoices: Invoice[] = queryClient.getQueryData(queryKeys.invoices(userId)) ?? []
      const monthInvoices = invoices.filter((inv) => inv.month === month)

      const totalGasto = computeHybridTotal(data, monthInvoices, month)
      const byCategory = computeHybridByCategory(data, monthInvoices, month)

      const invoicedCardIds = new Set(monthInvoices.map((inv) => inv.card_id))
      const nonSupersededInstallments = data.filter((i) => {
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
        data,
        totalGasto,
        totalPago,
        totalPendente,
        byCategory: Object.values(byCategory),
      }
    },
  })
}
