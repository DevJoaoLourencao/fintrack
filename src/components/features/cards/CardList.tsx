import { useState } from 'react'
import { Pencil1Icon, TrashIcon, ExclamationTriangleIcon } from '@radix-ui/react-icons'
import type { Card } from '@/domain'
import { useCardsQuery, useDeleteCard } from '@/hooks/useCards'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '../ConfirmDialog'
import { CardDialog } from './CardDialog'

export function CardList() {
  const { data: cards = [], isLoading, error } = useCardsQuery()
  const deleteCard = useDeleteCard()

  const [editCard, setEditCard] = useState<Card | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[0, 1].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg border border-border bg-muted" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
        <ExclamationTriangleIcon className="h-4 w-4 flex-shrink-0" />
        <span>Erro ao carregar cartões: {(error as Error).message}</span>
      </div>
    )
  }

  if (cards.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
        Nenhum cartão cadastrado. Clique em <strong>Adicionar Cartão</strong> para começar.
      </div>
    )
  }

  return (
    <>
      <ul className="space-y-2">
        {cards.map((card) => (
          <li
            key={card.id}
            className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <span
                className="h-4 w-4 flex-shrink-0 rounded-full"
                style={{ backgroundColor: card.color }}
              />
              <div>
                <p className="text-sm font-medium text-foreground">
                  {card.name}{' '}
                  <span className="font-normal text-muted-foreground">•••• {card.last_four}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  Fecha dia {card.closing_day} · Vence dia {card.due_day}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                className="h-8 gap-1.5 px-2 text-xs"
                onClick={() => setEditCard(card)}
              >
                <Pencil1Icon className="h-3.5 w-3.5" />
                Editar
              </Button>
              <Button
                variant="ghost"
                className="h-8 gap-1.5 px-2 text-xs text-red-500 hover:text-red-600"
                onClick={() => setDeleteId(card.id)}
              >
                <TrashIcon className="h-3.5 w-3.5" />
                Excluir
              </Button>
            </div>
          </li>
        ))}
      </ul>

      <CardDialog
        open={!!editCard}
        onOpenChange={(o) => { if (!o) setEditCard(null) }}
        card={editCard ?? undefined}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => { if (!o) setDeleteId(null) }}
        title="Remover cartão"
        description="Tem certeza? Os lançamentos do cartão não serão excluídos."
        onConfirm={() => {
          if (deleteId) deleteCard.mutate(deleteId, { onSuccess: () => setDeleteId(null) })
        }}
        loading={deleteCard.isPending}
      />
    </>
  )
}
