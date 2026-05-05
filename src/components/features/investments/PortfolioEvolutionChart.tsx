import { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { InvestmentSnapshot } from '@/domain'
import { formatDate, formatTime } from '@/lib/dateUtils'
import { useHideValuesStore } from '@/stores/hideValuesStore'

const CATEGORIES = [
  { key: 'acoes'                as const, label: 'Ações',                    color: '#6366f1' },
  { key: 'fiis'                 as const, label: 'FIIs',                     color: '#f59e0b' },
  { key: 'cripto'               as const, label: 'Cripto',                   color: '#f97316' },
  { key: 'internacional'        as const, label: 'Internacional',            color: '#8b5cf6' },
  { key: 'renda_fixa'           as const, label: 'Renda Fixa',              color: '#10b981' },
  { key: 'reserva_oportunidade' as const, label: 'Reserva de Oportunidade', color: '#06b6d4' },
]

function formatBRL(value: number) {
  if (value >= 1_000_000) return `R$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `R$${(value / 1_000).toFixed(0)}k`
  return `R$${value}`
}

interface Props {
  snapshots: InvestmentSnapshot[]
}

export function PortfolioEvolutionChart({ snapshots }: Props) {
  const { hideValues } = useHideValuesStore()
  const data = useMemo(() => (
    [...snapshots]
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
      .map((s) => ({
        label: `${formatDate(s.date)} ${formatTime(s.created_at)}`,
        total: s.acoes + s.fiis + s.cripto + s.internacional + s.renda_fixa + (s.reserva_oportunidade ?? 0),
        acoes: s.acoes,
        fiis: s.fiis,
        cripto: s.cripto,
        internacional: s.internacional,
        renda_fixa: s.renda_fixa,
        reserva_oportunidade: s.reserva_oportunidade ?? 0,
      }))
  ), [snapshots])

  if (data.length < 2) return null

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="mb-4 text-sm font-medium text-foreground">Evolução do Portfólio</p>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} stroke="hsl(var(--muted-foreground))" interval={0} angle={-35} textAnchor="end" height={50} />
          <YAxis tickFormatter={(v) => hideValues ? 'R$ ••••' : formatBRL(v)} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} stroke="hsl(var(--muted-foreground))" width={60} />
          <Tooltip
            formatter={(value: unknown) =>
              hideValues ? '••••••' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value as number)
            }
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              fontSize: 12,
              color: 'hsl(var(--foreground))',
            }}
            labelStyle={{ color: 'hsl(var(--foreground))' }}
            itemStyle={{ color: 'hsl(var(--muted-foreground))' }}
          />
          <Legend wrapperStyle={{ fontSize: 12, color: 'hsl(var(--foreground))' }} />
          <Line dataKey="total" name="Total" stroke="#94a3b8" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} strokeDasharray="4 2" />
          {CATEGORIES.map((c) => (
            <Line
              key={c.key}
              dataKey={c.key}
              name={c.label}
              stroke={c.color}
              strokeWidth={1.5}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
