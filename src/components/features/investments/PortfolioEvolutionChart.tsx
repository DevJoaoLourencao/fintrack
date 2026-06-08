import { useMemo } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { InvestmentSnapshot } from '@/domain'
import { formatDateShort, formatTime } from '@/lib/dateUtils'
import { useHideValuesStore } from '@/stores/hideValuesStore'

const SERIES = [
  { key: 'total'              as const, label: 'Total do Patrimônio',      color: '#94a3b8', featured: true },
  { key: 'acoes'              as const, label: 'Ações',                    color: '#6366f1' },
  { key: 'fiis'               as const, label: 'FIIs',                     color: '#f59e0b' },
  { key: 'cripto'             as const, label: 'Cripto',                   color: '#f97316' },
  { key: 'internacional'      as const, label: 'Internacional',            color: '#8b5cf6' },
  { key: 'renda_fixa'         as const, label: 'Renda Fixa',              color: '#10b981' },
  { key: 'reserva_oportunidade' as const, label: 'Reserva de Oportunidade', color: '#06b6d4' },
]

const HIDDEN = '••••••'

function fmtBRL(v: number) {
  if (v >= 1_000_000) return `R$${(v / 1_000_000).toFixed(2)}M`
  if (v >= 1_000) return `R$${(v / 1_000).toFixed(1)}k`
  return `R$${v.toFixed(0)}`
}

function fmtFull(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

function MiniTooltip({ active, payload, label, color, hideValues }: {
  active?: boolean
  payload?: { value: number }[]
  label?: string
  color: string
  hideValues: boolean
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-card px-2.5 py-1.5 shadow-lg text-xs">
      <p className="text-muted-foreground mb-0.5">{label}</p>
      <p className="font-semibold tabular-nums" style={{ color }}>
        {hideValues ? HIDDEN : fmtFull(payload[0].value)}
      </p>
    </div>
  )
}

interface DataPoint {
  label: string
  total: number
  acoes: number
  fiis: number
  cripto: number
  internacional: number
  renda_fixa: number
  reserva_oportunidade: number
}

function MiniChart({
  data,
  seriesKey,
  label,
  color,
  featured,
  hideValues,
}: {
  data: DataPoint[]
  seriesKey: keyof DataPoint
  label: string
  color: string
  featured?: boolean
  hideValues: boolean
}) {
  const values = data.map((d) => d[seriesKey] as number).filter((v) => v > 0)
  if (values.length === 0) return null

  const minVal = Math.min(...values)
  const maxVal = Math.max(...values)
  const pad = (maxVal - minVal) * 0.2 || maxVal * 0.1
  const yMin = Math.max(0, Math.floor((minVal - pad) / 500) * 500)
  const yMax = Math.ceil((maxVal + pad) / 500) * 500

  const latest = data.at(-1)?.[seriesKey] as number
  const first = data[0]?.[seriesKey] as number
  const delta = latest - first
  const deltaPct = first > 0 ? (delta / first) * 100 : 0
  const isPositive = delta >= 0

  const height = featured ? 160 : 110

  return (
    <div className={`rounded-xl border border-border bg-card p-3 ${featured ? 'col-span-full' : ''}`}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-xs font-semibold text-foreground">{label}</p>
          <p className="text-lg font-bold tabular-nums text-foreground mt-0.5" style={{ color }}>
            {hideValues ? HIDDEN : fmtFull(latest)}
          </p>
        </div>
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums ${
          isPositive ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-red-500/10 text-red-500'
        }`}>
          {isPositive ? '+' : ''}{hideValues ? '••' : deltaPct.toFixed(1)}%
        </span>
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`grad-${seriesKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.2} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
            stroke="transparent"
            interval={0}
            angle={-20}
            textAnchor="end"
            height={36}
          />
          <YAxis
            tickFormatter={(v) => hideValues ? '••••' : fmtBRL(v)}
            tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
            stroke="transparent"
            width={52}
            domain={[yMin, yMax]}
          />
          <Tooltip
            content={<MiniTooltip color={color} hideValues={hideValues} />}
            cursor={{ stroke: color, strokeWidth: 1, strokeDasharray: '3 2', opacity: 0.4 }}
          />
          <Area
            dataKey={seriesKey}
            stroke={color}
            strokeWidth={2}
            fill={`url(#grad-${seriesKey})`}
            dot={{ r: 3, fill: color, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: color, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

interface Props {
  snapshots: InvestmentSnapshot[]
}

export function PortfolioEvolutionChart({ snapshots }: Props) {
  const { hideValues } = useHideValuesStore()

  const data = useMemo<DataPoint[]>(() => {
    const sorted = [...snapshots].sort((a, b) => a.created_at.localeCompare(b.created_at))
    const dateCounts = sorted.reduce<Record<string, number>>((acc, s) => {
      acc[s.date] = (acc[s.date] ?? 0) + 1
      return acc
    }, {})
    return sorted.map((s) => ({
        label: dateCounts[s.date] > 1
          ? `${formatDateShort(s.date)} ${formatTime(s.created_at)}`
          : formatDateShort(s.date),
        total: s.acoes + s.fiis + s.cripto + s.internacional + s.renda_fixa + (s.reserva_oportunidade ?? 0),
        acoes: s.acoes,
        fiis: s.fiis,
        cripto: s.cripto,
        internacional: s.internacional,
        renda_fixa: s.renda_fixa,
        reserva_oportunidade: s.reserva_oportunidade ?? 0,
      }))
  }, [snapshots])

  if (data.length < 2) return null

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Evolução do Portfólio</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {SERIES.map((s) => (
          <MiniChart
            key={s.key}
            data={data}
            seriesKey={s.key}
            label={s.label}
            color={s.color}
            featured={s.featured}
            hideValues={hideValues}
          />
        ))}
      </div>
    </div>
  )
}
