import { useState } from 'react'
import { DotsHorizontalIcon, Pencil1Icon, TrashIcon } from '@radix-ui/react-icons'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import type { PersonalAsset } from '@/domain'
import { ConfirmDialog } from '@/components/features/ConfirmDialog'
import { PersonalAssetDialog, PERSONAL_ASSET_CATEGORIES } from './PersonalAssetDialog'
import { useRemovePersonalAsset } from '@/hooks/usePersonalAssets'
import { formatCurrency } from '@/lib/dateUtils'

interface Props {
  assets: PersonalAsset[]
  isLoading: boolean
}

function effectiveValue(a: PersonalAsset): number {
  return a.current_value ?? a.purchase_value
}

export function PersonalAssetList({ assets, isLoading }: Props) {
  const [editAsset, setEditAsset] = useState<PersonalAsset | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<PersonalAsset | null>(null)
  const remove = useRemovePersonalAsset()

  const total = assets.reduce((s, a) => s + effectiveValue(a), 0)

  const byCategory = PERSONAL_ASSET_CATEGORIES
    .map((c) => ({
      ...c,
      items: assets.filter((a) => a.category === c.key),
      value: assets.filter((a) => a.category === c.key).reduce((s, a) => s + effectiveValue(a), 0),
    }))
    .filter((c) => c.items.length > 0)

  return (
    <div className="space-y-4">
      {isLoading && (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 rounded-xl border border-border bg-card animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && assets.length === 0 && (
        <div className="py-10 text-center text-sm text-muted-foreground">
          Nenhum bem cadastrado ainda.
        </div>
      )}

      {!isLoading && assets.length > 0 && (
        <>
          {/* Summary card */}
          <div className="rounded-xl border border-border bg-card px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Valor total dos bens</p>
              <p className="text-xl font-bold tabular-nums text-foreground">{formatCurrency(total)}</p>
              <p className="text-xs text-muted-foreground">{assets.length} {assets.length === 1 ? 'bem' : 'bens'}</p>
            </div>
            {/* Stacked bar */}
            {total > 0 && (
              <div className="flex h-3 w-40 overflow-hidden rounded-full">
                {byCategory.map((c) => (
                  <div
                    key={c.key}
                    style={{ width: `${(c.value / total) * 100}%`, backgroundColor: c.color }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* List grouped by category */}
          {byCategory.map((cat) => (
            <div key={cat.key} className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{cat.label}</p>
                <span className="ml-auto text-xs tabular-nums text-muted-foreground">{formatCurrency(cat.value)}</span>
              </div>

              <div className="rounded-xl border border-border bg-card divide-y divide-border">
                {cat.items.map((a) => (
                  <div key={a.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{a.name}</p>
                      {a.current_value != null ? (
                        <p className="text-xs text-muted-foreground">
                          Compra: {formatCurrency(a.purchase_value)}
                          {' · '}
                          <span className={a.current_value >= a.purchase_value ? 'text-green-500' : 'text-red-400'}>
                            Atual: {formatCurrency(a.current_value)}
                          </span>
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          Compra: {formatCurrency(a.purchase_value)}
                        </p>
                      )}
                      {a.notes && <p className="text-xs italic text-muted-foreground">{a.notes}</p>}
                    </div>

                    <span className="flex-shrink-0 text-sm font-semibold tabular-nums text-foreground">
                      {formatCurrency(effectiveValue(a))}
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
                            onSelect={() => setEditAsset(a)}
                            className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground outline-none hover:bg-muted focus:bg-muted"
                          >
                            <Pencil1Icon className="h-3.5 w-3.5 text-muted-foreground" />
                            Editar
                          </DropdownMenu.Item>
                          <DropdownMenu.Separator className="my-1 h-px bg-border" />
                          <DropdownMenu.Item
                            onSelect={() => setConfirmDelete(a)}
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
              </div>
            </div>
          ))}
        </>
      )}

      {editAsset && (
        <PersonalAssetDialog
          open={!!editAsset}
          onOpenChange={(o) => { if (!o) setEditAsset(null) }}
          asset={editAsset}
        />
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={(o) => { if (!o) setConfirmDelete(null) }}
        title="Excluir bem"
        description={`"${confirmDelete?.name ?? ''}" será excluído permanentemente.`}
        confirmLabel="Excluir"
        onConfirm={() => {
          if (confirmDelete) remove.mutate(confirmDelete.id, { onSuccess: () => setConfirmDelete(null) })
        }}
        loading={remove.isPending}
      />
    </div>
  )
}
