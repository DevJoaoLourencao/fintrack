import { supabase } from '@/lib/supabase'

export interface BrapiQuote {
  symbol: string
  regularMarketPrice: number
  regularMarketChangePercent: number
  regularMarketChange: number
  shortName: string
}

export interface BrapiFundamentals {
  symbol: string
  dividendoAnual: number | null
  lpa: number | null
  vpa: number | null
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

export async function fetchFundamentals(tickers: string[]): Promise<BrapiFundamentals[]> {
  if (tickers.length === 0) return []
  const { data, error } = await supabase.functions.invoke('brapi-fundamentals', { body: { tickers } })
  if (error) throw error
  return (data as BrapiFundamentals[]) ?? []
}
