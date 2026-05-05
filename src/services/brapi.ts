import { supabase } from '@/lib/supabase'

export interface BrapiQuote {
  symbol: string
  regularMarketPrice: number
  regularMarketChangePercent: number
  regularMarketChange: number
  shortName: string
}

export async function fetchQuotes(tickers: string[]): Promise<BrapiQuote[]> {
  if (tickers.length === 0) return []
  const { data, error } = await supabase.functions.invoke('brapi-quotes', { body: { tickers } })
  if (error) throw error
  return (data as BrapiQuote[]) ?? []
}

export async function fetchCryptoQuotes(coins: string[]): Promise<BrapiQuote[]> {
  if (coins.length === 0) return []
  const { data, error } = await supabase.functions.invoke('crypto-quotes', { body: { coins } })
  if (error) throw error
  return (data as BrapiQuote[]) ?? []
}
