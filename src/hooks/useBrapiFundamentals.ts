import { useQuery } from '@tanstack/react-query'
import { fetchFundamentals, type BrapiFundamentals } from '@/services/brapi'

export function useBrapiFundamentals(tickers: string[]) {
  return useQuery<BrapiFundamentals[]>({
    queryKey: ['brapi_fundamentals', tickers.slice().sort().join(',')],
    queryFn: () => fetchFundamentals(tickers),
    enabled: tickers.length > 0,
    staleTime: 24 * 60 * 60 * 1000,
    retry: 1,
  })
}
