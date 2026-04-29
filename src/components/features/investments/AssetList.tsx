import { useState } from 'react'
import { DotsHorizontalIcon, Pencil1Icon, TrashIcon, PlusIcon, ChevronDownIcon } from '@radix-ui/react-icons'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { clsx } from 'clsx'
import type { InvestmentAsset, AssetCategory } from '@/domain'
import { ConfirmDialog } from '@/components/features/ConfirmDialog'
import { AssetDialog } from './AssetDialog'
import { useRemoveAsset } from '@/hooks/useInvestments'
import { formatCurrency } from '@/lib/dateUtils'

const CATEGORIES: { key: AssetCategory; label: string; color: string }[] = [
  { key: 'acoes',         label: 'Ações',        color: '#6366f1' },
  { key: 'fiis',          label: 'FIIs',          color: '#f59e0b' },
  { key: 'cripto',        label: 'Cripto',        color: '#f97316' },
  { key: 'internacional', label: 'Internacional', color: '#8b5cf6' },
  { key: 'renda_fixa',    label: 'Renda Fixa',   color: '#10b981' },
]

function formatUsd(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}

const HIDDEN_VALUE = '••••••'

interface Props {
  assets: InvestmentAsset[]
  isLoading: boolean
  usdRate?: number
  hideValues?: boolean
}

export function AssetList({ assets, isLoading, usdRate, hideValues = false }: Props) {
  const [editAsset, setEditAsset] = useState<InvestmentAsset | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<InvestmentAsset | null>(null)
  const [addCategory, setAddCategory] = useState<AssetCategory | null>(null)
  const [collapsedCategories, setCollapsedCategories] = useState<Set<AssetCategory>>(
    new Set(['acoes', 'fiis', 'cripto', 'internacional', 'renda_fixa'] as AssetCategory[])
  )
  const remove = useRemoveAsset()

  function toggleCategory(key: AssetCategory) {
    setCollapsedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function toBrl(asset: InvestmentAsset): number {
    if (asset.currency === 'USD' && usdRate) return asset.amount * usdRate
    return asset.amount
  }

  const assetsByCategory = CATEGORIES.map((cat) => ({
    ...cat,
    assets: assets.filter((a) => a.category === cat.key),
    total: assets.filter((a) => a.category === cat.key).reduce((s, a) => s + toBrl(a), 0),
  }))

  const categoriesWithAssets = assetsByCategory.filter((c) => c.assets.length > 0)

  return (
    <div className="space-y-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Carteira Atual</p>

      {isLoading && (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 rounded-lg border border-border bg-card animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && assets.length === 0 && (
        <div className="py-6 text-center text-sm text-muted-foreground">
          Nenhum ativo cadastrado ainda.
        </div>
      )}

      {!isLoading && (
        <div className="space-y-3">
          {categoriesWithAssets.map((cat) => {
            const isCollapsed = collapsedCategories.has(cat.key)
            return (
              <div key={cat.key} className="rounded-xl border border-border bg-card overflow-hidden">
                {/* Category header — clicável para colapsar */}
                <button
                  type="button"
                  onClick={() => toggleCategory(cat.key)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-2.5 bg-muted/40 hover:bg-muted/60 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                    <span className="text-sm font-semibold text-foreground">{cat.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold tabular-nums text-foreground">
                      {hideValues ? HIDDEN_VALUE : formatCurrency(cat.total)}
                    </span>
                    <ChevronDownIcon
                      className={clsx(
                        'h-3.5 w-3.5 text-muted-foreground transition-transform duration-200',
                        isCollapsed && '-rotate-90'
                      )}
                    />
                  </div>
                </button>

                {/* Individual assets */}
                {!isCollapsed && (
                  <>
                    <div className="divide-y divide-border">
                      {cat.assets.map((asset) => {
                        const isUsd = asset.currency === 'USD'
                        const brlValue = toBrl(asset)
                        return (
                          <div key={asset.id} className="flex items-center gap-3 px-4 py-2.5">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <p className="text-sm font-medium text-foreground">{asset.name}</p>
                                {isUsd && (
                                  <span className="rounded px-1 py-0.5 text-[10px] font-semibold bg-blue-500/10 text-blue-500">
                                    USD
                                  </span>
                                )}
                              </div>
                              {asset.notes && (
                                <p className="text-xs text-muted-foreground truncate">{asset.notes}</p>
                              )}
                            </div>
                            <div className="flex-shrink-0 text-right">
                              {hideValues ? (
                                <p className="text-sm tabular-nums text-foreground font-medium">{HIDDEN_VALUE}</p>
                              ) : isUsd ? (
                                <>
                                  <p className="text-sm tabular-nums text-foreground font-medium">
                                    {formatUsd(asset.amount)}
                                  </p>
                                  {usdRate ? (
                                    <p className="text-xs tabular-nums text-muted-foreground">
                                      ≈ {formatCurrency(brlValue)}
                                    </p>
                                  ) : (
                                    <p className="text-xs text-muted-foreground/60">carregando...</p>
                                  )}
                                </>
                              ) : (
                                <p className="text-sm tabular-nums text-foreground">
                                  {formatCurrency(asset.amount)}
                                </p>
                              )}
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
                                  className="z-50 min-w-[140px] rounded-lg border border-border bg-card p-1 shadow-lg animate-in fade-in-0 zoom-in-95"
                                >
                                  <DropdownMenu.Item
                                    onSelect={() => setEditAsset(asset)}
                                    className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground outline-none hover:bg-muted focus:bg-muted"
                                  >
                                    <Pencil1Icon className="h-3.5 w-3.5 text-muted-foreground" />
                                    Editar
                                  </DropdownMenu.Item>
                                  <DropdownMenu.Separator className="my-1 h-px bg-border" />
                                  <DropdownMenu.Item
                                    onSelect={() => setConfirmDelete(asset)}
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
                    </div>

                    {/* Add asset button for this category */}
                    <div className="border-t border-border px-4 py-2">
                      <button
                        type="button"
                        onClick={() => setAddCategory(cat.key)}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
                      >
                        <PlusIcon className="h-3.5 w-3.5" />
                        Adicionar ativo
                      </button>
                    </div>
                  </>
                )}
              </div>
            )
          })}

          {/* Add buttons for categories with no assets yet */}
          <div className="flex flex-wrap gap-2 pt-1">
            {assetsByCategory.filter((c) => c.assets.length === 0).map((cat) => (
              <button
                key={cat.key}
                type="button"
                onClick={() => setAddCategory(cat.key)}
                className="flex items-center gap-1.5 rounded-md border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
              >
                <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                <PlusIcon className="h-3 w-3" />
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {editAsset && (
        <AssetDialog
          open={!!editAsset}
          onOpenChange={(o) => { if (!o) setEditAsset(null) }}
          asset={editAsset}
        />
      )}

      {addCategory && (
        <AssetDialog
          open={!!addCategory}
          onOpenChange={(o) => { if (!o) setAddCategory(null) }}
          defaultCategory={addCategory}
        />
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={(o) => { if (!o) setConfirmDelete(null) }}
        title="Excluir ativo"
        description={`O ativo "${confirmDelete?.name ?? ''}" será excluído permanentemente.`}
        confirmLabel="Excluir"
        onConfirm={() => {
          if (confirmDelete) remove.mutate(confirmDelete.id, { onSuccess: () => setConfirmDelete(null) })
        }}
        loading={remove.isPending}
      />
    </div>
  )
}
