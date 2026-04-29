import { formatCurrency } from '@/lib/dateUtils'

const HIDDEN_VALUE = '••••••'

interface SummaryCardsProps {
  totalGasto: number
  totalPago: number
  totalPendente: number
  isLoading?: boolean
  hideValues?: boolean
}

interface TileProps {
  label: string
  value: number
  valueClass: string
  accentClass: string
  hideValues: boolean
}

function Tile({ label, value, valueClass, accentClass, hideValues }: TileProps) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-card px-5 py-5 shadow-card">
      <div className={`absolute inset-y-0 left-0 w-[3px] ${accentClass}`} />
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${valueClass}`}>
        {hideValues ? HIDDEN_VALUE : formatCurrency(value)}
      </p>
    </div>
  )
}

export function SummaryCards({ totalGasto, totalPago, totalPendente, isLoading, hideValues = false }: SummaryCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="relative overflow-hidden rounded-xl border border-border bg-card px-5 py-5 shadow-card animate-pulse">
            <div className="mb-3 h-3 w-24 rounded bg-muted" />
            <div className="h-7 w-32 rounded bg-muted" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <Tile label="Total gasto"    value={totalGasto}    valueClass="text-foreground" accentClass="bg-primary" hideValues={hideValues} />
      <Tile label="Total pago"     value={totalPago}     valueClass="text-success"    accentClass="bg-success" hideValues={hideValues} />
      <Tile label="Total pendente" value={totalPendente} valueClass="text-warning"    accentClass="bg-warning" hideValues={hideValues} />
    </div>
  )
}
