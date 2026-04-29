import { useEffect } from 'react'
import { useForm, Controller, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import * as Dialog from '@radix-ui/react-dialog'
import * as Select from '@radix-ui/react-select'
import { ChevronDownIcon, CheckIcon } from '@radix-ui/react-icons'
import { clsx } from 'clsx'
import type { InvestmentAsset, AssetCategory } from '@/domain'
import { Button } from '@/components/ui/Button'
import { CurrencyInput } from '@/components/ui/CurrencyInput'
import { useAddAsset, useUpdateAsset } from '@/hooks/useInvestments'

const CATEGORIES: { key: AssetCategory; label: string; color: string }[] = [
  { key: 'acoes',         label: 'Ações',        color: '#6366f1' },
  { key: 'fiis',          label: 'FIIs',          color: '#f59e0b' },
  { key: 'cripto',        label: 'Cripto',        color: '#f97316' },
  { key: 'internacional', label: 'Internacional', color: '#8b5cf6' },
  { key: 'renda_fixa',    label: 'Renda Fixa',   color: '#10b981' },
]

const CURRENCIES = [
  { key: 'BRL' as const, label: 'R$ Real (BRL)', flag: '🇧🇷' },
  { key: 'USD' as const, label: '$ Dólar (USD)', flag: '🇺🇸' },
]

const schema = z.object({
  name:     z.string().min(1, 'Nome obrigatório'),
  category: z.enum(['acoes', 'fiis', 'cripto', 'internacional', 'renda_fixa'] as const),
  amount:   z.number().min(0.01, 'Valor obrigatório'),
  currency: z.enum(['BRL', 'USD'] as const),
  notes:    z.string().optional(),
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
  asset?: InvestmentAsset
  defaultCategory?: AssetCategory
}

export function AssetDialog({ open, onOpenChange, asset, defaultCategory }: Props) {
  const isEditing = !!asset
  const add = useAddAsset()
  const update = useUpdateAsset()
  const isPending = add.isPending || update.isPending

  const { register, control, handleSubmit, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name:     '',
      category: defaultCategory ?? 'acoes',
      amount:   0,
      currency: 'BRL',
      notes:    '',
    },
  })

  const selectedCurrency = useWatch({ control, name: 'currency' })

  useEffect(() => {
    if (open) {
      reset({
        name:     asset?.name ?? '',
        category: asset?.category ?? defaultCategory ?? 'acoes',
        amount:   asset?.amount ?? 0,
        currency: asset?.currency ?? 'BRL',
        notes:    asset?.notes ?? '',
      })
    }
  }, [open, reset, asset, defaultCategory])

  function onSubmit(data: FormValues) {
    const payload = {
      name:     data.name,
      category: data.category,
      amount:   data.amount,
      currency: data.currency,
      notes:    data.notes || null,
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
            {isEditing ? 'Editar Ativo' : 'Adicionar Ativo'}
          </Dialog.Title>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground">Nome</label>
              <input
                className={inputClass()}
                placeholder="Ex: PETR4"
                {...register('name')}
              />
            </div>

            <div>
              <label className="text-sm text-muted-foreground">Categoria</label>
              <Controller
                name="category"
                control={control}
                render={({ field }) => {
                  const selected = CATEGORIES.find((c) => c.key === field.value)
                  return (
                    <Select.Root value={field.value} onValueChange={field.onChange}>
                      <Select.Trigger
                        className={clsx(
                          inputClass(),
                          'flex items-center justify-between'
                        )}
                      >
                        <span className="flex items-center gap-2">
                          {selected && (
                            <span
                              className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                              style={{ backgroundColor: selected.color }}
                            />
                          )}
                          <Select.Value placeholder="Selecionar categoria" />
                        </span>
                        <Select.Icon>
                          <ChevronDownIcon className="h-4 w-4 text-muted-foreground" />
                        </Select.Icon>
                      </Select.Trigger>
                      <Select.Portal>
                        <Select.Content
                          position="popper"
                          sideOffset={4}
                          className="z-50 min-w-[200px] rounded-lg border border-border bg-card p-1 shadow-lg"
                        >
                          <Select.Viewport>
                            {CATEGORIES.map((c) => (
                              <Select.Item
                                key={c.key}
                                value={c.key}
                                className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground outline-none hover:bg-muted focus:bg-muted"
                              >
                                <span
                                  className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                                  style={{ backgroundColor: c.color }}
                                />
                                <Select.ItemText>{c.label}</Select.ItemText>
                                <Select.ItemIndicator className="ml-auto">
                                  <CheckIcon className="h-3.5 w-3.5 text-primary" />
                                </Select.ItemIndicator>
                              </Select.Item>
                            ))}
                          </Select.Viewport>
                        </Select.Content>
                      </Select.Portal>
                    </Select.Root>
                  )
                }}
              />
            </div>

            <div className="grid grid-cols-[1fr_auto] gap-2 items-end">
              <div>
                <label className="text-sm text-muted-foreground">Valor atual</label>
                <Controller
                  name="amount"
                  control={control}
                  render={({ field }) => (
                    <CurrencyInput
                      value={field.value}
                      onChange={field.onChange}
                      currency={selectedCurrency}
                      className="mt-1"
                    />
                  )}
                />
              </div>

              <div className="pb-0">
                <label className="text-sm text-muted-foreground">Moeda</label>
                <Controller
                  name="currency"
                  control={control}
                  render={({ field }) => {
                    const selected = CURRENCIES.find((c) => c.key === field.value)
                    return (
                      <Select.Root value={field.value} onValueChange={field.onChange}>
                        <Select.Trigger
                          className={clsx(
                            inputClass(),
                            'flex items-center justify-between gap-2 min-w-[110px]'
                          )}
                        >
                          <span className="flex items-center gap-1.5 text-sm">
                            <span>{selected?.flag}</span>
                            <Select.Value />
                          </span>
                          <Select.Icon>
                            <ChevronDownIcon className="h-4 w-4 text-muted-foreground" />
                          </Select.Icon>
                        </Select.Trigger>
                        <Select.Portal>
                          <Select.Content
                            position="popper"
                            sideOffset={4}
                            className="z-50 min-w-[160px] rounded-lg border border-border bg-card p-1 shadow-lg"
                          >
                            <Select.Viewport>
                              {CURRENCIES.map((c) => (
                                <Select.Item
                                  key={c.key}
                                  value={c.key}
                                  className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground outline-none hover:bg-muted focus:bg-muted"
                                >
                                  <span>{c.flag}</span>
                                  <Select.ItemText>{c.label}</Select.ItemText>
                                  <Select.ItemIndicator className="ml-auto">
                                    <CheckIcon className="h-3.5 w-3.5 text-primary" />
                                  </Select.ItemIndicator>
                                </Select.Item>
                              ))}
                            </Select.Viewport>
                          </Select.Content>
                        </Select.Portal>
                      </Select.Root>
                    )
                  }}
                />
              </div>
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
                {isEditing ? 'Salvar' : 'Adicionar'}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
