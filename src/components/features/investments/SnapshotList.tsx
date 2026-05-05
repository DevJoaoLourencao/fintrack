import { useState } from 'react'
import { DotsHorizontalIcon, Pencil1Icon, TrashIcon, ChevronDownIcon, ChevronUpIcon } from '@radix-ui/react-icons'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import type { InvestmentSnapshot, InvestmentSnapshotItem } from '@/domain'
import { ConfirmDialog } from '@/components/features/ConfirmDialog'
import { InvestmentDialog } from './InvestmentDialog'
import { useRemoveSnapshot, useInvestmentSnapshotItemsQuery } from '@/hooks/useInvestments'
import { formatDate, formatTime, formatCurrency } from '@/lib/dateUtils'
import { useHideValuesStore } from '@/stores/hideValuesStore'

const HIDDEN_VALUE = '••••••'

const CATEGORY_ORDER = ['acoes', 'fiis', 'cripto', 'internacional', 'renda_fixa', 'reserva_oportunidade']

const CATEGORIES: Record<string, { label: string; color: string }> = {
  acoes:                { label: 'Ações',                    color: '#6366f1' },
  fiis:                 { label: 'FIIs',                     color: '#f59e0b' },
  cripto:               { label: 'Cripto',                   color: '#f97316' },
  internacional:        { label: 'Internacional',            color: '#8b5cf6' },
  renda_fixa:           { label: 'Renda Fixa',              color: '#10b981' },
  reserva_oportunidade: { label: 'Reserva de Oportunidade', color: '#06b6d4' },
}

const SNAPSHOT_CATEGORIES = [
  { key: 'acoes'                as const, label: 'Ações',                    color: '#6366f1' },
  { key: 'fiis'                 as const, label: 'FIIs',                     color: '#f59e0b' },
  { key: 'cripto'               as const, label: 'Cripto',                   color: '#f97316' },
  { key: 'internacional'        as const, label: 'Internacional',            color: '#8b5cf6' },
  { key: 'renda_fixa'           as const, label: 'Renda Fixa',              color: '#10b981' },
  { key: 'reserva_oportunidade' as const, label: 'Reserva de Oportunidade', color: '#06b6d4' },
]

function formatUsd(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}

interface Props {
  snapshots: InvestmentSnapshot[]
  isLoading: boolean
}

export function SnapshotList({ snapshots, isLoading }: Props) {
  const { hideValues } = useHideValuesStore()
  const [editSnapshot, setEditSnapshot] = useState<InvestmentSnapshot | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<InvestmentSnapshot | null>(null)
  const [expandedSnapshots, setExpandedSnapshots] = useState<Set<string>>(new Set())
  const remove = useRemoveSnapshot()
  const { data: allItems = [] } = useInvestmentSnapshotItemsQuery()

  const itemsBySnapshot = new Map<string, InvestmentSnapshotItem[]>()
  for (const item of allItems) {
    const list = itemsBySnapshot.get(item.snapshot_id) ?? []
    list.push(item)
    itemsBySnapshot.set(item.snapshot_id, list)
  }

  function toggleExpand(id: string) {
    setExpandedSnapshots((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Histórico de Snapshots</p>

      {isLoading && (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-28 rounded-xl border border-border bg-card animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && snapshots.length === 0 && (
        <div className="py-10 text-center text-sm text-muted-foreground">
          Nenhum snapshot registrado ainda.
        </div>
      )}

      {!isLoading && snapshots.length > 0 && (
        <div className="space-y-3">
          {snapshots.map((s) => {
            const total = s.acoes + s.fiis + s.cripto + s.internacional + s.renda_fixa + (s.reserva_oportunidade ?? 0)
            const active = SNAPSHOT_CATEGORIES.filter((c) => s[c.key] > 0)
            const items = (itemsBySnapshot.get(s.id) ?? []).slice().sort((a, b) => {
              const catDiff = CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category)
              return catDiff !== 0 ? catDiff : b.amount - a.amount
            })
            const hasItems = items.length > 0
            const isExpanded = expandedSnapshots.has(s.id)

            return (
              <div key={s.id} className="rounded-xl border border-border bg-card overflow-hidden">
                {/* Header */}
                <div className="px-4 pt-3 pb-3 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">
                        {formatDate(s.date)}
                        <span className="ml-2 text-xs font-normal text-muted-foreground">às {formatTime(s.created_at)}</span>
                      </p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        {s.usd_rate != null && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                            <span className="font-medium text-foreground">USD</span>
                            {formatCurrency(s.usd_rate)}
                          </span>
                        )}
                        {s.notes && (
                          <span className="text-xs italic text-muted-foreground">{s.notes}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-shrink-0 items-center gap-1">
                      <span className="text-base font-bold tabular-nums text-foreground">
                        {hideValues ? HIDDEN_VALUE : formatCurrency(total)}
                      </span>

                      {hasItems && (
                        <button
                          type="button"
                          onClick={() => toggleExpand(s.id)}
                          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          aria-label={isExpanded ? 'Recolher' : 'Ver ativos'}
                        >
                          {isExpanded
                            ? <ChevronUpIcon className="h-4 w-4" />
                            : <ChevronDownIcon className="h-4 w-4" />
                          }
                        </button>
                      )}

                      <DropdownMenu.Root>
                        <DropdownMenu.Trigger asChild>
                          <button
                            type="button"
                            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
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
                              onSelect={() => setEditSnapshot(s)}
                              className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground outline-none hover:bg-muted focus:bg-muted"
                            >
                              <Pencil1Icon className="h-3.5 w-3.5 text-muted-foreground" />
                              Editar
                            </DropdownMenu.Item>
                            <DropdownMenu.Separator className="my-1 h-px bg-border" />
                            <DropdownMenu.Item
                              onSelect={() => setConfirmDelete(s)}
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

                  {/* Stacked allocation bar */}
                  {active.length > 0 && (
                    <div className="flex h-2 w-full overflow-hidden rounded-full">
                      {active.map((c) => (
                        <div
                          key={c.key}
                          style={{
                            width: `${(s[c.key] / total) * 100}%`,
                            backgroundColor: c.color,
                          }}
                        />
                      ))}
                    </div>
                  )}

                  {/* Category breakdown */}
                  {active.length > 0 && (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-3">
                      {active.map((c) => {
                        const pct = total > 0 ? (s[c.key] / total) * 100 : 0
                        return (
                          <div key={c.key} className="flex items-center gap-1.5 min-w-0">
                            <span className="h-2 w-2 flex-shrink-0 rounded-full" style={{ backgroundColor: c.color }} />
                            <span className="truncate text-xs text-muted-foreground">{c.label}</span>
                            <span className="ml-auto flex-shrink-0 tabular-nums text-xs font-medium text-foreground">
                              {pct.toFixed(0)}%
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Expanded: individual assets */}
                {hasItems && isExpanded && (
                  <div className="border-t border-border">
                    <p className="px-4 pt-2.5 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Ativos no momento do snapshot
                    </p>
                    <div className="divide-y divide-border/60">
                      {items.map((item) => {
                        const cat = CATEGORIES[item.category]
                        const isUsd = item.currency === 'USD'
                        return (
                          <div key={item.id} className="flex items-center gap-3 px-4 py-2.5">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                {cat && (
                                  <span
                                    className="h-2 w-2 flex-shrink-0 rounded-full"
                                    style={{ backgroundColor: cat.color }}
                                  />
                                )}
                                <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
                                {isUsd && (
                                  <span className="rounded px-1 py-0.5 text-[10px] font-semibold bg-blue-500/10 text-blue-500">
                                    USD
                                  </span>
                                )}
                              </div>
                              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                {cat && (
                                  <span className="text-xs text-muted-foreground">{cat.label}</span>
                                )}
                                {item.quantity != null && (
                                  <span className="text-xs text-muted-foreground tabular-nums">
                                    · {item.quantity % 1 === 0 ? item.quantity.toFixed(0) : item.quantity.toFixed(2)} unid.
                                  </span>
                                )}
                                {item.avg_price != null && (
                                  <span className="text-xs text-muted-foreground tabular-nums">
                                    PM {isUsd ? formatUsd(item.avg_price) : formatCurrency(item.avg_price)}
                                  </span>
                                )}
                                {(() => {
                                  const price = item.market_price ?? (item.quantity && item.quantity > 0 ? item.amount / item.quantity : null)
                                  if (price == null) return null
                                  return (
                                    <span className="text-xs text-muted-foreground tabular-nums">
                                      · cot. {isUsd ? formatUsd(price) : formatCurrency(price)}
                                    </span>
                                  )
                                })()}
                                {item.quantity != null && item.avg_price != null && (() => {
                                  const cost = item.quantity * item.avg_price
                                  const marketPrice = item.market_price ?? (item.quantity > 0 ? item.amount / item.quantity : null)
                                  const current = marketPrice != null ? item.quantity * marketPrice : item.amount
                                  const pct = cost > 0 ? ((current - cost) / cost) * 100 : null
                                  if (pct === null) return null
                                  return (
                                    <span className={`text-xs tabular-nums font-medium ${pct >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                                      {pct >= 0 ? '+' : ''}{pct.toFixed(1)}%
                                    </span>
                                  )
                                })()}
                              </div>
                            </div>
                            <div className="flex-shrink-0 text-right">
                              {hideValues ? (
                                <p className="text-sm tabular-nums font-medium text-foreground">{HIDDEN_VALUE}</p>
                              ) : isUsd ? (
                                <>
                                  <p className="text-sm tabular-nums font-medium text-foreground">
                                    {formatUsd(item.amount)}
                                  </p>
                                  {s.usd_rate && (
                                    <p className="text-xs tabular-nums text-muted-foreground">
                                      ≈ {formatCurrency(item.amount * s.usd_rate)}
                                    </p>
                                  )}
                                </>
                              ) : (
                                <p className="text-sm tabular-nums font-medium text-foreground">
                                  {formatCurrency(item.amount)}
                                </p>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {editSnapshot && (
        <InvestmentDialog
          open={!!editSnapshot}
          onOpenChange={(o) => { if (!o) setEditSnapshot(null) }}
          snapshot={editSnapshot}
        />
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={(o) => { if (!o) setConfirmDelete(null) }}
        title="Excluir snapshot"
        description={`O snapshot de ${confirmDelete ? formatDate(confirmDelete.date) : ''} será excluído permanentemente.`}
        confirmLabel="Excluir"
        onConfirm={() => {
          if (confirmDelete) remove.mutate(confirmDelete.id, { onSuccess: () => setConfirmDelete(null) })
        }}
        loading={remove.isPending}
      />
    </div>
  )
}
