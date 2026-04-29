import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import * as Dialog from '@radix-ui/react-dialog'
import { clsx } from 'clsx'
import type { InvestmentSnapshot, InvestmentAsset, AssetCategory } from '@/domain'
import { Button } from '@/components/ui/Button'
import { CurrencyInput } from '@/components/ui/CurrencyInput'
import { useAddSnapshot, useUpdateSnapshot } from '@/hooks/useInvestments'
import { useExchangeRate } from '@/hooks/useExchangeRate'
import { formatCurrency } from '@/lib/dateUtils'

const schema = z.object({
  date: z.string().min(1, 'Data obrigatória'),
  acoes: z.number().min(0),
  fiis: z.number().min(0),
  cripto: z.number().min(0),
  internacional: z.number().min(0),
  renda_fixa: z.number().min(0),
  notes: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

const FIELDS: { key: keyof Omit<FormValues, 'date' | 'notes'>; label: string; color: string }[] = [
  { key: 'acoes',         label: 'Ações',               color: '#6366f1' },
  { key: 'fiis',          label: 'Fundos Imobiliários', color: '#f59e0b' },
  { key: 'cripto',        label: 'Criptomoedas',        color: '#f97316' },
  { key: 'internacional', label: 'Internacional (ETF/Stocks/REITs)', color: '#8b5cf6' },
  { key: 'renda_fixa',    label: 'Renda Fixa / Reserva', color: '#10b981' },
]

function inputClass() {
  return clsx(
    'mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground',
    'placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-colors'
  )
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  snapshot?: InvestmentSnapshot
  currentAssets?: InvestmentAsset[]
}

export function InvestmentDialog({ open, onOpenChange, snapshot, currentAssets = [] }: Props) {
  const isEditing = !!snapshot
  const add = useAddSnapshot()
  const update = useUpdateSnapshot()
  const isPending = add.isPending || update.isPending
  const { data: usdRate } = useExchangeRate()

  const hasUsdAssets = currentAssets.some((a) => a.currency === 'USD')

  const { register, control, handleSubmit, reset, watch, setValue } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { date: '', acoes: 0, fiis: 0, cripto: 0, internacional: 0, renda_fixa: 0, notes: '' },
  })

  useEffect(() => {
    if (open) {
      reset({
        date: snapshot?.date ?? new Date().toISOString().slice(0, 10),
        acoes: snapshot?.acoes ?? 0,
        fiis: snapshot?.fiis ?? 0,
        cripto: snapshot?.cripto ?? 0,
        internacional: snapshot?.internacional ?? 0,
        renda_fixa: snapshot?.renda_fixa ?? 0,
        notes: snapshot?.notes ?? '',
      })
    }
  }, [open, reset, snapshot])

  const values = watch(['acoes', 'fiis', 'cripto', 'internacional', 'renda_fixa'])
  const total = values.reduce((s, v) => s + (v ?? 0), 0)

  function toBrl(asset: InvestmentAsset): number {
    if (asset.currency === 'USD' && usdRate) return asset.amount * usdRate
    return asset.amount
  }

  function fillFromAssets() {
    const sumByCategory = (cat: AssetCategory) =>
      currentAssets.filter((a) => a.category === cat).reduce((s, a) => s + toBrl(a), 0)
    setValue('acoes', sumByCategory('acoes'))
    setValue('fiis', sumByCategory('fiis'))
    setValue('cripto', sumByCategory('cripto'))
    setValue('internacional', sumByCategory('internacional'))
    setValue('renda_fixa', sumByCategory('renda_fixa'))
  }

  function onSubmit(data: FormValues) {
    const payload = {
      date: data.date,
      acoes: data.acoes,
      fiis: data.fiis,
      cripto: data.cripto,
      internacional: data.internacional,
      renda_fixa: data.renda_fixa,
      notes: data.notes || null,
      usd_rate: usdRate ?? null,
    }
    if (isEditing) {
      update.mutate({ id: snapshot.id, data: payload }, { onSuccess: () => onOpenChange(false) })
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
            {isEditing ? 'Editar Snapshot' : 'Registrar Snapshot'}
          </Dialog.Title>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {currentAssets.length > 0 && (
              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={fillFromAssets}
                  disabled={hasUsdAssets && !usdRate}
                  className="w-full rounded-md border border-dashed border-border py-2 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Preencher da carteira
                </button>
                {hasUsdAssets && (
                  <p className="text-center text-xs text-muted-foreground">
                    {usdRate
                      ? <>Ativos em USD convertidos com cotação de <span className="font-semibold text-foreground">{formatCurrency(usdRate)}</span></>
                      : 'Buscando cotação do dólar…'}
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="text-sm text-muted-foreground">Data</label>
              <input type="date" className={inputClass()} {...register('date')} />
            </div>

            <div className="space-y-3">
              {FIELDS.map(({ key, label, color }) => (
                <Controller
                  key={key}
                  name={key}
                  control={control}
                  render={({ field }) => (
                    <div>
                      <label className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                        {label}
                      </label>
                      <CurrencyInput value={field.value} onChange={field.onChange} className="mt-1" />
                    </div>
                  )}
                />
              ))}
            </div>

            {total > 0 && (
              <div className="rounded-md bg-muted px-3 py-2 text-sm">
                <span className="text-muted-foreground">Total: </span>
                <span className="font-semibold text-foreground">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}
                </span>
              </div>
            )}

            <div>
              <label className="text-sm text-muted-foreground">Observações (opcional)</label>
              <input className={inputClass()} placeholder="Notas..." {...register('notes')} />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isPending}>
                Cancelar
              </Button>
              <Button type="submit" loading={isPending}>
                {isEditing ? 'Salvar' : 'Registrar'}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
