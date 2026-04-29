import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/authStore'
import { transactionService } from '@/services/transactions'
import { installmentService } from '@/services/installments'
import { generateRecurringExtension, futureMonth } from '@/lib/installmentUtils'
import { addMonths, formatMonth, monthOf } from '@/lib/dateUtils'

const HORIZON_MONTHS = 3  // ensure coverage at least this far ahead
const EXTEND_BY = 12      // how many months to generate when extending

export function useEnsureRecurring() {
  const userId = useAuthStore((s) => s.user?.id)
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!userId) return

    const run = async () => {
      const recurringTxs = await transactionService.listRecurring(userId)
      if (recurringTxs.length === 0) return

      const horizon = futureMonth(HORIZON_MONTHS)
      let extended = false

      for (const tx of recurringTxs) {
        const last = await installmentService.getLastByTransaction(tx.id)
        if (!last) continue
        if (monthOf(last.due_date) >= horizon) continue

        const [ly, lm] = last.due_date.split('-').map(Number)
        const nextMonth = formatMonth(addMonths(new Date(ly, lm - 1, 1), 1))

        const newInstallments = generateRecurringExtension(
          tx.id,
          tx.total_amount,
          tx.purchase_date,
          nextMonth,
          last.number + 1,
          EXTEND_BY
        )

        await installmentService.createBatchSafe(newInstallments)
        extended = true
      }

      if (extended) {
        queryClient.invalidateQueries({ queryKey: ['installments', 'month', userId] })
        queryClient.invalidateQueries({ queryKey: ['installments', 'upcoming', userId] })
        queryClient.invalidateQueries({ queryKey: ['installments', 'trend', userId] })
      }
    }

    run()
  }, [userId, queryClient])
}
