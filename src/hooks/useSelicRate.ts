import { useQuery } from '@tanstack/react-query'

export interface SelicData {
  annual: number
  monthly: number
}

async function fetchSelic(): Promise<SelicData> {
  const res = await fetch(
    'https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados/ultimos/1?formato=json'
  )
  if (!res.ok) throw new Error('selic fetch failed')
  const json = await res.json() as Array<{ data: string; valor: string }>
  const annual = parseFloat(json[0].valor)
  const monthly = (Math.pow(1 + annual / 100, 1 / 12) - 1) * 100
  return { annual, monthly }
}

export function useSelicRate() {
  return useQuery<SelicData>({
    queryKey: ['selic_rate'],
    queryFn: fetchSelic,
    staleTime: 24 * 60 * 60 * 1000,
    retry: 1,
  })
}
