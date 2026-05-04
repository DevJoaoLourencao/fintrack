import { MonthSelector } from '@/components/features/MonthSelector'
import { SummaryCards } from '@/components/features/dashboard/SummaryCards'
import { PatrimonioChart } from '@/components/features/dashboard/PatrimonioChart'
import { SpendingTrendChart } from '@/components/features/dashboard/SpendingTrendChart'
import { OverviewWidgets } from '@/components/features/dashboard/OverviewWidgets'
import { useInstallmentsByMonthForDashboard } from '@/hooks/useInstallments'
import { useFiltersStore } from '@/stores/filtersStore'
import { useNavStore } from '@/stores/navStore'
import { useHideValuesStore } from '@/stores/hideValuesStore'

export function DashboardPage() {
  const { hideValues } = useHideValuesStore()
  const { selectedMonth } = useFiltersStore()
  const { isVisible } = useNavStore()
  const { data, isLoading } = useInstallmentsByMonthForDashboard(selectedMonth)
  const showLancamentos = isVisible('lancamentos')
  const showPatrimonio = isVisible('investimentos') || isVisible('motos') || isVisible('bens')

  const totalGasto = data?.totalGasto ?? 0
  const totalPago = data?.totalPago ?? 0
  const totalPendente = data?.totalPendente ?? 0

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-semibold text-foreground">Dashboard</h2>
        {showLancamentos && <MonthSelector />}
      </div>

      {showLancamentos && (
        <SummaryCards
          totalGasto={totalGasto}
          totalPago={totalPago}
          totalPendente={totalPendente}
          isLoading={isLoading}
          hideValues={hideValues}
        />
      )}

      {(showPatrimonio || showLancamentos) && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {showPatrimonio && <PatrimonioChart hideValues={hideValues} />}
          {showLancamentos && <SpendingTrendChart />}
        </div>
      )}

      <OverviewWidgets hideValues={hideValues} />
    </div>
  )
}
