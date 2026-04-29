import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import * as Dialog from '@radix-ui/react-dialog'
import { clsx } from 'clsx'
import type { PersonalAsset, PersonalAssetCategory } from '@/domain'
import { Button } from '@/components/ui/Button'
import { CurrencyInput } from '@/components/ui/CurrencyInput'
import { useAddPersonalAsset, useUpdatePersonalAsset } from '@/hooks/usePersonalAssets'

export const PERSONAL_ASSET_CATEGORIES: { key: PersonalAssetCategory; label: string; color: string }[] = [
  { key: 'imovel',  label: 'Imóvel',   color: '#6366f1' },
  { key: 'veiculo', label: 'Veículo',  color: '#f59e0b' },
  { key: 'outros',  label: 'Outros',   color: '#94a3b8' },
]

const schema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  category: z.enum(['imovel', 'veiculo', 'outros']),
  purchase_value: z.number().min(0),
  current_value: z.number().min(0).nullable(),
  notes: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

function inputClass() {
  return clsx(
    'mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground',
    'placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-colors'
  )
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  asset?: PersonalAsset
}

export function PersonalAssetDialog({ open, onOpenChange, asset }: Props) {
  const isEditing = !!asset
  const add = useAddPersonalAsset()
  const update = useUpdatePersonalAsset()
  const isPending = add.isPending || update.isPending

  const { register, control, handleSubmit, reset, watch } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      category: 'outros',
      purchase_value: 0,
      current_value: null,
      notes: '',
    },
  })

  useEffect(() => {
    if (open) {
      reset({
        name: asset?.name ?? '',
        category: asset?.category ?? 'outros',
        purchase_value: asset?.purchase_value ?? 0,
        current_value: asset?.current_value ?? null,
        notes: asset?.notes ?? '',
      })
    }
  }, [open, reset, asset])

  const hasCurrentValue = watch('current_value') != null && watch('current_value')! > 0

  function onSubmit(data: FormValues) {
    const payload = {
      name: data.name,
      category: data.category,
      purchase_value: data.purchase_value,
      current_value: data.current_value && data.current_value > 0 ? data.current_value : null,
      notes: data.notes || null,
    }
    if (isEditing) {
      update.mutate({ id: asset.id, data: payload }, { onSuccess: () => onOpenChange(false) })
    } else {
      add.mutate(payload, { onSuccess: () => onOpenChange(false) })
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-full max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-xl focus:outline-none">
          <Dialog.Title className="mb-4 text-base font-semibold text-foreground">
            {isEditing ? 'Editar Bem' : 'Cadastrar Bem'}
          </Dialog.Title>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground">Nome</label>
              <input
                className={inputClass()}
                placeholder="Ex: iPhone 15 Pro, Sofá 3 lugares..."
                {...register('name')}
              />
            </div>

            <div>
              <label className="text-sm text-muted-foreground">Categoria</label>
              <Controller
                name="category"
                control={control}
                render={({ field }) => (
                  <select className={inputClass()} value={field.value} onChange={field.onChange}>
                    {PERSONAL_ASSET_CATEGORIES.map((c) => (
                      <option key={c.key} value={c.key}>{c.label}</option>
                    ))}
                  </select>
                )}
              />
            </div>

            <div>
              <label className="text-sm text-muted-foreground">Valor de compra</label>
              <Controller
                name="purchase_value"
                control={control}
                render={({ field }) => (
                  <CurrencyInput value={field.value} onChange={field.onChange} className="mt-1" />
                )}
              />
            </div>

            <div>
              <label className="text-sm text-muted-foreground">
                Valor atual estimado{' '}
                <span className="text-xs">(opcional — usado no patrimônio se informado)</span>
              </label>
              <Controller
                name="current_value"
                control={control}
                render={({ field }) => (
                  <CurrencyInput
                    value={field.value ?? 0}
                    onChange={(v) => field.onChange(v > 0 ? v : null)}
                    className="mt-1"
                  />
                )}
              />
            </div>

            <div>
              <label className="text-sm text-muted-foreground">Observações (opcional)</label>
              <input className={inputClass()} placeholder="Notas..." {...register('notes')} />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isPending}>
                Cancelar
              </Button>
              <Button type="submit" loading={isPending}>
                {isEditing ? 'Salvar' : 'Cadastrar'}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
