import { ChevronLeftIcon, ChevronRightIcon } from '@radix-ui/react-icons'
import { useFiltersStore } from '@/stores/filtersStore'
import { addMonths, formatMonthLabel, parseMonth, formatMonth } from '@/lib/dateUtils'

export function MonthSelector() {
  const { selectedMonth, setSelectedMonth } = useFiltersStore()

  const prev = () => setSelectedMonth(formatMonth(addMonths(parseMonth(selectedMonth), -1)))
  const next = () => setSelectedMonth(formatMonth(addMonths(parseMonth(selectedMonth), 1)))

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={prev}
        className="rounded p-1 hover:bg-muted transition-colors"
        aria-label="Mês anterior"
      >
        <ChevronLeftIcon className="h-5 w-5" />
      </button>
      <span className="w-20 text-center font-medium text-sm">{formatMonthLabel(selectedMonth)}</span>
      <button
        onClick={next}
        className="rounded p-1 hover:bg-muted transition-colors"
        aria-label="Próximo mês"
      >
        <ChevronRightIcon className="h-5 w-5" />
      </button>
    </div>
  )
}
