import type { AssetCategory } from '@/domain/investment'

const DY_ALVO_ACOES = 0.06
const DY_ALVO_FIIS = 0.09

export interface PrecoTetoResult {
  bazin?: number
  graham?: number
  teto: number
  metodo: string
}

export type PrecoTetoBadge = 'comprar' | 'neutro' | 'caro'

export function calcularPrecoTeto(
  category: AssetCategory,
  dividendoAnual?: number | null,
  lpa?: number | null,
  vpa?: number | null,
): PrecoTetoResult | null {
  if (category !== 'acoes' && category !== 'fiis') return null

  let bazin: number | undefined
  let graham: number | undefined

  if (dividendoAnual != null && dividendoAnual > 0) {
    const dyAlvo = category === 'fiis' ? DY_ALVO_FIIS : DY_ALVO_ACOES
    bazin = dividendoAnual / dyAlvo
  }

  if (category === 'acoes' && lpa != null && vpa != null && lpa > 0 && vpa > 0) {
    graham = Math.sqrt(22.5 * lpa * vpa)
  }

  if (bazin == null && graham == null) return null

  const candidates = [bazin, graham].filter((v): v is number => v != null)
  const teto = Math.min(...candidates)
  const metodo =
    bazin != null && graham != null ? 'Bazin + Graham' : bazin != null ? 'Bazin' : 'Graham'

  return { bazin, graham, teto, metodo }
}

export function classificarPrecoTeto(precoAtual: number, teto: number): PrecoTetoBadge {
  if (precoAtual < teto * 0.95) return 'comprar'
  if (precoAtual <= teto) return 'neutro'
  return 'caro'
}
