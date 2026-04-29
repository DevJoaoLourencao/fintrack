export interface Card {
  id: string
  user_id: string
  name: string
  last_four: string
  color: string
  closing_day: number
  due_day: number
}

export type CardCreate = Omit<Card, 'id' | 'user_id'>
