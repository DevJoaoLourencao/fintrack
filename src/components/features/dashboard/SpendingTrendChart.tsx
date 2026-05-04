import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { formatCurrency, formatMonthLabel } from '@/lib/dateUtils'
import { useSpendingTrend } from '@/hooks/useInstallments'
import { useHideValuesStore } from '@/stores/hideValuesStore'

const HIDDEN_VALUE = '••••'

export function SpendingTrendChart() {
  const { hideValues } = useHideValuesStore()
  const { data = [], isLoading } = useSpendingTrend()

  const chartData = data.map((d) => ({ ...d, label: formatMonthLabel(d.month) }))

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border/50 bg-card p-4 flex items-center justify-center h-[280px] shadow-card-md">
        <div className="h-4 w-24 bg-muted animate-pulse rounded" />
      </div>
    )
  }

  if (chartData.length === 0) {
    return (
      <div className="rounded-2xl border border-border/50 bg-card p-4 flex flex-col h-[280px] shadow-card-md">
        <p className="text-sm font-medium text-foreground mb-3">Tendência (últimos 6 meses)</p>
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-muted-foreground">Sem lançamentos nos últimos 6 meses.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-border/50 bg-card p-4 shadow-card-md">
      <p className="text-sm font-medium text-foreground mb-3">Tendência (últimos 6 meses)</p>
      <div style={{ height: 240 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tickFormatter={(v) => hideValues ? 'R$ ••••' : `R$${v}`}
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              tickLine={false}
              axisLine={false}
              width={60}
            />
            <Tooltip
              formatter={(v) => [hideValues ? HIDDEN_VALUE : (typeof v === 'number' ? formatCurrency(v) : v), 'Total gasto']}
              contentStyle={{
                fontSize: 12,
                borderRadius: 6,
                border: '1px solid hsl(var(--border))',
                background: 'hsl(var(--card))',
                color: 'hsl(var(--foreground))',
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
              itemStyle={{ color: 'hsl(var(--foreground))' }}
            />
            <Line
              type="monotone"
              dataKey="total"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ r: 4, fill: 'hsl(var(--primary))' }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
