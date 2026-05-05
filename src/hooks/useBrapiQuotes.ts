import { useQuery } from '@tanstack/react-query'
import { fetchQuotes, fetchCryptoQuotes, type BrapiQuote } from '@/services/brapi'

export function useBrapiQuotes(tickers: string[]) {
  return useQuery<BrapiQuote[]>({
    queryKey: ['brapi_quotes', tickers.slice().sort().join(',')],
    queryFn: () => fetchQuotes(tickers),
    enabled: tickers.length > 0,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })
}

export function useBrapiCryptoQuotes(coins: string[]) {
  return useQuery<BrapiQuote[]>({
    queryKey: ['brapi_crypto_quotes', coins.slice().sort().join(',')],
    queryFn: () => fetchCryptoQuotes(coins),
    enabled: coins.length > 0,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })
}
