import { create } from 'zustand'
import { currentMonth } from '@/lib/dateUtils'

interface FiltersState {
  selectedMonth: string
  setSelectedMonth: (m: string) => void
}

export const useFiltersStore = create<FiltersState>((set) => ({
  selectedMonth: currentMonth(),
  setSelectedMonth: (selectedMonth) => set({ selectedMonth }),
}))
