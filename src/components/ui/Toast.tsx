import * as RadixToast from '@radix-ui/react-toast'
import { clsx } from 'clsx'
import { create } from 'zustand'

type ToastVariant = 'default' | 'destructive'

interface ToastItem {
  id: string
  title: string
  description?: string
  variant?: ToastVariant
}

interface ToastStore {
  toasts: ToastItem[]
  add: (toast: Omit<ToastItem, 'id'>) => void
  remove: (id: string) => void
}

const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  add: (t) =>
    set((s) => ({
      toasts: [...s.toasts, { ...t, id: crypto.randomUUID() }],
    })),
  remove: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))

export function useToast() {
  const add = useToastStore((s) => s.add)
  return {
    toast: (t: Omit<ToastItem, 'id'>) => add(t),
  }
}

export function ToastProvider() {
  const { toasts, remove } = useToastStore()

  return (
    <RadixToast.Provider swipeDirection="right">
      {toasts.map((t) => (
        <RadixToast.Root
          key={t.id}
          open
          onOpenChange={(open) => { if (!open) remove(t.id) }}
          duration={4000}
          className={clsx(
            'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border p-4 shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=open]:slide-in-from-bottom-4',
            t.variant === 'destructive'
              ? 'border-red-200 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100'
              : 'border-border bg-card text-card-foreground'
          )}
        >
          <div className="flex-1">
            <RadixToast.Title className="text-sm font-semibold">{t.title}</RadixToast.Title>
            {t.description && (
              <RadixToast.Description className="mt-1 text-sm opacity-70">
                {t.description}
              </RadixToast.Description>
            )}
          </div>
          <RadixToast.Close className="opacity-50 hover:opacity-100 text-sm">✕</RadixToast.Close>
        </RadixToast.Root>
      ))}
      <RadixToast.Viewport className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-96" />
    </RadixToast.Provider>
  )
}
