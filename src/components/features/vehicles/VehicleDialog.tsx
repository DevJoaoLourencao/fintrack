import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import * as Dialog from '@radix-ui/react-dialog'
import { clsx } from 'clsx'
import type { Vehicle } from '@/domain'
import { Button } from '@/components/ui/Button'
import { CurrencyInput } from '@/components/ui/CurrencyInput'
import { useAddVehicle, useUpdateVehicle } from '@/hooks/useVehicles'

const schema = z.object({
  name: z.string().min(1, 'Descrição obrigatória'),
  purchase_price: z.number({ error: 'Informe o valor' }).positive('Valor deve ser maior que zero'),
  purchase_date: z.string().optional(),
  notes: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

function inputClass(hasError?: boolean) {
  return clsx(
    'mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground',
    'placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-colors',
    hasError ? 'border-red-400 focus:ring-red-400/30' : 'border-border focus:ring-primary'
  )
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  vehicle?: Vehicle
}

export function VehicleDialog({ open, onOpenChange, vehicle }: Props) {
  const isEditing = !!vehicle
  const addVehicle = useAddVehicle()
  const updateVehicle = useUpdateVehicle()
  const isPending = addVehicle.isPending || updateVehicle.isPending

  const { register, control, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', purchase_price: 0, purchase_date: '', notes: '' },
  })

  useEffect(() => {
    if (open) {
      reset({
        name: vehicle?.name ?? '',
        purchase_price: vehicle?.purchase_price ?? 0,
        purchase_date: vehicle?.purchase_date ?? new Date().toISOString().slice(0, 10),
        notes: vehicle?.notes ?? '',
      })
    }
  }, [open, reset, vehicle])

  function onSubmit(data: FormValues) {
    const payload = {
      name: data.name,
      purchase_price: data.purchase_price,
      purchase_date: data.purchase_date || null,
      notes: data.notes || null,
    }

    if (isEditing) {
      updateVehicle.mutate(
        { id: vehicle.id, data: payload },
        { onSuccess: () => onOpenChange(false) }
      )
    } else {
      addVehicle.mutate(
        { ...payload, status: 'active' },
        { onSuccess: () => onOpenChange(false) }
      )
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card p-6 shadow-xl focus:outline-none">
          <Dialog.Title className="mb-4 text-base font-semibold text-foreground">
            {isEditing ? 'Editar Veículo' : 'Adicionar ao Estoque'}
          </Dialog.Title>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground">Descrição</label>
              <input
                className={inputClass(!!errors.name)}
                placeholder="Ex: Twister 2008, Celta 2005..."
                {...register('name')}
              />
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
            </div>

            <Controller
              name="purchase_price"
              control={control}
              render={({ field }) => (
                <div>
                  <label className="text-sm text-muted-foreground">Valor pago</label>
                  <CurrencyInput
                    value={field.value}
                    onChange={field.onChange}
                    hasError={!!errors.purchase_price}
                    className="mt-1"
                  />
                  {errors.purchase_price && (
                    <p className="mt-1 text-xs text-red-500">{errors.purchase_price.message}</p>
                  )}
                </div>
              )}
            />

            <div>
              <label className="text-sm text-muted-foreground">Data da compra (opcional)</label>
              <input type="date" className={inputClass()} {...register('purchase_date')} />
            </div>

            <div>
              <label className="text-sm text-muted-foreground">Observações (opcional)</label>
              <input
                className={inputClass()}
                placeholder="Notas sobre o veículo..."
                {...register('notes')}
              />
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
