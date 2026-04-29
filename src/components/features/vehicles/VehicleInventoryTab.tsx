import { useState } from 'react'
import { PlusIcon, DotsHorizontalIcon, Pencil1Icon, TrashIcon } from '@radix-ui/react-icons'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import type { Vehicle } from '@/domain'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/features/ConfirmDialog'
import { VehicleDialog } from './VehicleDialog'
import { SellVehicleDialog } from './SellVehicleDialog'
import { useRemoveVehicle } from '@/hooks/useVehicles'
import { formatCurrency, formatDate } from '@/lib/dateUtils'

interface Props {
  vehicles: Vehicle[]
  isLoading: boolean
}

export function VehicleInventoryTab({ vehicles, isLoading }: Props) {
  const [addOpen, setAddOpen] = useState(false)
  const [editVehicle, setEditVehicle] = useState<Vehicle | null>(null)
  const [sellVehicleId, setSellVehicleId] = useState<string | null>(null)
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null)
  const removeVehicle = useRemoveVehicle()

  const total = vehicles.reduce((sum, v) => sum + v.purchase_price, 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {vehicles.length} {vehicles.length === 1 ? 'veículo' : 'veículos'} em estoque
        </p>
        <Button onClick={() => setAddOpen(true)} className="gap-1.5" size="sm">
          <PlusIcon className="h-4 w-4" /> Adicionar
        </Button>
      </div>

      {isLoading && (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-14 rounded-lg border border-border bg-card animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && vehicles.length === 0 && (
        <div className="py-12 text-center text-sm text-muted-foreground">
          Nenhum veículo em estoque.
        </div>
      )}

      {!isLoading && vehicles.length > 0 && (
        <div className="rounded-xl border border-border bg-card divide-y divide-border">
          {vehicles.map((v) => (
            <div key={v.id} className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">{v.name}</p>
                {v.purchase_date && (
                  <p className="text-xs text-muted-foreground">Comprado em {formatDate(v.purchase_date)}</p>
                )}
                {v.notes && (
                  <p className="text-xs text-muted-foreground">{v.notes}</p>
                )}
              </div>

              <span className="flex-shrink-0 text-sm font-semibold tabular-nums text-foreground">
                {formatCurrency(v.purchase_price)}
              </span>

              {/* Botão Vender */}
              <button
                type="button"
                onClick={() => setSellVehicleId(v.id)}
                className="flex-shrink-0 rounded-md bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-600 transition-colors hover:bg-emerald-500/20 dark:text-emerald-400"
              >
                Vender
              </button>

              {/* Menu 3 pontos */}
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
                      onSelect={() => setEditVehicle(v)}
                      className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground outline-none hover:bg-muted focus:bg-muted"
                    >
                      <Pencil1Icon className="h-3.5 w-3.5 text-muted-foreground" />
                      Editar
                    </DropdownMenu.Item>
                    <DropdownMenu.Separator className="my-1 h-px bg-border" />
                    <DropdownMenu.Item
                      onSelect={() => setConfirmRemoveId(v.id)}
                      className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-red-500 outline-none hover:bg-red-500/10 focus:bg-red-500/10"
                    >
                      <TrashIcon className="h-3.5 w-3.5" />
                      Excluir
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            </div>
          ))}

          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm font-medium text-foreground">Total investido</span>
            <span className="text-sm font-semibold tabular-nums text-foreground">
              {formatCurrency(total)}
            </span>
          </div>
        </div>
      )}

      <VehicleDialog open={addOpen} onOpenChange={setAddOpen} />

      <VehicleDialog
        open={!!editVehicle}
        onOpenChange={(o) => { if (!o) setEditVehicle(null) }}
        vehicle={editVehicle ?? undefined}
      />

      <SellVehicleDialog
        open={!!sellVehicleId}
        onOpenChange={(o) => { if (!o) setSellVehicleId(null) }}
        activeVehicles={vehicles}
        preselectedVehicleId={sellVehicleId ?? undefined}
      />

      <ConfirmDialog
        open={!!confirmRemoveId}
        onOpenChange={(o) => { if (!o) setConfirmRemoveId(null) }}
        title="Excluir veículo"
        description="O veículo será removido do estoque permanentemente."
        confirmLabel="Excluir"
        onConfirm={() => {
          if (confirmRemoveId) removeVehicle.mutate(confirmRemoveId, { onSuccess: () => setConfirmRemoveId(null) })
        }}
        loading={removeVehicle.isPending}
      />
    </div>
  )
}
