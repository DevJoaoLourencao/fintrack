export interface Category {
  id: string
  user_id: string
  name: string
  color: string
  icon: string
}

export type CategoryCreate = Omit<Category, 'id' | 'user_id'>
