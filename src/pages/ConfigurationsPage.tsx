import { useState } from 'react'
import * as Tabs from '@radix-ui/react-tabs'
import * as Switch from '@radix-ui/react-switch'
import { PlusIcon } from '@radix-ui/react-icons'
import { Button } from '@/components/ui/Button'
import { CardList } from '@/components/features/cards/CardList'
import { CardDialog } from '@/components/features/cards/CardDialog'
import { CategoryList } from '@/components/features/categories/CategoryList'
import { CategoryDialog } from '@/components/features/categories/CategoryDialog'
import { useNavStore, CONFIGURABLE_NAV_KEYS, type NavKey } from '@/stores/navStore'

const NAV_LABELS: Record<NavKey, string> = {
  lancamentos:   'Lançamentos',
  motos:         'Loja de Veículos',
  investimentos: 'Investimentos',
  bens:          'Meus Bens',
}

const triggerClass = 'px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary transition-colors'

export function ConfigurationsPage() {
  const [cardDialogOpen, setCardDialogOpen] = useState(false)
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  const { isVisible, toggle } = useNavStore()

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl font-semibold text-foreground">Configurações</h2>

      <Tabs.Root defaultValue="cards">
        <Tabs.List className="flex gap-1 border-b border-border mb-6">
          <Tabs.Trigger value="cards" className={triggerClass}>Cartões</Tabs.Trigger>
          <Tabs.Trigger value="categories" className={triggerClass}>Categorias</Tabs.Trigger>
          <Tabs.Trigger value="menu" className={triggerClass}>Menu</Tabs.Trigger>
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

        <Tabs.Content value="menu">
          <div className="max-w-sm space-y-2">
            <p className="text-xs text-muted-foreground mb-4">
              Itens visíveis no menu lateral. Dashboard e Configurações estão sempre visíveis.
            </p>
            {CONFIGURABLE_NAV_KEYS.map((key) => (
              <div
                key={key}
                className="flex items-center justify-between rounded-xl border border-border/50 bg-card px-4 py-3 shadow-card transition-shadow hover:shadow-card-md"
              >
                <span className="text-sm text-foreground">{NAV_LABELS[key]}</span>
                <Switch.Root
                  checked={isVisible(key)}
                  onCheckedChange={() => toggle(key)}
                  className="relative h-5 w-9 rounded-full bg-muted transition-colors data-[state=checked]:bg-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
                >
                  <Switch.Thumb className="block h-4 w-4 rounded-full bg-white shadow-sm transition-transform translate-x-0.5 data-[state=checked]:translate-x-[18px]" />
                </Switch.Root>
              </div>
            ))}
          </div>
        </Tabs.Content>
      </Tabs.Root>
    </div>
  )
}
