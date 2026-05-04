import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { useAuthStore } from './authStore'

interface HideValuesState {
  hideValues: boolean
  toggle: () => void
}

function userStorage(prefix: string) {
  const key = () => `${prefix}-${useAuthStore.getState().user?.id ?? 'guest'}`
  return {
    getItem: () => localStorage.getItem(key()),
    setItem: (_: string, v: string) => localStorage.setItem(key(), v),
    removeItem: () => localStorage.removeItem(key()),
  }
}

export const useHideValuesStore = create<HideValuesState>()(
  persist(
    (set) => ({
      hideValues: true,
      toggle: () => set((s) => ({ hideValues: !s.hideValues })),
    }),
    {
      name: 'fintrack-hide-values',
      storage: createJSONStorage(() => userStorage('fintrack-hide-values')),
    }
  )
)
