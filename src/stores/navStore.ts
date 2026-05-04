import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { useAuthStore } from './authStore'

export const CONFIGURABLE_NAV_KEYS = ['lancamentos', 'motos', 'investimentos', 'bens'] as const
export type NavKey = typeof CONFIGURABLE_NAV_KEYS[number]

interface NavState {
  hidden: NavKey[]
  toggle: (key: NavKey) => void
  isVisible: (key: NavKey) => boolean
}

function userStorage(prefix: string) {
  const key = () => `${prefix}-${useAuthStore.getState().user?.id ?? 'guest'}`
  return {
    getItem: () => localStorage.getItem(key()),
    setItem: (_: string, v: string) => localStorage.setItem(key(), v),
    removeItem: () => localStorage.removeItem(key()),
  }
}

export const useNavStore = create<NavState>()(
  persist(
    (set, get) => ({
      hidden: [],
      toggle: (key) => {
        const { hidden } = get()
        set({ hidden: hidden.includes(key) ? hidden.filter((k) => k !== key) : [...hidden, key] })
      },
      isVisible: (key) => !get().hidden.includes(key),
    }),
    {
      name: 'fintrack-nav',
      storage: createJSONStorage(() => userStorage('fintrack-nav')),
    }
  )
)
