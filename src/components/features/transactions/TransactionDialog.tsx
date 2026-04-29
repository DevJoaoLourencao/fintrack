import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { clsx } from 'clsx'
import * as Dialog from '@radix-ui/react-dialog'
import * as Select from '@radix-ui/react-select'
import { ChevronDownIcon, ChevronUpIcon, CheckIcon, ExclamationTriangleIcon } from '@radix-ui/react-icons'
import { useCardsQuery } from '@/hooks/useCards'
import { useCategoriesQuery } from '@/hooks/useCategories'
import { useAddTransaction } from '@/hooks/useTransactions'
import { useFiltersStore } from '@/stores/filtersStore'
import { Button } from '@/components/ui/Button'
import { CurrencyInput } from '@/components/ui/CurrencyInput'
import { addMonths, formatCurrency, formatMonth, formatMonthLabel } from '@/lib/dateUtils'

// ── Schema ────────────────────────────────────────────────────────────────────

const schema = z
  .object({
    type: z.enum(['credit_card', 'recurring', 'subscription']),
    description: z.string().min(1, 'Descrição obrigatória'),
    total_amount: z
      .number({ error: 'Informe o valor' })
      .positive('Valor deve ser maior que zero'),
    purchase_date: z.string().min(1, 'Data obrigatória'),
    category_id: z.string().min(1, 'Selecione uma categoria'),
    card_id: z.string().nullable(),
    total_installments: z.number().int().min(1).max(48),
    current_installment: z.number().int().min(1).default(1),
  })
  .superRefine((data, ctx) => {
    if (data.type === 'credit_card' && !data.card_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Selecione um cartão',
        path: ['card_id'],
      })
    }
    if (data.current_installment > data.total_installments) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Parcela atual não pode exceder o total',
        path: ['current_installment'],
      })
    }
  })

type FormValues = z.infer<typeof schema>

// ── Helpers ───────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  credit_card: 'Cartão de Crédito',
  recurring: 'Recorrente',
  subscription: 'Assinatura',
}

function inputClass(hasError?: boolean) {
  return clsx(
    'mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground',
    'placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-colors',
    hasError ? 'border-red-400 focus:ring-red-400/30' : 'border-border focus:ring-primary'
  )
}

function selectTriggerClass(hasError?: boolean) {
  return clsx(
    'mt-1 flex w-full items-center justify-between rounded-md border bg-background px-3 py-2 text-sm',
    'focus:outline-none focus:ring-2 transition-colors',
    hasError ? 'border-red-400 focus:ring-red-400/30' : 'border-border focus:ring-primary'
  )
}

const SELECT_ITEM_CLASS =
  'flex cursor-pointer items-center gap-2 rounded px-3 py-2 text-sm hover:bg-muted focus:bg-muted focus:outline-none'

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="mt-1 text-xs text-red-500">{message}</p>
}

function PrerequisiteAlert({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/[0.08] px-3 py-2.5 text-xs text-foreground">
      <ExclamationTriangleIcon className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-warning" />
      <span>{children}</span>
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

interface TransactionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TransactionDialog({ open, onOpenChange }: TransactionDialogProps) {
  const { data: cards = [] } = useCardsQuery()
  const { data: categories = [] } = useCategoriesQuery()
  const addTransaction = useAddTransaction()
  const { selectedMonth } = useFiltersStore()

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: 'credit_card',
      description: '',
      total_amount: 0,
      category_id: '',
      card_id: null,
      total_installments: 1,
      current_installment: 1,
      purchase_date: new Date().toISOString().slice(0, 10),
    },
  })

  useEffect(() => {
    if (open) {
      reset({
        type: 'credit_card',
        description: '',
        total_amount: 0,
        category_id: '',
        card_id: null,
        total_installments: 1,
        current_installment: 1,
        purchase_date: new Date().toISOString().slice(0, 10),
      })
    }
  }, [open, reset])

  const watchedType = watch('type')
  const watchedAmount = watch('total_amount')
  const watchedInstallments = watch('total_installments')
  const watchedCurrentInstallment = watch('current_installment')

  const isCreditCard = watchedType === 'credit_card'
  const isRecurring = watchedType === 'recurring'
  const isSubscription = watchedType === 'subscription'
  const hasNoCategories = categories.length === 0
  const hasNoCards = cards.length === 0
  const isBlocked = hasNoCategories || (isCreditCard && hasNoCards)

  const installmentAmount =
    watchedAmount > 0 && watchedInstallments > 0 ? watchedAmount / watchedInstallments : 0

  const showCurrentInstallment = isCreditCard && watchedInstallments > 1
  const isInProgress = showCurrentInstallment && watchedCurrentInstallment > 1
  const computedPurchaseMonth = isInProgress
    ? formatMonth(addMonths(new Date(`${selectedMonth}-01`), -watchedCurrentInstallment))
    : null

  function onSubmit(data: FormValues) {
    addTransaction.mutate(data, { onSuccess: () => onOpenChange(false) })
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-xl focus:outline-none">
          <Dialog.Title className="mb-4 text-lg font-semibold text-foreground">
            Novo Lançamento
          </Dialog.Title>

          {/* Alertas de pré-requisito */}
          {hasNoCategories && (
            <div className="mb-4">
              <PrerequisiteAlert>
                Cadastre pelo menos uma <strong>categoria</strong> em{' '}
                <strong>Configurações</strong> antes de adicionar lançamentos.
              </PrerequisiteAlert>
            </div>
          )}

          {isCreditCard && hasNoCards && (
            <div className="mb-4">
              <PrerequisiteAlert>
                Cadastre um <strong>cartão de crédito</strong> em{' '}
                <strong>Configurações</strong> para usar este tipo de lançamento.
              </PrerequisiteAlert>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Tipo */}
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <div>
                  <span className="text-sm text-muted-foreground">Tipo</span>
                  <Select.Root
                    value={field.value}
                    onValueChange={(v) => {
                      field.onChange(v)
                      setValue('card_id', null)
                      setValue('total_installments', 1)
                      setValue('current_installment', 1)
                    }}
                  >
                    <Select.Trigger className={selectTriggerClass(!!errors.type)}>
                      <Select.Value />
                      <ChevronDownIcon />
                    </Select.Trigger>
                    <Select.Portal>
                      <Select.Content className="z-50 rounded-md border border-border bg-card shadow-lg">
                        <Select.Viewport className="p-1">
                          {Object.entries(TYPE_LABELS).map(([value, label]) => (
                            <Select.Item key={value} value={value} className={SELECT_ITEM_CLASS}>
                              <Select.ItemIndicator><CheckIcon /></Select.ItemIndicator>
                              <Select.ItemText>{label}</Select.ItemText>
                            </Select.Item>
                          ))}
                        </Select.Viewport>
                      </Select.Content>
                    </Select.Portal>
                  </Select.Root>
                  <FieldError message={errors.type?.message} />
                </div>
              )}
            />

            {/* Descrição */}
            <div>
              <label htmlFor="description" className="text-sm text-muted-foreground">
                Descrição
              </label>
              <input
                id="description"
                className={inputClass(!!errors.description)}
                placeholder="Ex: Mercado, Netflix, Aluguel..."
                {...register('description')}
              />
              <FieldError message={errors.description?.message} />
            </div>

            {/* Valor */}
            <Controller
              name="total_amount"
              control={control}
              render={({ field }) => (
                <div>
                  <label htmlFor="total_amount" className="text-sm text-muted-foreground">
                    {isRecurring || isSubscription ? 'Valor mensal' : 'Valor total'}
                  </label>
                  <CurrencyInput
                    id="total_amount"
                    value={field.value}
                    onChange={field.onChange}
                    hasError={!!errors.total_amount}
                    className="mt-1"
                  />
                  <FieldError message={errors.total_amount?.message} />
                </div>
              )}
            />

            {/* Data */}
            {!isInProgress && (
              <div>
                <label htmlFor="purchase_date" className="text-sm text-muted-foreground">
                  Data da compra
                </label>
                <input
                  id="purchase_date"
                  type="date"
                  className={inputClass(!!errors.purchase_date)}
                  {...register('purchase_date')}
                />
                <FieldError message={errors.purchase_date?.message} />
              </div>
            )}

            {/* Categoria */}
            <Controller
              name="category_id"
              control={control}
              render={({ field }) => (
                <div>
                  <span className="text-sm text-muted-foreground">Categoria</span>
                  <Select.Root
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={hasNoCategories}
                  >
                    <Select.Trigger className={selectTriggerClass(!!errors.category_id)}>
                      <Select.Value placeholder="Selecione..." />
                      <ChevronDownIcon />
                    </Select.Trigger>
                    <Select.Portal>
                      <Select.Content className="z-50 rounded-md border border-border bg-card shadow-lg">
                        <Select.Viewport className="p-1">
                          {categories.map((cat) => (
                            <Select.Item key={cat.id} value={cat.id} className={SELECT_ITEM_CLASS}>
                              <Select.ItemIndicator><CheckIcon /></Select.ItemIndicator>
                              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: cat.color }} />
                              <Select.ItemText>{cat.name}</Select.ItemText>
                            </Select.Item>
                          ))}
                        </Select.Viewport>
                      </Select.Content>
                    </Select.Portal>
                  </Select.Root>
                  <FieldError message={errors.category_id?.message} />
                </div>
              )}
            />

            {/* Cartão (credit_card obrigatório, subscription opcional) */}
            {(isCreditCard || isSubscription) && (
              <Controller
                name="card_id"
                control={control}
                render={({ field }) => (
                  <div>
                    <span className="text-sm text-muted-foreground">
                      Cartão{isSubscription && <span className="ml-1 text-xs">(opcional)</span>}
                    </span>
                    <Select.Root
                      value={field.value ?? ''}
                      onValueChange={field.onChange}
                      disabled={hasNoCards}
                    >
                      <Select.Trigger className={selectTriggerClass(!!errors.card_id)}>
                        <Select.Value placeholder="Selecione..." />
                        <ChevronDownIcon />
                      </Select.Trigger>
                      <Select.Portal>
                        <Select.Content className="z-50 rounded-md border border-border bg-card shadow-lg">
                          <Select.Viewport className="p-1">
                            {cards.map((card) => (
                              <Select.Item key={card.id} value={card.id} className={SELECT_ITEM_CLASS}>
                                <Select.ItemIndicator><CheckIcon /></Select.ItemIndicator>
                                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: card.color }} />
                                <Select.ItemText>{card.name} •••• {card.last_four}</Select.ItemText>
                              </Select.Item>
                            ))}
                          </Select.Viewport>
                        </Select.Content>
                      </Select.Portal>
                    </Select.Root>
                    <FieldError message={errors.card_id?.message} />
                  </div>
                )}
              />
            )}

            {/* Parcelamento (só credit_card não-recorrente) */}
            {isCreditCard && !isRecurring && (
              <Controller
                name="total_installments"
                control={control}
                render={({ field }) => (
                  <div>
                    <span className="text-sm text-muted-foreground">Parcelamento</span>
                    <Select.Root
                      value={String(field.value)}
                      onValueChange={(v) => {
                        field.onChange(Number(v))
                        setValue('current_installment', 1)
                      }}
                    >
                      <Select.Trigger className={selectTriggerClass(!!errors.total_installments)}>
                        <Select.Value />
                        <ChevronDownIcon />
                      </Select.Trigger>
                      <Select.Portal>
                        <Select.Content
                          className="z-50 max-h-56 overflow-hidden rounded-md border border-border bg-card shadow-lg"
                          position="popper"
                          sideOffset={4}
                        >
                          <Select.ScrollUpButton className="flex h-6 cursor-default items-center justify-center bg-card text-muted-foreground">
                            <ChevronUpIcon />
                          </Select.ScrollUpButton>
                          <Select.Viewport className="p-1">
                            {Array.from({ length: 48 }, (_, i) => {
                              const n = i + 1
                              return (
                                <Select.Item key={n} value={String(n)} className={SELECT_ITEM_CLASS}>
                                  <Select.ItemIndicator><CheckIcon /></Select.ItemIndicator>
                                  <Select.ItemText>
                                    {n === 1 ? '1x — À vista' : `${n}x`}
                                  </Select.ItemText>
                                </Select.Item>
                              )
                            })}
                          </Select.Viewport>
                          <Select.ScrollDownButton className="flex h-6 cursor-default items-center justify-center bg-card text-muted-foreground">
                            <ChevronDownIcon />
                          </Select.ScrollDownButton>
                        </Select.Content>
                      </Select.Portal>
                    </Select.Root>

                    {installmentAmount > 0 && (
                      <div className="mt-2 rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
                        {watchedInstallments === 1 ? (
                          <span>À vista · {formatCurrency(watchedAmount)}</span>
                        ) : (
                          <>
                            {watchedInstallments}× de{' '}
                            <strong className="text-foreground">{formatCurrency(installmentAmount)}</strong>
                            {' '}· Total {formatCurrency(watchedAmount)}
                            <br />
                            <span className="text-[11px]">
                              Cada parcela aparece automaticamente no mês de vencimento.
                            </span>
                          </>
                        )}
                      </div>
                    )}
                    <FieldError message={errors.total_installments?.message} />
                  </div>
                )}
              />
            )}

            {/* Parcela atual (para lançamentos em andamento) */}
            {showCurrentInstallment && (
              <Controller
                name="current_installment"
                control={control}
                render={({ field }) => (
                  <div>
                    <span className="text-sm text-muted-foreground">Parcela atual</span>
                    <Select.Root
                      value={String(field.value)}
                      onValueChange={(v) => field.onChange(Number(v))}
                    >
                      <Select.Trigger className={selectTriggerClass(!!errors.current_installment)}>
                        <Select.Value />
                        <ChevronDownIcon />
                      </Select.Trigger>
                      <Select.Portal>
                        <Select.Content
                          className="z-50 max-h-56 overflow-hidden rounded-md border border-border bg-card shadow-lg"
                          position="popper"
                          sideOffset={4}
                        >
                          <Select.ScrollUpButton className="flex h-6 cursor-default items-center justify-center bg-card text-muted-foreground">
                            <ChevronUpIcon />
                          </Select.ScrollUpButton>
                          <Select.Viewport className="p-1">
                            {Array.from({ length: watchedInstallments }, (_, i) => {
                              const n = i + 1
                              return (
                                <Select.Item key={n} value={String(n)} className={SELECT_ITEM_CLASS}>
                                  <Select.ItemIndicator><CheckIcon /></Select.ItemIndicator>
                                  <Select.ItemText>
                                    {n === 1 ? '1 — início (padrão)' : `${n} de ${watchedInstallments}`}
                                  </Select.ItemText>
                                </Select.Item>
                              )
                            })}
                          </Select.Viewport>
                          <Select.ScrollDownButton className="flex h-6 cursor-default items-center justify-center bg-card text-muted-foreground">
                            <ChevronDownIcon />
                          </Select.ScrollDownButton>
                        </Select.Content>
                      </Select.Portal>
                    </Select.Root>
                    {isInProgress && computedPurchaseMonth && (
                      <div className="mt-2 rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
                        Compra calculada para{' '}
                        <strong className="text-foreground">{formatMonthLabel(computedPurchaseMonth)}</strong>.
                        {' '}Parcelas 1–{watchedCurrentInstallment - 1} serão marcadas como pagas.
                      </div>
                    )}
                    <FieldError message={errors.current_installment?.message} />
                  </div>
                )}
              />
            )}

            {isRecurring && (
              <p className="rounded bg-muted px-3 py-2 text-xs text-muted-foreground">
                Recorrente sem fim — o valor mensal será lançado automaticamente todo mês, para sempre.
              </p>
            )}

            {isSubscription && (
              <p className="rounded bg-muted px-3 py-2 text-xs text-muted-foreground">
                Assinatura recorrente — lançada automaticamente todo mês. Aparece na seção "Assinaturas", separada de parcelas e lançamentos avulsos.
              </p>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={addTransaction.isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" loading={addTransaction.isPending} disabled={isBlocked}>
                Salvar
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
