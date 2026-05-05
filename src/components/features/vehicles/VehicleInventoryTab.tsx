import { useState } from 'react'
import { PlusIcon, DotsHorizontalIcon, Pencil1Icon, TrashIcon, MagnifyingGlassIcon } from '@radix-ui/react-icons'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { clsx } from 'clsx'
import type { Vehicle, VehicleCategory } from '@/domain'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/features/ConfirmDialog'
import { VehicleDialog } from './VehicleDialog'
import { SellVehicleDialog } from './SellVehicleDialog'
import { useRemoveVehicle } from '@/hooks/useVehicles'
import { formatCurrency, formatDate } from '@/lib/dateUtils'
import { useHideValuesStore } from '@/stores/hideValuesStore'

const HIDDEN_VALUE = '••••••'

interface Props {
  vehicles: Vehicle[]
  isLoading: boolean
}

export function VehicleInventoryTab({ vehicles, isLoading }: Props) {
  const { hideValues } = useHideValuesStore()
  const [addOpen, setAddOpen] = useState(false)
  const [editVehicle, setEditVehicle] = useState<Vehicle | null>(null)
  const [sellVehicleId, setSellVehicleId] = useState<string | null>(null)
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<VehicleCategory | 'all'>('all')
  const removeVehicle = useRemoveVehicle()

  const filtered = vehicles.filter((v) => {
    const matchSearch = !search || v.name.toLowerCase().includes(search.toLowerCase())
    const matchCategory = categoryFilter === 'all' || v.category === categoryFilter
    return matchSearch && matchCategory
  })

  const total = filtered.reduce((sum, v) => sum + v.purchase_price, 0)

  return (
    <div className="space-y-4">

      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search — grows, wraps alone on very small screens */}
        <div className="relative flex-1 min-w-[160px]">
          <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar veículo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-background pl-8 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Filters + Add — group stays together, wraps as a unit */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="flex rounded-lg border border-border overflow-hidden">
            {(['all', 'moto', 'carro'] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={clsx(
                  'px-3 py-2 text-xs font-medium transition-colors',
                  categoryFilter === cat
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background text-muted-foreground hover:text-foreground'
                )}
              >
                {cat === 'all' ? 'Todos' : cat === 'moto' ? 'Motos' : 'Carros'}
              </button>
            ))}
          </div>
          <Button onClick={() => setAddOpen(true)} className="gap-1.5" size="sm">
            <PlusIcon className="h-4 w-4" /> Adicionar
          </Button>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        {filtered.length} {filtered.length === 1 ? 'veículo' : 'veículos'} em estoque
        {search && vehicles.length !== filtered.length && ` (de ${vehicles.length})`}
      </p>

      {/* ── Skeleton ────────────────────────────────────────────────────────── */}
      {isLoading && (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 rounded-lg border border-border bg-card animate-pulse" />
          ))}
        </div>
      )}

      {/* ── Empty ───────────────────────────────────────────────────────────── */}
      {!isLoading && filtered.length === 0 && (
        <div className="py-12 text-center text-sm text-muted-foreground">
          {search ? 'Nenhum veículo encontrado.' : 'Nenhum veículo em estoque.'}
        </div>
      )}

      {/* ── List ────────────────────────────────────────────────────────────── */}
      {!isLoading && filtered.length > 0 && (
        <div className="rounded-xl border border-border bg-card divide-y divide-border">
          {filtered.map((v) => (
            <div key={v.id} className="px-4 py-3">

              {/* Mobile layout: 3-dot top-right, Vender bottom-right */}
              <div className="sm:hidden">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground truncate">{v.name}</p>
                      <span className={clsx(
                        'flex-shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
                        v.category === 'moto'
                          ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                          : 'bg-sky-500/10 text-sky-600 dark:text-sky-400'
                      )}>
                        {v.category === 'moto' ? 'Moto' : 'Carro'}
                      </span>
                    </div>
                    {v.purchase_date && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Comprado em {formatDate(v.purchase_date)}
                      </p>
                    )}
                    {v.notes && (
                      <p className="text-xs text-muted-foreground">{v.notes}</p>
                    )}
                  </div>
                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger asChild>
                      <button
                        type="button"
                        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary active:scale-95"
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
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm font-semibold tabular-nums text-foreground">
                    {hideValues ? HIDDEN_VALUE : formatCurrency(v.purchase_price)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSellVehicleId(v.id)}
                    className="rounded-md bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-600 transition-colors hover:bg-emerald-500/20 dark:text-emerald-400 active:scale-95"
                  >
                    Vender
                  </button>
                </div>
              </div>

              {/* Desktop layout (sm+): single row */}
              <div className="hidden sm:flex items-center gap-x-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground truncate">{v.name}</p>
                    <span className={clsx(
                      'flex-shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
                      v.category === 'moto'
                        ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                        : 'bg-sky-500/10 text-sky-600 dark:text-sky-400'
                    )}>
                      {v.category === 'moto' ? 'Moto' : 'Carro'}
                    </span>
                  </div>
                  {v.purchase_date && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Comprado em {formatDate(v.purchase_date)}
                    </p>
                  )}
                  {v.notes && (
                    <p className="text-xs text-muted-foreground">{v.notes}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold tabular-nums text-foreground">
                    {hideValues ? HIDDEN_VALUE : formatCurrency(v.purchase_price)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSellVehicleId(v.id)}
                    className="rounded-md bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-600 transition-colors hover:bg-emerald-500/20 dark:text-emerald-400 active:scale-95"
                  >
                    Vender
                  </button>
                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger asChild>
                      <button
                        type="button"
                        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary active:scale-95"
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
              </div>

            </div>
          ))}

          {/* Total */}
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm font-medium text-foreground">Total investido</span>
            <span className="text-sm font-semibold tabular-nums text-foreground">
              {hideValues ? HIDDEN_VALUE : formatCurrency(total)}
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
