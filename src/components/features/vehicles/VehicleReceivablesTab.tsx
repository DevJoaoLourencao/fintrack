import { useState } from 'react'
import { DotsHorizontalIcon, MinusIcon, TrashIcon, MagnifyingGlassIcon, PlusIcon } from '@radix-ui/react-icons'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import * as Dialog from '@radix-ui/react-dialog'
import { clsx } from 'clsx'
import type { RichVehicleSale } from '@/domain'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/features/ConfirmDialog'
import { useMarkInstallmentPaid, useUnmarkInstallmentPaid, useRemoveVehicleSale, useAddExtraPayment } from '@/hooks/useVehicles'
import { formatCurrency } from '@/lib/dateUtils'
import { useHideValuesStore } from '@/stores/hideValuesStore'

const HIDDEN_VALUE = '••••••'

interface Props {
  sales: RichVehicleSale[]
  isLoading: boolean
}

function ExtraPaymentDialog({
  sale,
  open,
  onOpenChange,
}: {
  sale: RichVehicleSale
  open: boolean
  onOpenChange: (o: boolean) => void
}) {
  const [value, setValue] = useState('')
  const addExtra = useAddExtraPayment()
  const amount = parseFloat(value.replace(',', '.'))
  const isValid = !isNaN(amount) && amount > 0

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValid) return
    addExtra.mutate(
      { saleId: sale.id, currentExtraPaid: sale.extra_paid, amount },
      { onSuccess: () => { onOpenChange(false); setValue('') } }
    )
  }

  return (
    <Dialog.Root open={open} onOpenChange={(o) => { if (!o) setValue(''); onOpenChange(o) }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border/50 bg-card p-6 shadow-card-lg focus:outline-none">
          <Dialog.Title className="mb-1 text-base font-semibold text-foreground">
            Pagamento avulso
          </Dialog.Title>
          <p className="mb-4 text-xs text-muted-foreground">
            {sale.vehicle.name} · valor será descontado do saldo restante sem alterar o parcelamento.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground">Valor recebido (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                autoFocus
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Ex: 500,00"
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            </div>

            {sale.extra_paid > 0 && (
              <p className="text-xs text-muted-foreground">
                Já pago avulso anteriormente: <span className="font-medium text-foreground">{formatCurrency(sale.extra_paid)}</span>
              </p>
            )}

            <div className="flex justify-end gap-3 pt-1">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={addExtra.isPending}>
                Cancelar
              </Button>
              <Button type="submit" loading={addExtra.isPending} disabled={!isValid}>
                Registrar
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export function VehicleReceivablesTab({ sales, isLoading }: Props) {
  const { hideValues } = useHideValuesStore()
  const [confirmCancel, setConfirmCancel] = useState<RichVehicleSale | null>(null)
  const [extraPaymentSale, setExtraPaymentSale] = useState<RichVehicleSale | null>(null)
  const [search, setSearch] = useState('')
  const markPaid = useMarkInstallmentPaid()
  const unmarkPaid = useUnmarkInstallmentPaid()
  const removeSale = useRemoveVehicleSale()

  const filtered = search
    ? sales.filter((s) => s.vehicle.name.toLowerCase().includes(search.toLowerCase()))
    : sales

  const totalRemaining = filtered.reduce(
    (sum, s) => sum + Math.max(0, (s.installments_count - s.installments_paid) * s.installments_amount - s.extra_paid),
    0
  )

  return (
    <div className="space-y-4">
      <div className="relative max-w-xs">
        <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar veículo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-border bg-background pl-8 pr-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {filtered.length > 0 && (
        <p className="text-sm text-muted-foreground">
          {filtered.length} {filtered.length === 1 ? 'venda' : 'vendas'} com parcelas pendentes ·{' '}
          <span className="font-medium text-foreground">{hideValues ? HIDDEN_VALUE : formatCurrency(totalRemaining)} a receber</span>
        </p>
      )}

      {isLoading && (
        <div className="space-y-3">
          {[0, 1].map((i) => (
            <div key={i} className="h-28 rounded-xl border border-border bg-card animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="py-12 text-center text-sm text-muted-foreground">
          {search ? 'Nenhuma venda encontrada.' : 'Nenhuma venda com parcelas pendentes.'}
        </div>
      )}

      {!isLoading && filtered.map((sale) => {
        const remaining = sale.installments_count - sale.installments_paid
        const progressPct = sale.installments_count > 0
          ? (sale.installments_paid / sale.installments_count) * 100
          : 100
        const grossRemaining = remaining * sale.installments_amount
        const remainingValue = Math.max(0, grossRemaining - sale.extra_paid)
        const canUnmark = sale.installments_paid > 0

        return (
          <div key={sale.id} className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-foreground">{sale.vehicle.name}</p>
                <p className="text-xs text-muted-foreground">
                  Vendido por {hideValues ? HIDDEN_VALUE : formatCurrency(sale.total_sale_price)}
                  {sale.sale_date && ` · comprado por ${hideValues ? HIDDEN_VALUE : formatCurrency(sale.vehicle.purchase_price)}`}
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
                      onSelect={() => setExtraPaymentSale(sale)}
                      className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground outline-none hover:bg-muted focus:bg-muted"
                    >
                      <PlusIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      Pagamento avulso
                    </DropdownMenu.Item>
                    <DropdownMenu.Separator className="my-1 h-px bg-border" />
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

            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {sale.cash_amount > 0 && (
                <span>{hideValues ? HIDDEN_VALUE : formatCurrency(sale.cash_amount)} à vista</span>
              )}
              {sale.installments_count > 0 && (
                <span>{sale.installments_count}x de {hideValues ? HIDDEN_VALUE : formatCurrency(sale.installments_amount)}</span>
              )}
              {sale.trade_description && (
                <span>Troca: {sale.trade_description}{sale.trade_value > 0 && ` (${hideValues ? HIDDEN_VALUE : formatCurrency(sale.trade_value)})`}</span>
              )}
              {sale.extra_paid > 0 && (
                <span className="text-primary font-medium">
                  + {hideValues ? HIDDEN_VALUE : formatCurrency(sale.extra_paid)} avulso recebido
                </span>
              )}
            </div>

            {sale.installments_count > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    {sale.installments_paid}/{sale.installments_count} parcelas recebidas
                  </span>
                  <span className={clsx(
                    'font-medium tabular-nums',
                    remainingValue > 0 ? 'text-foreground' : 'text-green-500'
                  )}>
                    {remainingValue > 0
                      ? `${hideValues ? HIDDEN_VALUE : formatCurrency(remainingValue)} restantes`
                      : 'Quitado'}
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-primary transition-all duration-300"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                {sale.extra_paid > 0 && grossRemaining > 0 && (
                  <p className="text-[11px] text-muted-foreground">
                    Bruto: {hideValues ? HIDDEN_VALUE : formatCurrency(grossRemaining)} · desconto avulso: {hideValues ? HIDDEN_VALUE : formatCurrency(sale.extra_paid)}
                  </p>
                )}
              </div>
            )}

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

      {extraPaymentSale && (
        <ExtraPaymentDialog
          sale={extraPaymentSale}
          open={!!extraPaymentSale}
          onOpenChange={(o) => { if (!o) setExtraPaymentSale(null) }}
        />
      )}

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
