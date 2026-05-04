import type { ActiveInstallmentGroup, Card, Category, Installment, RichInstallment, Transaction } from '@/domain'
import { supabase } from '@/lib/supabase'
import { addMonths } from '@/lib/dateUtils'
import { dueDate } from '@/lib/installmentUtils'

export const installmentService = {
  async listByMonth(userId: string, month: string): Promise<RichInstallment[]> {
    const firstDay = `${month}-01`
    const [y, m] = month.split('-').map(Number)
    const nextMonth = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, '0')}-01`

    const { data, error } = await supabase
      .from('installments')
      .select(`
        *,
        transaction:transactions!inner(*, category:categories!inner(*), card:cards(*))
      `)
      .eq('transaction.user_id', userId)
      .gte('due_date', firstDay)
      .lt('due_date', nextMonth)
      .order('due_date')
      .order('number')

    if (error) throw error

    return (data as unknown[]).map((row) => {
      const r = row as {
        id: string; transaction_id: string; number: number; amount: number; due_date: string; paid: boolean
        transaction: Transaction & { category: Category; card: Card | null }
      }
      return {
        id: r.id,
        transaction_id: r.transaction_id,
        number: r.number,
        amount: r.amount,
        due_date: r.due_date,
        paid: r.paid,
        transaction: { ...r.transaction, category: undefined, card: undefined } as Transaction,
        category: r.transaction.category,
        card: r.transaction.card ?? undefined,
      }
    })
  },

  async createBatch(items: Omit<Installment, 'id'>[]): Promise<Installment[]> {
    const { data, error } = await supabase.from('installments').insert(items).select()
    if (error) throw error
    return data as Installment[]
  },

  async createBatchSafe(items: Omit<Installment, 'id'>[]): Promise<void> {
    const { error } = await supabase
      .from('installments')
      .upsert(items, { onConflict: 'transaction_id,number', ignoreDuplicates: true })
    if (error) throw error
  },

  async getLastByTransaction(transactionId: string): Promise<Installment | null> {
    const { data, error } = await supabase
      .from('installments')
      .select('*')
      .eq('transaction_id', transactionId)
      .order('number', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (error) throw error
    return data as Installment | null
  },

  async updateAmount(id: string, amount: number): Promise<Installment> {
    const { data, error } = await supabase
      .from('installments')
      .update({ amount })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data as Installment
  },

  async updateDueDates(transactionId: string, purchaseDate: string, card?: { due_day: number }): Promise<void> {
    const calcDue = (number: number) => {
      const idx = number - 1
      if (card) return dueDate(purchaseDate, card.due_day, idx)
      const [y, m, d] = purchaseDate.split('-').map(Number)
      const target = addMonths(new Date(y, m - 1, d), idx)
      return `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, '0')}-${String(target.getDate()).padStart(2, '0')}`
    }

    const { data: rows, error: fetchErr } = await supabase
      .from('installments')
      .select('id, number')
      .eq('transaction_id', transactionId)
      .eq('paid', false)
    if (fetchErr) throw fetchErr

    await Promise.all(
      (rows as { id: string; number: number }[]).map(({ id, number }) =>
        supabase.from('installments').update({ due_date: calcDue(number) }).eq('id', id)
      )
    )
  },

  async deleteUnpaidAfter(transactionId: string, keepCount: number): Promise<void> {
    const { error } = await supabase
      .from('installments')
      .delete()
      .eq('transaction_id', transactionId)
      .eq('paid', false)
      .gt('number', keepCount)
    if (error) throw error
  },

  async updateAllUnpaid(transactionId: string, amount: number): Promise<void> {
    const { error } = await supabase
      .from('installments')
      .update({ amount })
      .eq('transaction_id', transactionId)
      .eq('paid', false)
    if (error) throw error
  },

  async togglePaid(id: string, paid: boolean): Promise<Installment> {
    const { data, error } = await supabase
      .from('installments')
      .update({ paid })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data as Installment
  },

  async listUpcoming(userId: string, limit: number): Promise<RichInstallment[]> {
    const today = new Date().toISOString().slice(0, 10)

    const { data, error } = await supabase
      .from('installments')
      .select(`*, transaction:transactions!inner(*, category:categories!inner(*), card:cards(*))`)
      .eq('transaction.user_id', userId)
      .eq('paid', false)
      .gte('due_date', today)
      .order('due_date')
      .limit(limit)

    if (error) throw error
    return (data as unknown[]).map((row) => {
      const r = row as {
        id: string; transaction_id: string; number: number; amount: number; due_date: string; paid: boolean
        transaction: Transaction & { category: Category; card: Card | null }
      }
      return {
        id: r.id, transaction_id: r.transaction_id, number: r.number,
        amount: r.amount, due_date: r.due_date, paid: r.paid,
        transaction: { ...r.transaction } as Transaction,
        category: r.transaction.category,
        card: r.transaction.card ?? undefined,
      }
    })
  },

  async listActiveInstallmentGroups(userId: string, fromDate?: string): Promise<ActiveInstallmentGroup[]> {
    const cutoff = fromDate ?? new Date().toISOString().slice(0, 10)

    const { data, error } = await supabase
      .from('installments')
      .select('amount, transaction_id, transaction:transactions!inner(id, description, category_id, card_id, purchase_date, total_installments)')
      .eq('transaction.user_id', userId)
      .eq('transaction.type', 'credit_card')
      .gt('transaction.total_installments', 1)
      .eq('paid', false)
      .gte('due_date', cutoff)

    if (error) throw error

    const groupMap = new Map<string, ActiveInstallmentGroup>()
    for (const row of data as unknown as Array<{
      amount: number
      transaction_id: string
      transaction: { id: string; description: string; category_id: string; card_id: string | null; purchase_date: string; total_installments: number }
    }>) {
      const tx = row.transaction
      if (!groupMap.has(tx.id)) {
        groupMap.set(tx.id, {
          transactionId: tx.id,
          description: tx.description,
          category_id: tx.category_id,
          card_id: tx.card_id,
          purchase_date: tx.purchase_date,
          monthlyAmount: row.amount,
          totalInstallments: tx.total_installments,
          remaining: 0,
        })
      }
      groupMap.get(tx.id)!.remaining++
    }

    return Array.from(groupMap.values())
  },

  async listByDateRange(userId: string, fromMonth: string, toMonth: string): Promise<RichInstallment[]> {
    const firstDay = `${fromMonth}-01`
    const [y, m] = toMonth.split('-').map(Number)
    const endExclusive = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, '0')}-01`

    const { data, error } = await supabase
      .from('installments')
      .select(`*, transaction:transactions!inner(*, category:categories!inner(*), card:cards(*))`)
      .eq('transaction.user_id', userId)
      .gte('due_date', firstDay)
      .lt('due_date', endExclusive)
      .order('due_date')

    if (error) throw error
    return (data as unknown[]).map((row) => {
      const r = row as {
        id: string; transaction_id: string; number: number; amount: number; due_date: string; paid: boolean
        transaction: Transaction & { category: Category; card: Card | null }
      }
      return {
        id: r.id, transaction_id: r.transaction_id, number: r.number,
        amount: r.amount, due_date: r.due_date, paid: r.paid,
        transaction: { ...r.transaction } as Transaction,
        category: r.transaction.category,
        card: r.transaction.card ?? undefined,
      }
    })
  },
}
