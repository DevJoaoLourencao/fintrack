import { useState } from 'react'
import { EyeOpenIcon, EyeClosedIcon } from '@radix-ui/react-icons'
import { MonthSelector } from '@/components/features/MonthSelector'
import { SummaryCards } from '@/components/features/dashboard/SummaryCards'
import { SpendingByCategoryChart } from '@/components/features/dashboard/SpendingByCategoryChart'
import { SpendingTrendChart } from '@/components/features/dashboard/SpendingTrendChart'
import { OverviewWidgets } from '@/components/features/dashboard/OverviewWidgets'
import { useInstallmentsByMonthForDashboard } from '@/hooks/useInstallments'
import { useFiltersStore } from '@/stores/filtersStore'

export function DashboardPage() {
  const [hideValues, setHideValues] = useState(true)
  const { selectedMonth } = useFiltersStore()
  const { data, isLoading } = useInstallmentsByMonthForDashboard(selectedMonth)

  const totalGasto = data?.totalGasto ?? 0
  const totalPago = data?.totalPago ?? 0
  const totalPendente = data?.totalPendente ?? 0
  const byCategory = data?.byCategory ?? []

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold text-foreground">Dashboard</h2>
          <MonthSelector />
        </div>

        <button
          type="button"
          onClick={() => setHideValues((v) => !v)}
          className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          aria-label={hideValues ? 'Exibir valores' : 'Ocultar valores'}
        >
          {hideValues ? (
            <><EyeOpenIcon className="h-3.5 w-3.5" /> Exibir valores</>
          ) : (
            <><EyeClosedIcon className="h-3.5 w-3.5" /> Ocultar valores</>
          )}
        </button>
      </div>

      <SummaryCards
        totalGasto={totalGasto}
        totalPago={totalPago}
        totalPendente={totalPendente}
        isLoading={isLoading}
        hideValues={hideValues}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SpendingByCategoryChart data={byCategory} />
        <SpendingTrendChart />
      </div>

      <OverviewWidgets hideValues={hideValues} />
    </div>
  )
}
