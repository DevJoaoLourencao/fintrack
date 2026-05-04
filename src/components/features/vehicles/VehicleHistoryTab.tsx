import { useState } from 'react'
import { DotsHorizontalIcon, Pencil1Icon, TrashIcon, MagnifyingGlassIcon } from '@radix-ui/react-icons'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { clsx } from 'clsx'
import type { RichVehicleSale } from '@/domain'
import { ConfirmDialog } from '@/components/features/ConfirmDialog'
import { EditSaleDialog } from './EditSaleDialog'
import { useRemoveVehicleSale } from '@/hooks/useVehicles'
import { formatCurrency, formatDate } from '@/lib/dateUtils'
import { useHideValuesStore } from '@/stores/hideValuesStore'

const HIDDEN_VALUE = '••••••'

interface Props {
  sales: RichVehicleSale[]
  isLoading: boolean
}

export function VehicleHistoryTab({ sales, isLoading }: Props) {
  const { hideValues } = useHideValuesStore()
  const [editSale, setEditSale] = useState<RichVehicleSale | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<RichVehicleSale | null>(null)
  const [search, setSearch] = useState('')
  const removeSale = useRemoveVehicleSale()

  const filtered = search
    ? sales.filter((s) => s.vehicle.name.toLowerCase().includes(search.toLowerCase()))
    : sales

  const totalBought = filtered.reduce((sum, s) => sum + s.vehicle.purchase_price, 0)
  const totalSold = filtered.reduce((sum, s) => sum + s.total_sale_price, 0)
  const totalProfit = totalSold - totalBought

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

      {isLoading && (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 rounded-lg border border-border bg-card animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && filtered.length > 0 && (
        <p className="text-sm text-muted-foreground">
          {filtered.length} {filtered.length === 1 ? 'venda concluída' : 'vendas concluídas'} ·{' '}
          <span className={clsx('font-medium', totalProfit >= 0 ? 'text-green-500' : 'text-red-500')}>
            {hideValues ? HIDDEN_VALUE : `${totalProfit >= 0 ? '+' : ''}${formatCurrency(totalProfit)}`} de lucro
          </span>
        </p>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="py-12 text-center text-sm text-muted-foreground">
          {search ? 'Nenhuma venda encontrada.' : 'Nenhuma venda concluída ainda.'}
        </div>
      )}

      {!isLoading && filtered.length > 0 && (
        <div className="rounded-xl border border-border bg-card divide-y divide-border">
          {filtered.map((sale) => {
            const profit = sale.total_sale_price - sale.vehicle.purchase_price
            const isProfit = profit >= 0

            return (
              <div key={sale.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{sale.vehicle.name}</p>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                    <span>Pago {hideValues ? HIDDEN_VALUE : formatCurrency(sale.vehicle.purchase_price)}</span>
                    <span>→</span>
                    <span>Recebido {hideValues ? HIDDEN_VALUE : formatCurrency(sale.total_sale_price)}</span>
                    {sale.trade_description && (
                      <span>+ troca {sale.trade_description}</span>
                    )}
                    {sale.sale_date && <span>· {formatDate(sale.sale_date)}</span>}
                    {sale.notes && <span>· {sale.notes}</span>}
                  </div>
                </div>

                <span className={clsx(
                  'flex-shrink-0 text-sm font-semibold tabular-nums',
                  isProfit ? 'text-green-500' : 'text-red-500'
                )}>
                  {hideValues ? HIDDEN_VALUE : `${isProfit ? '+' : ''}${formatCurrency(profit)}`}
                </span>

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
                      className="z-50 min-w-[140px] rounded-lg border border-border bg-card p-1 shadow-lg animate-in fade-in-0 zoom-in-95"
                    >
                      <DropdownMenu.Item
                        onSelect={() => setEditSale(sale)}
                        className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground outline-none hover:bg-muted focus:bg-muted"
                      >
                        <Pencil1Icon className="h-3.5 w-3.5 text-muted-foreground" />
                        Editar
                      </DropdownMenu.Item>
                      <DropdownMenu.Separator className="my-1 h-px bg-border" />
                      <DropdownMenu.Item
                        onSelect={() => setConfirmDelete(sale)}
                        className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-red-500 outline-none hover:bg-red-500/10 focus:bg-red-500/10"
                      >
                        <TrashIcon className="h-3.5 w-3.5" />
                        Excluir
                      </DropdownMenu.Item>
                    </DropdownMenu.Content>
                  </DropdownMenu.Portal>
                </DropdownMenu.Root>
              </div>
            )
          })}

          <div className="grid grid-cols-3 divide-x divide-border px-4 py-3">
            <div className="pr-4">
              <p className="text-xs text-muted-foreground">Investido</p>
              <p className="text-sm font-semibold tabular-nums text-foreground">{hideValues ? HIDDEN_VALUE : formatCurrency(totalBought)}</p>
            </div>
            <div className="px-4">
              <p className="text-xs text-muted-foreground">Recebido</p>
              <p className="text-sm font-semibold tabular-nums text-foreground">{hideValues ? HIDDEN_VALUE : formatCurrency(totalSold)}</p>
            </div>
            <div className="pl-4">
              <p className="text-xs text-muted-foreground">Lucro total</p>
              <p className={clsx(
                'text-sm font-semibold tabular-nums',
                totalProfit >= 0 ? 'text-green-500' : 'text-red-500'
              )}>
                {hideValues ? HIDDEN_VALUE : `${totalProfit >= 0 ? '+' : ''}${formatCurrency(totalProfit)}`}
              </p>
            </div>
          </div>
        </div>
      )}

      {editSale && (
        <EditSaleDialog
          open={!!editSale}
          onOpenChange={(o) => { if (!o) setEditSale(null) }}
          sale={editSale}
        />
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={(o) => { if (!o) setConfirmDelete(null) }}
        title="Excluir venda"
        description={`A venda de "${confirmDelete?.vehicle.name}" será excluída permanentemente do histórico.`}
        confirmLabel="Excluir"
        onConfirm={() => {
          if (confirmDelete) {
            removeSale.mutate(
              { saleId: confirmDelete.id, vehicleId: confirmDelete.vehicle_id },
              { onSuccess: () => setConfirmDelete(null) }
            )
          }
        }}
        loading={removeSale.isPending}
      />
    </div>
  )
}
