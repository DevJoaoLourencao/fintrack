import type { ActiveInstallmentGroup, Card, Category, Installment, RichInstallment, Transaction } from '@/domain'
import { supabase } from '@/lib/supabase'
import { addMonths, monthOf } from '@/lib/dateUtils'
import { dueDate } from '@/lib/installmentUtils'
import { createMockStorage } from './mock/storage'

const MOCK_ENABLED = import.meta.env.VITE_MOCK_DATA === 'true'

const storage = createMockStorage<Installment>('fintrack-installments')
const txStorage = createMockStorage<Transaction>('fintrack-transactions')
const catStorage = createMockStorage<Category>('fintrack-categories')
const cardStorage = createMockStorage<Card>('fintrack-cards')

if (MOCK_ENABLED) {
  storage.seed([
    { id: 'mock-inst-1', transaction_id: 'mock-tx-1', number: 1, amount: 100, due_date: '2026-04-10', paid: true },
    { id: 'mock-inst-2', transaction_id: 'mock-tx-1', number: 2, amount: 100, due_date: '2026-05-10', paid: false },
    { id: 'mock-inst-3', transaction_id: 'mock-tx-1', number: 3, amount: 100, due_date: '2026-06-10', paid: false },
    { id: 'mock-inst-4', transaction_id: 'mock-tx-2', number: 1, amount: 45,  due_date: '2026-04-10', paid: false },
  ])
}

function buildRich(installment: Installment): RichInstallment {
  const transaction = txStorage.list().find((t) => t.id === installment.transaction_id)!
  const category = catStorage.list().find((c) => c.id === transaction.category_id)!
  const card = transaction.card_id ? cardStorage.list().find((c) => c.id === transaction.card_id) : undefined
  return { ...installment, transaction, category, card }
}

export const installmentService = {
  async listByMonth(userId: string, month: string): Promise<RichInstallment[]> {
    if (MOCK_ENABLED) {
      const transactions = txStorage.list()
      return Promise.resolve(
        storage
          .list()
          .filter((i) => {
            const tx = transactions.find((t) => t.id === i.transaction_id)
            return tx?.user_id === userId && monthOf(i.due_date) === month
          })
          .map(buildRich)
          .sort((a, b) => a.due_date.localeCompare(b.due_date) || a.number - b.number)
      )
    }

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
    if (MOCK_ENABLED) {
      return Promise.resolve(items.map((item) => storage.create(item)))
    }
    const { data, error } = await supabase.from('installments').insert(items).select()
    if (error) throw error
    return data as Installment[]
  },

  // Upsert-safe variant for recurring extension — ignores already-existing numbers
  async createBatchSafe(items: Omit<Installment, 'id'>[]): Promise<void> {
    if (MOCK_ENABLED) {
      items.forEach((item) => {
        const exists = storage.list().some(
          (i) => i.transaction_id === item.transaction_id && i.number === item.number
        )
        if (!exists) storage.create(item)
      })
      return
    }
    const { error } = await supabase
      .from('installments')
      .upsert(items, { onConflict: 'transaction_id,number', ignoreDuplicates: true })
    if (error) throw error
  },

  async getLastByTransaction(transactionId: string): Promise<Installment | null> {
    if (MOCK_ENABLED) {
      const all = storage.list().filter((i) => i.transaction_id === transactionId)
      if (all.length === 0) return Promise.resolve(null)
      return Promise.resolve(all.reduce((prev, curr) => (curr.number > prev.number ? curr : prev)))
    }
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
    if (MOCK_ENABLED) {
      return Promise.resolve(storage.update(id, { amount }))
    }
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
      if (card) {
        return dueDate(purchaseDate, card.due_day, idx)
      }
      const [y, m, d] = purchaseDate.split('-').map(Number)
      const target = addMonths(new Date(y, m - 1, d), idx)
      return `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, '0')}-${String(target.getDate()).padStart(2, '0')}`
    }

    if (MOCK_ENABLED) {
      storage.list()
        .filter((i) => i.transaction_id === transactionId && !i.paid)
        .forEach((i) => storage.update(i.id, { due_date: calcDue(i.number) }))
      return
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
    if (MOCK_ENABLED) {
      const toDelete = storage.list().filter(
        (i) => i.transaction_id === transactionId && i.number > keepCount && !i.paid
      )
      toDelete.forEach((i) => storage.remove(i.id))
      return
    }
    const { error } = await supabase
      .from('installments')
      .delete()
      .eq('transaction_id', transactionId)
      .eq('paid', false)
      .gt('number', keepCount)
    if (error) throw error
  },

  async updateAllUnpaid(transactionId: string, amount: number): Promise<void> {
    if (MOCK_ENABLED) {
      storage.list()
        .filter((i) => i.transaction_id === transactionId && !i.paid)
        .forEach((i) => storage.update(i.id, { amount }))
      return
    }
    const { error } = await supabase
      .from('installments')
      .update({ amount })
      .eq('transaction_id', transactionId)
      .eq('paid', false)
    if (error) throw error
  },

  async togglePaid(id: string, paid: boolean): Promise<Installment> {
    if (MOCK_ENABLED) {
      return Promise.resolve(storage.update(id, { paid }))
    }
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

    if (MOCK_ENABLED) {
      const transactions = txStorage.list()
      return Promise.resolve(
        storage
          .list()
          .filter((i) => {
            const tx = transactions.find((t) => t.id === i.transaction_id)
            return tx?.user_id === userId && !i.paid && i.due_date >= today
          })
          .sort((a, b) => a.due_date.localeCompare(b.due_date))
          .slice(0, limit)
          .map(buildRich)
      )
    }

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

    if (MOCK_ENABLED) {
      const transactions = txStorage
        .list()
        .filter((t) => t.user_id === userId && t.type === 'credit_card' && t.total_installments > 1)
      return Promise.resolve(
        transactions.flatMap((t) => {
          const allInst = storage.list().filter((i) => i.transaction_id === t.id)
          const remaining = allInst.filter((i) => !i.paid && i.due_date >= cutoff)
          if (remaining.length === 0) return []
          return [{
            transactionId: t.id,
            description: t.description,
            category_id: t.category_id,
            card_id: t.card_id,
            purchase_date: t.purchase_date,
            monthlyAmount: t.total_amount / t.total_installments,
            totalInstallments: t.total_installments,
            remaining: remaining.length,
          }]
        })
      )
    }

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

    if (MOCK_ENABLED) {
      const transactions = txStorage.list()
      return Promise.resolve(
        storage
          .list()
          .filter((i) => {
            const tx = transactions.find((t) => t.id === i.transaction_id)
            return tx?.user_id === userId && i.due_date >= firstDay && i.due_date < endExclusive
          })
          .map(buildRich)
      )
    }

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
