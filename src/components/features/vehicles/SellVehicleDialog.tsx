import { useEffect } from 'react'
import { useForm, Controller, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import * as Dialog from '@radix-ui/react-dialog'
import * as Select from '@radix-ui/react-select'
import { CheckIcon, ChevronDownIcon } from '@radix-ui/react-icons'
import { clsx } from 'clsx'
import type { Vehicle } from '@/domain'
import { Button } from '@/components/ui/Button'
import { CurrencyInput } from '@/components/ui/CurrencyInput'
import { useSellVehicle } from '@/hooks/useVehicles'
import { formatCurrency } from '@/lib/dateUtils'

const schema = z.object({
  vehicle_id: z.string().min(1, 'Selecione o veículo'),
  sale_date: z.string().optional(),
  cash_amount: z.number().min(0),
  installments_count: z.number().int().min(0).max(60),
  installments_amount: z.number().min(0),
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

const SELECT_ITEM_CLASS =
  'flex cursor-pointer items-center gap-2 rounded px-3 py-2 text-sm hover:bg-muted focus:bg-muted focus:outline-none'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  activeVehicles: Vehicle[]
  preselectedVehicleId?: string
}

export function SellVehicleDialog({ open, onOpenChange, activeVehicles, preselectedVehicleId }: Props) {
  const sell = useSellVehicle()

  const { register, control, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      vehicle_id: preselectedVehicleId ?? '',
      sale_date: new Date().toISOString().slice(0, 10),
      cash_amount: 0,
      installments_count: 0,
      installments_amount: 0,
      trade_description: '',
      trade_value: 0,
      notes: '',
    },
  })

  useEffect(() => {
    if (open) {
      reset({
        vehicle_id: preselectedVehicleId ?? '',
        sale_date: new Date().toISOString().slice(0, 10),
        cash_amount: 0,
        installments_count: 0,
        installments_amount: 0,
        trade_description: '',
        trade_value: 0,
        notes: '',
      })
    }
  }, [open, reset, preselectedVehicleId])

  const [cashAmount, installmentsCount, installmentsAmount, tradeValue] = useWatch({
    control,
    name: ['cash_amount', 'installments_count', 'installments_amount', 'trade_value'],
  })

  const totalSalePrice =
    (cashAmount ?? 0) +
    (installmentsCount ?? 0) * (installmentsAmount ?? 0) +
    (tradeValue ?? 0)

  function onSubmit(data: FormValues) {
    sell.mutate(
      {
        vehicle_id: data.vehicle_id,
        total_sale_price: totalSalePrice,
        cash_amount: data.cash_amount,
        installments_count: data.installments_count,
        installments_amount: data.installments_amount,
        installments_paid: 0,
        trade_description: data.trade_description || null,
        trade_value: data.trade_value,
        notes: data.notes || null,
        sale_date: data.sale_date || null,
        completed: data.installments_count === 0,
      },
      { onSuccess: () => onOpenChange(false) }
    )
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-full max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-xl focus:outline-none">
          <Dialog.Title className="mb-4 text-base font-semibold text-foreground">
            Registrar Venda
          </Dialog.Title>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Veículo */}
            <Controller
              name="vehicle_id"
              control={control}
              render={({ field }) => (
                <div>
                  <span className="text-sm text-muted-foreground">Veículo</span>
                  <Select.Root value={field.value} onValueChange={field.onChange} disabled={!!preselectedVehicleId}>
                    <Select.Trigger className={clsx(
                      'mt-1 flex w-full items-center justify-between rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 transition-colors',
                      errors.vehicle_id ? 'border-red-400 focus:ring-red-400/30' : 'border-border focus:ring-primary'
                    )}>
                      <Select.Value placeholder="Selecione o veículo..." />
                      <ChevronDownIcon />
                    </Select.Trigger>
                    <Select.Portal>
                      <Select.Content className="z-50 max-h-56 overflow-hidden rounded-md border border-border bg-card shadow-lg" position="popper" sideOffset={4}>
                        <Select.Viewport className="p-1">
                          {activeVehicles.map((v) => (
                            <Select.Item key={v.id} value={v.id} className={SELECT_ITEM_CLASS}>
                              <Select.ItemIndicator><CheckIcon /></Select.ItemIndicator>
                              <Select.ItemText>{v.name} — {formatCurrency(v.purchase_price)}</Select.ItemText>
                            </Select.Item>
                          ))}
                        </Select.Viewport>
                      </Select.Content>
                    </Select.Portal>
                  </Select.Root>
                  {errors.vehicle_id && <p className="mt-1 text-xs text-red-500">{errors.vehicle_id.message}</p>}
                </div>
              )}
            />

            {/* Data da venda */}
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
              <div className="grid grid-cols-2 gap-3">
                <Controller
                  name="installments_count"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <label className="text-sm text-muted-foreground">Nº parcelas</label>
                      <input
                        type="number"
                        min={0}
                        max={60}
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
                      <label className="text-sm text-muted-foreground">Valor/parcela</label>
                      <CurrencyInput value={field.value} onChange={field.onChange} className="mt-1" />
                    </div>
                  )}
                />
              </div>
            </div>

            {/* Troca */}
            <div className="rounded-lg border border-border p-3 space-y-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Troca</p>
              <div>
                <label className="text-sm text-muted-foreground">Veículo recebido na troca</label>
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

            {/* Total calculado */}
            {totalSalePrice > 0 && (
              <div className="rounded-md bg-muted px-3 py-2 text-sm">
                <span className="text-muted-foreground">Total negociado: </span>
                <span className="font-semibold text-foreground">{formatCurrency(totalSalePrice)}</span>
              </div>
            )}

            {/* Observações */}
            <div>
              <label className="text-sm text-muted-foreground">Observações (opcional)</label>
              <input className={inputClass()} placeholder="Comissão, detalhes..." {...register('notes')} />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={sell.isPending}>
                Cancelar
              </Button>
              <Button type="submit" loading={sell.isPending}>
                Registrar Venda
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
