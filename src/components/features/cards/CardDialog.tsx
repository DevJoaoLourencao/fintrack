import { useState, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import type { Card } from '@/domain'
import { useCreateCard, useUpdateCard } from '@/hooks/useCards'
import { Button } from '@/components/ui/Button'
import { ColorPicker } from '../ColorPicker'

interface CardDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  card?: Card
}

const empty = { name: '', last_four: '', color: '#8B5CF6', closing_day: 1, due_day: 10 }

export function CardDialog({ open, onOpenChange, card }: CardDialogProps) {
  const [form, setForm] = useState(empty)
  const create = useCreateCard()
  const update = useUpdateCard()
  const isEdit = !!card
  const loading = create.isPending || update.isPending

  useEffect(() => {
    if (open) {
      setForm(card ? {
        name: card.name,
        last_four: card.last_four,
        color: card.color,
        closing_day: card.closing_day,
        due_day: card.due_day,
      } : empty)
    }
  }, [open, card])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const data = {
      ...form,
      closing_day: Number(form.closing_day),
      due_day: Number(form.due_day),
    }
    const onSuccess = () => onOpenChange(false)
    if (isEdit) {
      update.mutate({ id: card.id, data }, { onSuccess })
    } else {
      create.mutate(data, { onSuccess })
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md rounded-lg bg-card border border-border p-6 shadow-xl focus:outline-none">
          <Dialog.Title className="text-lg font-semibold text-foreground mb-4">
            {isEdit ? 'Editar Cartão' : 'Novo Cartão'}
          </Dialog.Title>
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="text-sm text-muted-foreground">Nome</span>
              <input
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </label>
            <label className="block">
              <span className="text-sm text-muted-foreground">Últimos 4 dígitos</span>
              <input
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                value={form.last_four}
                onChange={(e) => setForm((f) => ({ ...f, last_four: e.target.value.slice(0, 4) }))}
                maxLength={4}
                pattern="\d{4}"
                required
              />
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="block">
                <span className="text-sm text-muted-foreground">Dia de fechamento</span>
                <input
                  type="number"
                  min={1}
                  max={31}
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  value={form.closing_day}
                  onChange={(e) => setForm((f) => ({ ...f, closing_day: Number(e.target.value) }))}
                  required
                />
              </label>
              <label className="block">
                <span className="text-sm text-muted-foreground">Dia de vencimento</span>
                <input
                  type="number"
                  min={1}
                  max={31}
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  value={form.due_day}
                  onChange={(e) => setForm((f) => ({ ...f, due_day: Number(e.target.value) }))}
                  required
                />
              </label>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Cor</span>
              <div className="mt-2">
                <ColorPicker value={form.color} onChange={(color) => setForm((f) => ({ ...f, color }))} />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>
                Cancelar
              </Button>
              <Button type="submit" loading={loading}>
                {isEdit ? 'Salvar' : 'Criar'}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
