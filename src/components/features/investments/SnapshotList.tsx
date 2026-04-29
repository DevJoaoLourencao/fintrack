import { useState } from 'react'
import { DotsHorizontalIcon, Pencil1Icon, TrashIcon } from '@radix-ui/react-icons'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import type { InvestmentSnapshot } from '@/domain'
import { ConfirmDialog } from '@/components/features/ConfirmDialog'
import { InvestmentDialog } from './InvestmentDialog'
import { useRemoveSnapshot } from '@/hooks/useInvestments'
import { formatDate, formatCurrency } from '@/lib/dateUtils'

const CATEGORIES = [
  { key: 'acoes'         as const, label: 'Ações',        color: '#6366f1' },
  { key: 'fiis'          as const, label: 'FIIs',          color: '#f59e0b' },
  { key: 'cripto'        as const, label: 'Cripto',        color: '#f97316' },
  { key: 'internacional' as const, label: 'Internacional', color: '#8b5cf6' },
  { key: 'renda_fixa'    as const, label: 'Renda Fixa',   color: '#10b981' },
]

interface Props {
  snapshots: InvestmentSnapshot[]
  isLoading: boolean
}

export function SnapshotList({ snapshots, isLoading }: Props) {
  const [editSnapshot, setEditSnapshot] = useState<InvestmentSnapshot | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<InvestmentSnapshot | null>(null)
  const remove = useRemoveSnapshot()

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
            const total = s.acoes + s.fiis + s.cripto + s.internacional + s.renda_fixa
            const active = CATEGORIES.filter((c) => s[c.key] > 0)

            return (
              <div key={s.id} className="rounded-xl border border-border bg-card px-4 pt-3 pb-4 space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">{formatDate(s.date)}</p>
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

                  <div className="flex flex-shrink-0 items-center gap-2">
                    <span className="text-base font-bold tabular-nums text-foreground">
                      {formatCurrency(total)}
                    </span>
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
                          <span
                            className="h-2 w-2 flex-shrink-0 rounded-full"
                            style={{ backgroundColor: c.color }}
                          />
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
