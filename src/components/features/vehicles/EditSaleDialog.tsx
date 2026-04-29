import { useEffect } from 'react'
import { useForm, Controller, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import * as Dialog from '@radix-ui/react-dialog'
import { clsx } from 'clsx'
import type { RichVehicleSale } from '@/domain'
import { Button } from '@/components/ui/Button'
import { CurrencyInput } from '@/components/ui/CurrencyInput'
import { useUpdateVehicleSale } from '@/hooks/useVehicles'
import { formatCurrency } from '@/lib/dateUtils'

const schema = z.object({
  sale_date: z.string().optional(),
  cash_amount: z.number().min(0),
  installments_count: z.number().int().min(0).max(60),
  installments_amount: z.number().min(0),
  installments_paid: z.number().int().min(0),
  trade_description: z.string().optional(),
  trade_value: z.number().min(0),
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
  sale: RichVehicleSale
}

export function EditSaleDialog({ open, onOpenChange, sale }: Props) {
  const update = useUpdateVehicleSale()

  const { register, control, handleSubmit, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      sale_date: sale.sale_date ?? '',
      cash_amount: sale.cash_amount,
      installments_count: sale.installments_count,
      installments_amount: sale.installments_amount,
      installments_paid: sale.installments_paid,
      trade_description: sale.trade_description ?? '',
      trade_value: sale.trade_value,
      notes: sale.notes ?? '',
    },
  })

  useEffect(() => {
    if (open) {
      reset({
        sale_date: sale.sale_date ?? '',
        cash_amount: sale.cash_amount,
        installments_count: sale.installments_count,
        installments_amount: sale.installments_amount,
        installments_paid: sale.installments_paid,
        trade_description: sale.trade_description ?? '',
        trade_value: sale.trade_value,
        notes: sale.notes ?? '',
      })
    }
  }, [open, reset, sale])

  const [cashAmount, installmentsCount, installmentsAmount, tradeValue] = useWatch({
    control,
    name: ['cash_amount', 'installments_count', 'installments_amount', 'trade_value'],
  })

  const totalSalePrice =
    (cashAmount ?? 0) +
    (installmentsCount ?? 0) * (installmentsAmount ?? 0) +
    (tradeValue ?? 0)

  function onSubmit(data: FormValues) {
    const nowCompleted = data.installments_count === 0 || data.installments_paid >= data.installments_count
    update.mutate(
      {
        id: sale.id,
        data: {
          sale_date: data.sale_date || null,
          total_sale_price: totalSalePrice,
          cash_amount: data.cash_amount,
          installments_count: data.installments_count,
          installments_amount: data.installments_amount,
          installments_paid: data.installments_paid,
          trade_description: data.trade_description || null,
          trade_value: data.trade_value,
          notes: data.notes || null,
          completed: nowCompleted,
        },
      },
      { onSuccess: () => onOpenChange(false) }
    )
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-full max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-xl focus:outline-none">
          <Dialog.Title className="mb-1 text-base font-semibold text-foreground">
            Editar Venda
          </Dialog.Title>
          <p className="mb-4 text-sm text-muted-foreground">{sale.vehicle.name}</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground">Data da venda</label>
              <input type="date" className={inputClass()} {...register('sale_date')} />
            </div>

            {/* À vista */}
            <Controller
              name="cash_amount"
              control={control}
              render={({ field }) => (
                <div>
                  <label className="text-sm text-muted-foreground">À vista (R$)</label>
                  <CurrencyInput value={field.value} onChange={field.onChange} className="mt-1" />
                </div>
              )}
            />

            {/* Parcelado */}
            <div className="rounded-lg border border-border p-3 space-y-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Parcelado</p>
              <div className="grid grid-cols-3 gap-3">
                <Controller
                  name="installments_count"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <label className="text-sm text-muted-foreground">Total</label>
                      <input
                        type="number" min={0} max={60}
                        className={inputClass()}
                        value={field.value}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </div>
                  )}
                />
                <Controller
                  name="installments_amount"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <label className="text-sm text-muted-foreground">Valor/parc.</label>
                      <CurrencyInput value={field.value} onChange={field.onChange} className="mt-1" />
                    </div>
                  )}
                />
                <Controller
                  name="installments_paid"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <label className="text-sm text-muted-foreground">Pagas</label>
                      <input
                        type="number" min={0}
                        className={inputClass()}
                        value={field.value}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </div>
                  )}
                />
              </div>
            </div>

            {/* Troca */}
            <div className="rounded-lg border border-border p-3 space-y-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Troca</p>
              <div>
                <label className="text-sm text-muted-foreground">Veículo recebido</label>
                <input
                  className={inputClass()}
                  placeholder="Ex: XRE 300 2020"
                  {...register('trade_description')}
                />
              </div>
              <Controller
                name="trade_value"
                control={control}
                render={({ field }) => (
                  <div>
                    <label className="text-sm text-muted-foreground">Valor da troca</label>
                    <CurrencyInput value={field.value} onChange={field.onChange} className="mt-1" />
                  </div>
                )}
              />
            </div>

            {totalSalePrice > 0 && (
              <div className="rounded-md bg-muted px-3 py-2 text-sm">
                <span className="text-muted-foreground">Total negociado: </span>
                <span className="font-semibold text-foreground">{formatCurrency(totalSalePrice)}</span>
              </div>
            )}

            <div>
              <label className="text-sm text-muted-foreground">Observações</label>
              <input className={inputClass()} placeholder="Comissão, detalhes..." {...register('notes')} />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={update.isPending}>
                Cancelar
              </Button>
              <Button type="submit" loading={update.isPending}>
                Salvar
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
