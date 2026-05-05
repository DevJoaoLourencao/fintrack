import { useMemo } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { useInvestmentAssetsQuery } from '@/hooks/useInvestments'
import { useExchangeRate } from '@/hooks/useExchangeRate'
import { useBrapiQuotes, useBrapiCryptoQuotes } from '@/hooks/useBrapiQuotes'
import { useVehiclesQuery } from '@/hooks/useVehicles'
import { usePersonalAssetsQuery } from '@/hooks/usePersonalAssets'
import type { InvestmentAsset, AssetCategory } from '@/domain'
import { formatCurrency } from '@/lib/dateUtils'
import { useNavStore } from '@/stores/navStore'

const SLICES = [
  { key: 'acoes',                label: 'Ações',                    color: '#6366f1' },
  { key: 'fiis',                 label: 'FIIs',                     color: '#f59e0b' },
  { key: 'cripto',               label: 'Cripto',                   color: '#f97316' },
  { key: 'internacional',        label: 'Internacional',            color: '#8b5cf6' },
  { key: 'renda_fixa',           label: 'Renda Fixa',              color: '#10b981' },
  { key: 'reserva_oportunidade', label: 'Reserva de Oportunidade', color: '#06b6d4' },
  { key: 'veiculos',             label: 'Veículos',                 color: '#3b82f6' },
  { key: 'bens',                 label: 'Bens Pessoais',            color: '#ec4899' },
]

const HIDDEN = '••••••'

interface TooltipProps {
  active?: boolean
  payload?: { name: string; value: number; payload: { color: string } }[]
  hideValues: boolean
}

function CustomTooltip({ active, payload, hideValues }: TooltipProps) {
  if (!active || !payload?.length) return null
  const { name, value, payload: { color } } = payload[0]
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-lg">
      <div className="flex items-center gap-1.5 mb-0.5">
        <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
        <span className="font-medium text-foreground">{name}</span>
      </div>
      <span className="tabular-nums text-muted-foreground">
        {hideValues ? HIDDEN : formatCurrency(value)}
      </span>
    </div>
  )
}

const BRAPI_STOCK_CATS: AssetCategory[] = ['acoes', 'fiis', 'internacional']

function useLiveBrl(assets: InvestmentAsset[], usdRate: number | undefined) {
  const stockTickers = assets
    .filter((a) => BRAPI_STOCK_CATS.includes(a.category))
    .map((a) => a.name.toUpperCase().trim())
  const cryptoTickers = assets
    .filter((a) => a.category === 'cripto')
    .map((a) => a.name.toUpperCase().trim())
  const { data: quotes = [] } = useBrapiQuotes(stockTickers)
  const { data: cryptoQuotes = [] } = useBrapiCryptoQuotes(cryptoTickers)
  const quoteMap = useMemo(() => new Map([
    ...quotes.map((q) => [q.symbol.toUpperCase(), q.regularMarketPrice] as const),
    ...cryptoQuotes.map((q) => [q.symbol.toUpperCase(), q.regularMarketPrice] as const),
  ]), [quotes, cryptoQuotes])
  return (asset: InvestmentAsset) => {
    const livePrice = quoteMap.get(asset.name.toUpperCase().trim())
    const amount = livePrice != null && asset.quantity != null ? asset.quantity * livePrice : asset.amount
    if (asset.currency === 'USD' && usdRate) return amount * usdRate
    return amount
  }
}

export function PatrimonioChart({ hideValues }: { hideValues: boolean }) {
  const { isVisible } = useNavStore()
  const showInv  = isVisible('investimentos')
  const showMot  = isVisible('motos')
  const showBens = isVisible('bens')

  const { data: assets = [], isLoading: l1 } = useInvestmentAssetsQuery()
  const { data: usdRate } = useExchangeRate()
  const { data: vehicles = [], isLoading: l2 } = useVehiclesQuery()
  const { data: personalAssets = [], isLoading: l3 } = usePersonalAssetsQuery()
  const toBrl = useLiveBrl(assets, usdRate)

  const isLoading = l1 || l2 || l3

  const { slices, total } = useMemo(() => {
    const inv: Record<string, number> = {}
    if (showInv) {
      for (const a of assets) {
        inv[a.category] = (inv[a.category] ?? 0) + toBrl(a)
      }
    }

    const veiculos = showMot
      ? vehicles.filter((v) => v.status === 'active').reduce((s, v) => s + v.purchase_price, 0)
      : 0

    const bens = showBens
      ? personalAssets.reduce((s, a) => s + (a.current_value ?? a.purchase_value), 0)
      : 0

    const values: Record<string, number> = {
      acoes:                inv['acoes']                ?? 0,
      fiis:                 inv['fiis']                 ?? 0,
      cripto:               inv['cripto']               ?? 0,
      internacional:        inv['internacional']        ?? 0,
      renda_fixa:           inv['renda_fixa']           ?? 0,
      reserva_oportunidade: inv['reserva_oportunidade'] ?? 0,
      veiculos,
      bens,
    }

    const sum = Object.values(values).reduce((s, v) => s + v, 0)

    const slices = SLICES
      .map((s) => ({ ...s, value: values[s.key] }))
      .filter((s) => s.value > 0)

    return { slices, total: sum }
  }, [assets, usdRate, vehicles, personalAssets, showInv, showMot, showBens])

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border/50 bg-card shadow-card-md p-4 h-[280px] animate-pulse" />
    )
  }

  if (slices.length === 0) {
    return (
      <div className="rounded-2xl border border-border/50 bg-card shadow-card-md p-4 flex flex-col h-[280px]">
        <p className="text-sm font-medium text-foreground mb-3">Distribuição do Patrimônio</p>
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-muted-foreground">Nenhum patrimônio cadastrado.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-border/50 bg-card shadow-card-md p-4">
      <p className="text-sm font-medium text-foreground mb-3">Distribuição do Patrimônio</p>
      <div className="flex items-center gap-4">
        {/* Pie */}
        <div style={{ width: 160, height: 160, flexShrink: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={slices}
                dataKey="value"
                nameKey="label"
                cx="50%"
                cy="50%"
                innerRadius={46}
                outerRadius={72}
                paddingAngle={2}
                strokeWidth={0}
              >
                {slices.map((s) => (
                  <Cell key={s.key} fill={s.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip hideValues={hideValues} />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-1.5 min-w-0">
          {slices.map((s) => {
            const pct = total > 0 ? (s.value / total) * 100 : 0
            return (
              <div key={s.key} className="flex items-center gap-1.5 min-w-0">
                <span className="h-2 w-2 flex-shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="truncate text-xs text-muted-foreground">{s.label}</span>
                <span className="ml-auto flex-shrink-0 tabular-nums text-xs font-medium text-foreground">
                  {hideValues ? HIDDEN : `${pct.toFixed(0)}%`}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Total */}
      <div className="mt-3 border-t border-border pt-3 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Total patrimônio</span>
        <span className="text-sm font-bold tabular-nums text-foreground">
          {hideValues ? HIDDEN : formatCurrency(total)}
        </span>
      </div>
    </div>
  )
}
