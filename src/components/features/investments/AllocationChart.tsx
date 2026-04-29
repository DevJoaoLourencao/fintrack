import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import type { TooltipProps, PieLabelRenderProps } from 'recharts'
import type { InvestmentSnapshot } from '@/domain'

const CATEGORIES = [
  { key: 'acoes'         as const, label: 'Ações',        color: '#6366f1' },
  { key: 'fiis'          as const, label: 'FIIs',          color: '#f59e0b' },
  { key: 'cripto'        as const, label: 'Cripto',        color: '#f97316' },
  { key: 'internacional' as const, label: 'Internacional', color: '#8b5cf6' },
  { key: 'renda_fixa'    as const, label: 'Renda Fixa',   color: '#10b981' },
]

const formatBrl = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

interface ChartEntry {
  name: string
  value: number
  color: string
  pct: number
}

function CustomTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null
  const entry = payload[0].payload as ChartEntry

  return (
    <div className="rounded-lg border border-border bg-neutral-900 px-3 py-2 shadow-lg">
      <div className="flex items-center gap-2 mb-1">
        <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
        <span className="text-xs font-semibold text-white">{entry.name}</span>
      </div>
      <p className="text-sm font-bold tabular-nums text-white">{formatBrl(entry.value)}</p>
      <p className="text-xs text-neutral-400">{entry.pct.toFixed(1)}% do total</p>
    </div>
  )
}

function CustomLabel({ cx, cy, midAngle, innerRadius, outerRadius, payload }: PieLabelRenderProps & { payload: ChartEntry }) {
  if ((payload.pct ?? 0) < 3) return null

  const RADIAN = Math.PI / 180
  const cxNum = Number(cx)
  const cyNum = Number(cy)
  const innerR = Number(innerRadius)
  const outerR = Number(outerRadius)
  const midAngleNum = Number(midAngle)

  const radius = innerR + (outerR - innerR) * 0.5
  const x = cxNum + radius * Math.cos(-midAngleNum * RADIAN)
  const y = cyNum + radius * Math.sin(-midAngleNum * RADIAN)

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={11}
      fontWeight={600}
    >
      {`${payload.pct.toFixed(0)}%`}
    </text>
  )
}

interface Props {
  snapshot: InvestmentSnapshot
}

export function AllocationChart({ snapshot }: Props) {
  const rawData = CATEGORIES
    .map((c) => ({ name: c.label, value: snapshot[c.key], color: c.color }))
    .filter((d) => d.value > 0)

  if (rawData.length === 0) return null

  const total = rawData.reduce((s, d) => s + d.value, 0)
  const data: ChartEntry[] = rawData.map((d) => ({ ...d, pct: (d.value / total) * 100 }))

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="mb-3 text-sm font-medium text-foreground">Alocação Atual</p>
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="45%"
            innerRadius={60}
            outerRadius={95}
            paddingAngle={2}
            dataKey="value"
            labelLine={false}
            label={(props) => <CustomLabel {...props} />}
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={(props) => <CustomTooltip {...props} />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Legenda customizada com percentual */}
      <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1.5">
        {data.map((entry) => (
          <div key={entry.name} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
            <span className="text-xs text-muted-foreground">{entry.name}</span>
            <span className="text-xs font-semibold tabular-nums text-foreground">{entry.pct.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}
