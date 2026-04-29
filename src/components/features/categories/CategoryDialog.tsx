import { useState, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import type { Category } from '@/domain'
import { useCreateCategory, useUpdateCategory } from '@/hooks/useCategories'
import { Button } from '@/components/ui/Button'
import { ColorPicker } from '../ColorPicker'
import { IconPicker } from '../IconPicker'

interface CategoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category?: Category
}

const empty = { name: '', color: '#22C55E', icon: 'StarIcon' }

export function CategoryDialog({ open, onOpenChange, category }: CategoryDialogProps) {
  const [form, setForm] = useState(empty)
  const create = useCreateCategory()
  const update = useUpdateCategory()
  const isEdit = !!category
  const loading = create.isPending || update.isPending

  useEffect(() => {
    if (open) {
      setForm(category ? { name: category.name, color: category.color, icon: category.icon } : empty)
    }
  }, [open, category])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const onSuccess = () => onOpenChange(false)
    if (isEdit) {
      update.mutate({ id: category.id, data: form }, { onSuccess })
    } else {
      create.mutate(form, { onSuccess })
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md rounded-lg bg-card border border-border p-6 shadow-xl focus:outline-none max-h-[90vh] overflow-y-auto">
          <Dialog.Title className="text-lg font-semibold text-foreground mb-4">
            {isEdit ? 'Editar Categoria' : 'Nova Categoria'}
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
            <div>
              <span className="text-sm text-muted-foreground">Cor</span>
              <div className="mt-2">
                <ColorPicker value={form.color} onChange={(color) => setForm((f) => ({ ...f, color }))} />
              </div>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Ícone</span>
              <div className="mt-2">
                <IconPicker value={form.icon} onChange={(icon) => setForm((f) => ({ ...f, icon }))} />
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
