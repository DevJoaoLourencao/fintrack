import { useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import type { TooltipProps, PieLabelRenderProps } from 'recharts'
import * as Dialog from '@radix-ui/react-dialog'
import { Cross2Icon, GearIcon } from '@radix-ui/react-icons'
import type { AssetCategory } from '@/domain'
import { useAllocationTargetsQuery, useSaveAllocationTargets } from '@/hooks/useAllocationTargets'

const CATEGORIES: { key: AssetCategory; label: string; color: string }[] = [
  { key: 'acoes',                label: 'Ações',                    color: '#6366f1' },
  { key: 'fiis',                 label: 'FIIs',                     color: '#f59e0b' },
  { key: 'cripto',               label: 'Cripto',                   color: '#f97316' },
  { key: 'internacional',        label: 'Internacional',            color: '#8b5cf6' },
  { key: 'renda_fixa',           label: 'Renda Fixa',              color: '#10b981' },
  { key: 'reserva_oportunidade', label: 'Reserva de Oportunidade', color: '#06b6d4' },
]

interface ChartEntry {
  name: string
  value: number
  color: string
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
      <p className="text-xs text-neutral-400">{entry.value.toFixed(1)}% da meta</p>
    </div>
  )
}

function CustomLabel({ cx, cy, midAngle, innerRadius, outerRadius, payload }: PieLabelRenderProps & { payload: ChartEntry }) {
  const pct = (payload as ChartEntry & { value: number }).value
  if (pct < 4) return null
  const RADIAN = Math.PI / 180
  const r = Number(innerRadius) + (Number(outerRadius) - Number(innerRadius)) * 0.5
  const x = Number(cx) + r * Math.cos(-Number(midAngle) * RADIAN)
  const y = Number(cy) + r * Math.sin(-Number(midAngle) * RADIAN)
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {`${pct.toFixed(0)}%`}
    </text>
  )
}

function ConfigDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { data: targets = [] } = useAllocationTargetsQuery()
  const save = useSaveAllocationTargets()

  const initial = Object.fromEntries(
    CATEGORIES.map((c) => {
      const t = targets.find((t) => t.category === c.key)
      return [c.key, t ? String(t.target_pct) : '0']
    })
  )
  const [values, setValues] = useState<Record<string, string>>(initial)

  const sum = CATEGORIES.reduce((s, c) => s + (parseFloat(values[c.key]) || 0), 0)
  const isValid = Math.abs(sum - 100) < 0.01

  function handleOpen(o: boolean) {
    if (o) {
      setValues(
        Object.fromEntries(
          CATEGORIES.map((c) => {
            const t = targets.find((t) => t.category === c.key)
            return [c.key, t ? String(t.target_pct) : '0']
          })
        )
      )
    }
    onOpenChange(o)
  }

  function handleSave() {
    const parsed = CATEGORIES.map((c) => ({
      category: c.key,
      target_pct: parseFloat(values[c.key]) || 0,
    }))
    save.mutate(parsed, { onSuccess: () => onOpenChange(false) })
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-6 shadow-xl focus:outline-none">
          <div className="flex items-center justify-between mb-5">
            <Dialog.Title className="text-base font-semibold text-foreground">Metas de Alocação</Dialog.Title>
            <Dialog.Close asChild>
              <button type="button" className="rounded-md p-1 text-muted-foreground hover:text-foreground">
                <Cross2Icon className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          <p className="text-xs text-muted-foreground mb-4">
            Defina o percentual alvo para cada categoria. A soma deve ser 100%.
          </p>

          <div className="space-y-3">
            {CATEGORIES.map((c) => (
              <div key={c.key} className="flex items-center gap-3">
                <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ backgroundColor: c.color }} />
                <span className="flex-1 text-sm text-foreground">{c.label}</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.5}
                    value={values[c.key]}
                    onChange={(e) => setValues((v) => ({ ...v, [c.key]: e.target.value }))}
                    className="w-16 rounded-md border border-border bg-background px-2 py-1 text-right text-sm tabular-nums text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
              </div>
            ))}
          </div>

          <div className={`mt-4 flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium ${
            isValid ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
          }`}>
            <span>Total</span>
            <span className="tabular-nums">{sum.toFixed(1)}%</span>
          </div>

          <div className="mt-5 flex gap-2 justify-end">
            <Dialog.Close asChild>
              <button type="button" className="rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-muted">
                Cancelar
              </button>
            </Dialog.Close>
            <button
              type="button"
              onClick={handleSave}
              disabled={save.isPending}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {save.isPending ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export function AllocationTargetChart() {
  const { data: targets = [], isLoading } = useAllocationTargetsQuery()
  const [configOpen, setConfigOpen] = useState(false)

  const data = CATEGORIES
    .map((c) => {
      const t = targets.find((t) => t.category === c.key)
      return { name: c.label, value: t?.target_pct ?? 0, color: c.color }
    })
    .filter((d) => d.value > 0)

  return (
    <>
      <div className="rounded-2xl border border-border/50 bg-card p-4 shadow-card-md">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-medium text-foreground">Meta de Alocação</p>
          <button
            type="button"
            onClick={() => setConfigOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          >
            <GearIcon className="h-3.5 w-3.5" />
            Configurar
          </button>
        </div>

        {isLoading && <div className="h-[240px] animate-pulse rounded-xl bg-muted" />}

        {!isLoading && data.length === 0 && (
          <div className="flex h-[240px] flex-col items-center justify-center gap-2 text-center">
            <p className="text-sm text-muted-foreground">Nenhuma meta configurada.</p>
            <button
              type="button"
              onClick={() => setConfigOpen(true)}
              className="text-xs text-primary hover:underline"
            >
              Configurar metas →
            </button>
          </div>
        )}

        {!isLoading && data.length > 0 && (
          <>
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
            <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1.5">
              {data.map((entry) => (
                <div key={entry.name} className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
                  <span className="text-xs text-muted-foreground">{entry.name}</span>
                  <span className="text-xs font-semibold tabular-nums text-foreground">{entry.value.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <ConfigDialog open={configOpen} onOpenChange={setConfigOpen} />
    </>
  )
}
