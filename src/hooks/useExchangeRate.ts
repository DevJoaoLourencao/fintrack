import { useQuery } from '@tanstack/react-query'

interface AwesomeApiResponse {
  USDBRL: {
    bid: string
  }
}

async function fetchUsdBrlRate(): Promise<number> {
  const response = await fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL')
  if (!response.ok) throw new Error('Falha ao buscar cotação do dólar')
  const data: AwesomeApiResponse = await response.json()
  return parseFloat(data.USDBRL.bid)
}

export function useExchangeRate() {
  return useQuery({
    queryKey: ['exchange-rate', 'USD-BRL'],
    queryFn: fetchUsdBrlRate,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
  })
}
