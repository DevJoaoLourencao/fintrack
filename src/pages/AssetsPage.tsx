import { useState } from 'react'
import { PlusIcon } from '@radix-ui/react-icons'
import { Button } from '@/components/ui/Button'
import { PersonalAssetList } from '@/components/features/assets/PersonalAssetList'
import { PersonalAssetDialog } from '@/components/features/assets/PersonalAssetDialog'
import { usePersonalAssetsQuery } from '@/hooks/usePersonalAssets'

export function AssetsPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const { data: assets = [], isLoading } = usePersonalAssetsQuery()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">Meus Bens</h2>
        <Button onClick={() => setDialogOpen(true)}>
          <PlusIcon className="mr-1.5 h-4 w-4" />
          Cadastrar Bem
        </Button>
      </div>

      <PersonalAssetList assets={assets} isLoading={isLoading} />

      <PersonalAssetDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  )
}
