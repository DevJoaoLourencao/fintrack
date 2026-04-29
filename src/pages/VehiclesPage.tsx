import { useMemo } from 'react'
import * as Tabs from '@radix-ui/react-tabs'
import { clsx } from 'clsx'
import { useVehiclesQuery, useVehicleSalesQuery } from '@/hooks/useVehicles'
import { VehicleInventoryTab } from '@/components/features/vehicles/VehicleInventoryTab'
import { VehicleReceivablesTab } from '@/components/features/vehicles/VehicleReceivablesTab'
import { VehicleHistoryTab } from '@/components/features/vehicles/VehicleHistoryTab'
import { formatCurrency } from '@/lib/dateUtils'

function SummaryCard({
  label,
  value,
  sub,
  highlight,
}: {
  label: string
  value: string
  sub?: string
  highlight?: 'green' | 'red' | 'none'
}) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={clsx(
        'mt-1 text-lg font-bold tabular-nums',
        highlight === 'green' ? 'text-green-500' :
        highlight === 'red' ? 'text-red-500' :
        'text-foreground'
      )}>
        {value}
      </p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  )
}

const TAB_CLASS = clsx(
  'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
  'text-muted-foreground hover:text-foreground',
  'data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm'
)

export function VehiclesPage() {
  const { data: vehicles = [], isLoading: loadingVehicles } = useVehiclesQuery()
  const { data: sales = [], isLoading: loadingSales } = useVehicleSalesQuery()

  const activeVehicles = useMemo(() => vehicles.filter((v) => v.status === 'active'), [vehicles])
  const receivableSales = useMemo(() => sales.filter((s) => !s.completed), [sales])
  const completedSales = useMemo(() => sales.filter((s) => s.completed), [sales])

  const totalInvested = activeVehicles.reduce((sum, v) => sum + v.purchase_price, 0)
  const totalReceivable = receivableSales.reduce(
    (sum, s) => sum + (s.installments_count - s.installments_paid) * s.installments_amount,
    0
  )
  const totalProfit = completedSales.reduce(
    (sum, s) => sum + (s.total_sale_price - s.vehicle.purchase_price),
    0
  )

  return (
    <div className="flex flex-col gap-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <SummaryCard
          label="Em estoque"
          value={formatCurrency(totalInvested)}
          sub={`${activeVehicles.length} ${activeVehicles.length === 1 ? 'veículo' : 'veículos'}`}
        />
        <SummaryCard
          label="A receber"
          value={formatCurrency(totalReceivable)}
          sub={`${receivableSales.length} ${receivableSales.length === 1 ? 'venda' : 'vendas'} pendentes`}
        />
        <SummaryCard
          label="Lucro realizado"
          value={(totalProfit >= 0 ? '+' : '') + formatCurrency(totalProfit)}
          sub={`${completedSales.length} vendas concluídas`}
          highlight={completedSales.length > 0 ? (totalProfit >= 0 ? 'green' : 'red') : 'none'}
        />
      </div>

      {/* Tabs */}
      <Tabs.Root defaultValue="estoque">
        <Tabs.List className="flex gap-1 rounded-xl border border-border bg-muted/40 p-1 w-fit">
          <Tabs.Trigger value="estoque" className={TAB_CLASS}>
            Estoque
            {activeVehicles.length > 0 && (
              <span className="ml-1.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                {activeVehicles.length}
              </span>
            )}
          </Tabs.Trigger>
          <Tabs.Trigger value="receber" className={TAB_CLASS}>
            A Receber
            {receivableSales.length > 0 && (
              <span className="ml-1.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                {receivableSales.length}
              </span>
            )}
          </Tabs.Trigger>
          <Tabs.Trigger value="historico" className={TAB_CLASS}>
            Histórico
          </Tabs.Trigger>
        </Tabs.List>

        <div className="mt-4">
          <Tabs.Content value="estoque">
            <VehicleInventoryTab
              vehicles={activeVehicles}
              isLoading={loadingVehicles}
            />
          </Tabs.Content>
          <Tabs.Content value="receber">
            <VehicleReceivablesTab
              sales={receivableSales}
              isLoading={loadingSales}
            />
          </Tabs.Content>
          <Tabs.Content value="historico">
            <VehicleHistoryTab
              sales={completedSales}
              isLoading={loadingSales}
            />
          </Tabs.Content>
        </div>
      </Tabs.Root>
    </div>
  )
}
