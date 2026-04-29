import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRightIcon } from '@radix-ui/react-icons'
import { clsx } from 'clsx'
import { useInvestmentAssetsQuery } from '@/hooks/useInvestments'
import { useExchangeRate } from '@/hooks/useExchangeRate'
import { useVehiclesQuery, useVehicleSalesQuery } from '@/hooks/useVehicles'
import { usePersonalAssetsQuery } from '@/hooks/usePersonalAssets'
import { PERSONAL_ASSET_CATEGORIES } from '@/components/features/assets/PersonalAssetDialog'
import { formatCurrency } from '@/lib/dateUtils'

const CATEGORIES: { key: string; label: string; color: string }[] = [
  { key: 'acoes',         label: 'Ações',        color: '#6366f1' },
  { key: 'fiis',          label: 'FIIs',          color: '#f59e0b' },
  { key: 'cripto',        label: 'Cripto',        color: '#f97316' },
  { key: 'internacional', label: 'Internacional', color: '#8b5cf6' },
  { key: 'renda_fixa',    label: 'Renda Fixa',   color: '#10b981' },
]

const HIDDEN_VALUE = '••••••'

function WidgetCard({
  title,
  to,
  isLoading,
  children,
}: {
  title: string
  to: string
  isLoading?: boolean
  children: React.ReactNode
}) {
  const navigate = useNavigate()
  return (
    <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <button
          type="button"
          onClick={() => navigate(to)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Ver mais <ArrowRightIcon className="h-3 w-3" />
        </button>
      </div>
      {isLoading ? (
        <div className="space-y-2">
          <div className="h-5 w-32 animate-pulse rounded bg-muted" />
          <div className="h-3 w-20 animate-pulse rounded bg-muted" />
          <div className="h-3 w-28 animate-pulse rounded bg-muted" />
        </div>
      ) : (
        children
      )}
    </div>
  )
}

function Divider() {
  return <div className="h-px bg-border" />
}

// ── Investimentos ─────────────────────────────────────────────────────────────

function InvestimentosWidget({ hideValues }: { hideValues: boolean }) {
  const { data: assets = [], isLoading } = useInvestmentAssetsQuery()
  const { data: usdRate } = useExchangeRate()

  const { total, byCategory } = useMemo(() => {
    const cats: Record<string, number> = {}
    let sum = 0
    for (const a of assets) {
      const brl = a.currency === 'USD' && usdRate ? a.amount * usdRate : a.amount
      sum += brl
      cats[a.category] = (cats[a.category] ?? 0) + brl
    }
    const sorted = CATEGORIES
      .map((c) => ({ ...c, value: cats[c.key] ?? 0 }))
      .filter((c) => c.value > 0)
    return { total: sum, byCategory: sorted }
  }, [assets, usdRate])

  return (
    <WidgetCard title="Investimentos" to="/investimentos" isLoading={isLoading}>
      <div>
        <p className="text-xs text-muted-foreground">Patrimônio total</p>
        <p className="text-xl font-bold tabular-nums text-foreground">
          {hideValues ? HIDDEN_VALUE : formatCurrency(total)}
        </p>
      </div>

      {byCategory.length > 0 && (
        <>
          <Divider />
          <div className="space-y-2">
            {byCategory.map((cat) => {
              const pct = total > 0 ? (cat.value / total) * 100 : 0
              return (
                <div key={cat.key}>
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                      <span className="text-xs text-muted-foreground">{cat.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs tabular-nums text-foreground">
                        {hideValues ? HIDDEN_VALUE : formatCurrency(cat.value)}
                      </span>
                      <span className="text-xs font-semibold tabular-nums text-muted-foreground w-8 text-right">
                        {pct.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: cat.color }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {assets.length === 0 && (
        <p className="text-xs text-muted-foreground">Nenhum ativo cadastrado.</p>
      )}
    </WidgetCard>
  )
}

// ── Veículos ──────────────────────────────────────────────────────────────────

function VeiculosWidget({ hideValues }: { hideValues: boolean }) {
  const { data: vehicles = [], isLoading: loadingV } = useVehiclesQuery()
  const { data: sales = [], isLoading: loadingS } = useVehicleSalesQuery()

  const active = vehicles.filter((v) => v.status === 'active')
  const pending = sales.filter((s) => !s.completed)
  const completed = sales.filter((s) => s.completed)

  const totalInvested = active.reduce((s, v) => s + v.purchase_price, 0)
  const totalReceivable = pending.reduce(
    (s, sale) => s + (sale.installments_count - sale.installments_paid) * sale.installments_amount, 0
  )
  const totalProfit = completed.reduce(
    (s, sale) => s + (sale.total_sale_price - sale.vehicle.purchase_price), 0
  )

  const isLoading = loadingV || loadingS

  return (
    <WidgetCard title="Veículos" to="/motos" isLoading={isLoading}>
      {/* Em estoque — destaque principal */}
      <div>
        <p className="text-xs text-muted-foreground">Em estoque</p>
        <p className="text-xl font-bold tabular-nums text-foreground">
          {hideValues ? HIDDEN_VALUE : formatCurrency(totalInvested)}
        </p>
        <p className="text-xs text-muted-foreground">
          {active.length} {active.length === 1 ? 'veículo' : 'veículos'}
        </p>
      </div>

      <Divider />

      {/* A receber + Lucro lado a lado */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-muted-foreground">A receber</p>
          <p className="text-sm font-bold tabular-nums text-foreground">
            {hideValues ? HIDDEN_VALUE : formatCurrency(totalReceivable)}
          </p>
          <p className="text-xs text-muted-foreground">
            {pending.length} {pending.length === 1 ? 'venda' : 'vendas'}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Lucro realizado</p>
          <p className={clsx(
            'text-sm font-bold tabular-nums',
            completed.length === 0 ? 'text-foreground' :
            totalProfit >= 0 ? 'text-green-500' : 'text-red-500'
          )}>
            {hideValues ? HIDDEN_VALUE : completed.length > 0 ? (totalProfit >= 0 ? '+' : '') + formatCurrency(totalProfit) : '—'}
          </p>
          <p className="text-xs text-muted-foreground">
            {completed.length} {completed.length === 1 ? 'concluída' : 'concluídas'}
          </p>
        </div>
      </div>
    </WidgetCard>
  )
}

// ── Bens Pessoais ─────────────────────────────────────────────────────────────

function BensWidget({ hideValues }: { hideValues: boolean }) {
  const { data: assets = [], isLoading } = usePersonalAssetsQuery()

  const { total, byCategory } = useMemo(() => {
    const cats: Record<string, number> = {}
    let sum = 0
    for (const a of assets) {
      const val = a.current_value ?? a.purchase_value
      sum += val
      cats[a.category] = (cats[a.category] ?? 0) + val
    }
    const sorted = PERSONAL_ASSET_CATEGORIES
      .map((c) => ({ ...c, value: cats[c.key] ?? 0 }))
      .filter((c) => c.value > 0)
    return { total: sum, byCategory: sorted }
  }, [assets])

  return (
    <WidgetCard title="Meus Bens" to="/bens" isLoading={isLoading}>
      <div>
        <p className="text-xs text-muted-foreground">Valor total dos bens</p>
        <p className="text-xl font-bold tabular-nums text-foreground">
          {hideValues ? HIDDEN_VALUE : formatCurrency(total)}
        </p>
        <p className="text-xs text-muted-foreground">
          {assets.length} {assets.length === 1 ? 'bem' : 'bens'}
        </p>
      </div>

      {byCategory.length > 0 && (
        <>
          <Divider />
          <div className="space-y-2">
            {byCategory.map((cat) => {
              const pct = total > 0 ? (cat.value / total) * 100 : 0
              return (
                <div key={cat.key}>
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                      <span className="text-xs text-muted-foreground">{cat.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs tabular-nums text-foreground">
                        {hideValues ? HIDDEN_VALUE : formatCurrency(cat.value)}
                      </span>
                      <span className="text-xs font-semibold tabular-nums text-muted-foreground w-8 text-right">
                        {pct.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: cat.color }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {assets.length === 0 && (
        <p className="text-xs text-muted-foreground">Nenhum bem cadastrado.</p>
      )}
    </WidgetCard>
  )
}

// ── Patrimônio Total ──────────────────────────────────────────────────────────

function PatrimonioWidget({ hideValues }: { hideValues: boolean }) {
  const { data: assets = [], isLoading: loadingAssets } = useInvestmentAssetsQuery()
  const { data: usdRate } = useExchangeRate()
  const { data: vehicles = [], isLoading: loadingVehicles } = useVehiclesQuery()
  const { data: personalAssets = [], isLoading: loadingPersonal } = usePersonalAssetsQuery()

  const totalInvestimentos = useMemo(() => {
    return assets.reduce((sum, a) => {
      const brl = a.currency === 'USD' && usdRate ? a.amount * usdRate : a.amount
      return sum + brl
    }, 0)
  }, [assets, usdRate])

  const activeVehicles = vehicles.filter((v) => v.status === 'active')
  const totalVeiculos = activeVehicles.reduce((s, v) => s + v.purchase_price, 0)
  const totalBens = personalAssets.reduce((s, a) => s + (a.current_value ?? a.purchase_value), 0)
  const totalGeral = totalInvestimentos + totalVeiculos + totalBens

  const isLoading = loadingAssets || loadingVehicles || loadingPersonal

  const lines = [
    { label: 'Investimentos',      value: totalInvestimentos, color: 'bg-primary' },
    { label: 'Veículos em estoque', value: totalVeiculos,      color: 'bg-amber-500' },
    { label: 'Bens pessoais',      value: totalBens,          color: 'bg-pink-500' },
  ].filter((l) => l.value > 0)

  return (
    <WidgetCard title="Patrimônio Total" to="/investimentos" isLoading={isLoading}>
      <div>
        <p className="text-xs text-muted-foreground">Total consolidado</p>
        <p className="text-xl font-bold tabular-nums text-foreground">
          {hideValues ? HIDDEN_VALUE : formatCurrency(totalGeral)}
        </p>
      </div>

      <Divider />

      <div className="space-y-2">
        {lines.map((l) => {
          const pct = totalGeral > 0 ? (l.value / totalGeral) * 100 : 0
          return (
            <div key={l.label}>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-xs text-muted-foreground">{l.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs tabular-nums text-foreground">{hideValues ? HIDDEN_VALUE : formatCurrency(l.value)}</span>
                  <span className="text-xs font-semibold text-muted-foreground w-8 text-right">{pct.toFixed(0)}%</span>
                </div>
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div className={`h-full rounded-full ${l.color} transition-all`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          )
        })}
      </div>
    </WidgetCard>
  )
}

// ── Export ────────────────────────────────────────────────────────────────────

export function OverviewWidgets({ hideValues }: { hideValues: boolean }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Visão Geral</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <InvestimentosWidget hideValues={hideValues} />
        <VeiculosWidget hideValues={hideValues} />
        <BensWidget hideValues={hideValues} />
        <PatrimonioWidget hideValues={hideValues} />
      </div>
    </div>
  )
}
