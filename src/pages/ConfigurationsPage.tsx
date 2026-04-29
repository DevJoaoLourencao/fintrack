import { useState } from 'react'
import * as Tabs from '@radix-ui/react-tabs'
import { PlusIcon } from '@radix-ui/react-icons'
import { Button } from '@/components/ui/Button'
import { CardList } from '@/components/features/cards/CardList'
import { CardDialog } from '@/components/features/cards/CardDialog'
import { CategoryList } from '@/components/features/categories/CategoryList'
import { CategoryDialog } from '@/components/features/categories/CategoryDialog'

export function ConfigurationsPage() {
  const [cardDialogOpen, setCardDialogOpen] = useState(false)
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl font-semibold text-foreground">Configurações</h2>

      <Tabs.Root defaultValue="cards">
        <Tabs.List className="flex gap-1 border-b border-border mb-6">
          <Tabs.Trigger
            value="cards"
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary transition-colors"
          >
            Cartões
          </Tabs.Trigger>
          <Tabs.Trigger
            value="categories"
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary transition-colors"
          >
            Categorias
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="cards">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-medium text-foreground">Meus Cartões</h3>
            <Button onClick={() => setCardDialogOpen(true)} className="gap-1">
              <PlusIcon className="h-4 w-4" /> Adicionar Cartão
            </Button>
          </div>
          <CardList />
          <CardDialog open={cardDialogOpen} onOpenChange={setCardDialogOpen} />
        </Tabs.Content>

        <Tabs.Content value="categories">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-medium text-foreground">Minhas Categorias</h3>
            <Button onClick={() => setCategoryDialogOpen(true)} className="gap-1">
              <PlusIcon className="h-4 w-4" /> Adicionar Categoria
            </Button>
          </div>
          <CategoryList />
          <CategoryDialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen} />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  )
}
