export function createMockStorage<T extends { id: string }>(key: string) {
  const load = (): T[] => {
    try {
      return JSON.parse(localStorage.getItem(key) ?? '[]') as T[]
    } catch {
      return []
    }
  }
  const save = (items: T[]) => localStorage.setItem(key, JSON.stringify(items))

  return {
    list: (): T[] => load(),
    get: (id: string): T | undefined => load().find((i) => i.id === id),
    create: (data: Omit<T, 'id'>): T => {
      const item = { ...data, id: crypto.randomUUID() } as T
      save([...load(), item])
      return item
    },
    update: (id: string, data: Partial<Omit<T, 'id'>>): T => {
      let updated!: T
      save(
        load().map((i) => {
          if (i.id === id) { updated = { ...i, ...data }; return updated }
          return i
        })
      )
      return updated
    },
    remove: (id: string): void => save(load().filter((i) => i.id !== id)),
    seed: (items: T[]): void => { if (load().length === 0) save(items) },
  }
}
