import { useState } from 'react'
import { DotsHorizontalIcon, MinusIcon, TrashIcon } from '@radix-ui/react-icons'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { clsx } from 'clsx'
import type { RichVehicleSale } from '@/domain'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/features/ConfirmDialog'
import { useMarkInstallmentPaid, useUnmarkInstallmentPaid, useRemoveVehicleSale } from '@/hooks/useVehicles'
import { formatCurrency } from '@/lib/dateUtils'

interface Props {
  sales: RichVehicleSale[]
  isLoading: boolean
}

export function VehicleReceivablesTab({ sales, isLoading }: Props) {
  const [confirmCancel, setConfirmCancel] = useState<RichVehicleSale | null>(null)
  const markPaid = useMarkInstallmentPaid()
  const unmarkPaid = useUnmarkInstallmentPaid()
  const removeSale = useRemoveVehicleSale()

  const totalRemaining = sales.reduce(
    (sum, s) => sum + (s.installments_count - s.installments_paid) * s.installments_amount,
    0
  )

  return (
    <div className="space-y-4">
      {sales.length > 0 && (
        <p className="text-sm text-muted-foreground">
          {sales.length} {sales.length === 1 ? 'venda' : 'vendas'} com parcelas pendentes ·{' '}
          <span className="font-medium text-foreground">{formatCurrency(totalRemaining)} a receber</span>
        </p>
      )}

      {isLoading && (
        <div className="space-y-3">
          {[0, 1].map((i) => (
            <div key={i} className="h-28 rounded-xl border border-border bg-card animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && sales.length === 0 && (
        <div className="py-12 text-center text-sm text-muted-foreground">
          Nenhuma venda com parcelas pendentes.
        </div>
      )}

      {!isLoading && sales.map((sale) => {
        const remaining = sale.installments_count - sale.installments_paid
        const progressPct = sale.installments_count > 0
          ? (sale.installments_paid / sale.installments_count) * 100
          : 100
        const remainingValue = remaining * sale.installments_amount
        const canUnmark = sale.installments_paid > 0

        return (
          <div key={sale.id} className="rounded-xl border border-border bg-card p-4 space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-foreground">{sale.vehicle.name}</p>
                <p className="text-xs text-muted-foreground">
                  Vendido por {formatCurrency(sale.total_sale_price)}
                  {sale.sale_date && ` · comprado por ${formatCurrency(sale.vehicle.purchase_price)}`}
                </p>
              </div>

              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <button
                    type="button"
                    className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    aria-label="Opções"
                  >
                    <DotsHorizontalIcon className="h-4 w-4" />
                  </button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content
                    align="end"
                    sideOffset={4}
                    className="z-50 min-w-[200px] rounded-lg border border-border bg-card p-1 shadow-lg animate-in fade-in-0 zoom-in-95"
                  >
                    <DropdownMenu.Item
                      onSelect={() => canUnmark && unmarkPaid.mutate(sale)}
                      disabled={!canUnmark}
                      className={clsx(
                        'flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm outline-none',
                        canUnmark
                          ? 'text-foreground hover:bg-muted focus:bg-muted'
                          : 'cursor-not-allowed text-muted-foreground opacity-50'
                      )}
                    >
                      <MinusIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      Remover parcela {sale.installments_paid}
                    </DropdownMenu.Item>
                    <DropdownMenu.Separator className="my-1 h-px bg-border" />
                    <DropdownMenu.Item
                      onSelect={() => setConfirmCancel(sale)}
                      className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-red-500 outline-none hover:bg-red-500/10 focus:bg-red-500/10"
                    >
                      <TrashIcon className="h-3.5 w-3.5" />
                      Cancelar venda
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            </div>

            {/* Breakdown */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {sale.cash_amount > 0 && (
                <span>{formatCurrency(sale.cash_amount)} à vista</span>
              )}
              {sale.installments_count > 0 && (
                <span>{sale.installments_count}x de {formatCurrency(sale.installments_amount)}</span>
              )}
              {sale.trade_description && (
                <span>Troca: {sale.trade_description}{sale.trade_value > 0 && ` (${formatCurrency(sale.trade_value)})`}</span>
              )}
            </div>

            {/* Progress bar */}
            {sale.installments_count > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    {sale.installments_paid}/{sale.installments_count} parcelas recebidas
                  </span>
                  <span className={clsx(
                    'font-medium tabular-nums',
                    remaining > 0 ? 'text-foreground' : 'text-green-500'
                  )}>
                    {remaining > 0 ? `${formatCurrency(remainingValue)} restantes` : 'Quitado'}
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-primary transition-all duration-300"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
            )}

            {/* Action */}
            {remaining > 0 && (
              <Button
                variant="ghost"
                className="w-full border border-border text-xs"
                loading={markPaid.isPending}
                onClick={() => markPaid.mutate(sale)}
              >
                Marcar parcela {sale.installments_paid + 1}/{sale.installments_count} como recebida
              </Button>
            )}
          </div>
        )
      })}

      <ConfirmDialog
        open={!!confirmCancel}
        onOpenChange={(o) => { if (!o) setConfirmCancel(null) }}
        title="Cancelar venda"
        description={`A venda de "${confirmCancel?.vehicle.name}" será cancelada e o veículo voltará ao estoque.`}
        confirmLabel="Cancelar venda"
        onConfirm={() => {
          if (confirmCancel) {
            removeSale.mutate(
              { saleId: confirmCancel.id, vehicleId: confirmCancel.vehicle_id },
              { onSuccess: () => setConfirmCancel(null) }
            )
          }
        }}
        loading={removeSale.isPending}
      />
    </div>
  )
}
