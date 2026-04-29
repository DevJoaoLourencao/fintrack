import { useState } from 'react'
import { Pencil1Icon, TrashIcon, StarIcon, ExclamationTriangleIcon } from '@radix-ui/react-icons'
import type { Category } from '@/domain'
import { useCategoriesQuery, useDeleteCategory } from '@/hooks/useCategories'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '../ConfirmDialog'
import { CategoryDialog } from './CategoryDialog'
import { ICON_MAP } from '@/lib/iconMap'

export function CategoryList() {
  const { data: categories = [], isLoading, error } = useCategoriesQuery()
  const deleteCategory = useDeleteCategory()

  const [editCategory, setEditCategory] = useState<Category | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-14 animate-pulse rounded-lg border border-border bg-muted" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
        <ExclamationTriangleIcon className="h-4 w-4 flex-shrink-0" />
        <span>Erro ao carregar categorias: {(error as Error).message}</span>
      </div>
    )
  }

  if (categories.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
        Nenhuma categoria cadastrada. Clique em <strong>Adicionar Categoria</strong> para começar.
      </div>
    )
  }

  return (
    <>
      <ul className="space-y-2">
        {categories.map((cat) => {
          const Icon = ICON_MAP[cat.icon] ?? StarIcon
          return (
            <li
              key={cat.id}
              className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <span
                  className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-white"
                  style={{ backgroundColor: cat.color }}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <p className="text-sm font-medium text-foreground">{cat.name}</p>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  className="h-8 gap-1.5 px-2 text-xs"
                  onClick={() => setEditCategory(cat)}
                >
                  <Pencil1Icon className="h-3.5 w-3.5" />
                  Editar
                </Button>
                <Button
                  variant="ghost"
                  className="h-8 gap-1.5 px-2 text-xs text-red-500 hover:text-red-600"
                  onClick={() => setDeleteId(cat.id)}
                >
                  <TrashIcon className="h-3.5 w-3.5" />
                  Excluir
                </Button>
              </div>
            </li>
          )
        })}
      </ul>

      <CategoryDialog
        open={!!editCategory}
        onOpenChange={(o) => { if (!o) setEditCategory(null) }}
        category={editCategory ?? undefined}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => { if (!o) setDeleteId(null) }}
        title="Remover categoria"
        description="Tem certeza que deseja remover esta categoria?"
        onConfirm={() => {
          if (deleteId) deleteCategory.mutate(deleteId, { onSuccess: () => setDeleteId(null) })
        }}
        loading={deleteCategory.isPending}
      />
    </>
  )
}
