/**
 * Dicionário e utilitários de cores de moda para a SH Boutique.
 * Mapeia nomes de cores em português para códigos hexadecimais elegantes
 * e provê funções de extração de nome e tom visual.
 */

export const FASHION_COLORS: Record<string, string> = {
  preto: '#18181b',
  preta: '#18181b',
  black: '#18181b',
  branco: '#ffffff',
  branca: '#ffffff',
  white: '#ffffff',
  'off white': '#f8f6f0',
  'off-white': '#f8f6f0',
  offwhite: '#f8f6f0',
  gelo: '#f0f2f5',
  bege: '#e8d8c8',
  areia: '#e2d4b7',
  nude: '#e3bc9a',
  caramelo: '#c68642',
  camel: '#c68642',
  marrom: '#5c3d2e',
  chocolate: '#4a2c20',
  café: '#382216',
  terracota: '#cc5a36',
  terra: '#b85333',
  vermelho: '#c92a2a',
  vermelha: '#c92a2a',
  red: '#c92a2a',
  vinho: '#6e1624',
  bordô: '#58111a',
  bordo: '#58111a',
  marsala: '#5b1e31',
  cereja: '#9f1239',
  rosa: '#f472b6',
  rose: '#fb7185',
  rosé: '#fb7185',
  pink: '#ec4899',
  fúcsia: '#d946ef',
  fucsia: '#d946ef',
  'rosa claro': '#fbcfe8',
  'rosa bebê': '#fce7f3',
  magenta: '#c026d3',
  azul: '#2563eb',
  'azul marinho': '#0f172a',
  marinho: '#0f172a',
  navy: '#0f172a',
  'azul claro': '#7dd3fc',
  'azul bebê': '#bae6fd',
  'azul céu': '#38bdf8',
  'azul petróleo': '#0e7490',
  petróleo: '#0e7490',
  'azul royal': '#1d4ed8',
  royal: '#1d4ed8',
  turquesa: '#06b6d4',
  verde: '#16a34a',
  'verde militar': '#4d5d3a',
  militar: '#4d5d3a',
  oliva: '#556b2f',
  'verde esmeralda': '#047857',
  esmeralda: '#047857',
  'verde menta': '#86efac',
  menta: '#86efac',
  'verde lima': '#a3e635',
  lima: '#a3e635',
  musgo: '#3f4f2c',
  amarelo: '#eab308',
  amarela: '#eab308',
  mostarda: '#d97706',
  dourado: '#c9a24a',
  dourada: '#c9a24a',
  gold: '#c9a24a',
  prata: '#d1d5db',
  prateado: '#d1d5db',
  silver: '#d1d5db',
  cinza: '#6b7280',
  mescla: '#9ca3af',
  chumbo: '#374151',
  grafite: '#27272a',
  laranja: '#ea580c',
  coral: '#fb923c',
  pêssego: '#fed7aa',
  lilás: '#c084fc',
  lilas: '#c084fc',
  lavanda: '#e9d5ff',
  roxo: '#7e22ce',
  violeta: '#8b5cf6',
}

/** Sugestões populares para seleção rápida no cadastro de produtos */
export const POPULAR_COLORS = [
  'Preto',
  'Branco',
  'Off White',
  'Bege',
  'Nude',
  'Caramelo',
  'Vermelho',
  'Vinho',
  'Marsala',
  'Terracota',
  'Azul Marinho',
  'Azul Royal',
  'Azul Claro',
  'Verde Militar',
  'Verde Esmeralda',
  'Rosa',
  'Pink',
  'Fúcsia',
  'Dourado',
  'Prata',
]

/**
 * Normaliza um texto para busca (remove acentos, pontuação e converte para minúsculas).
 */
export function normalizeColorString(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

/**
 * Extrai o nome legível da cor.
 * Suporta o formato composto "Nome|#hex" ou apenas "Nome".
 */
export function getColorName(raw: string): string {
  if (!raw) return ''
  const parts = raw.split('|')
  return parts[0].trim()
}

/**
 * Retorna o código hexadecimal da cor.
 * Se houver um hex customizado no formato "Nome|#hex", retorna esse hex.
 * Caso contrário, consulta o dicionário de cores de moda.
 * Se não encontrar, gera um tom consistente e elegante.
 */
export function getColorHex(raw: string): string {
  if (!raw) return '#c9a24a'
  const parts = raw.split('|')
  if (parts.length > 1 && /^#[0-9a-fA-F]{3,8}$/.test(parts[1].trim())) {
    return parts[1].trim()
  }

  const cleanName = normalizeColorString(parts[0])
  if (FASHION_COLORS[cleanName]) {
    return FASHION_COLORS[cleanName]
  }

  // Tenta encontrar palavras-chave (ex: "vestido azul escuro" -> "azul")
  for (const [key, hex] of Object.entries(FASHION_COLORS)) {
    if (cleanName.includes(key) || key.includes(cleanName)) {
      return hex
    }
  }

  // Fallback baseado em hash da string para gerar um tom discreto
  let hash = 0
  for (let i = 0; i < cleanName.length; i++) {
    hash = cleanName.charCodeAt(i) + ((hash << 5) - hash)
  }
  const hue = Math.abs(hash) % 360
  return `hsl(${hue}, 40%, 45%)`
}

/** Sugestões populares de tamanhos para roupas e calçados */
export const POPULAR_LETTER_SIZES = ['PP', 'P', 'M', 'MM', 'G', 'GG', 'XG', 'G1', 'G2', 'Único']
export const POPULAR_NUMERIC_SIZES = ['34', '36', '38', '40', '42', '44', '46', '48', '50']
export const POPULAR_FOOTWEAR_SIZES = ['33', '34', '35', '36', '37', '38', '39', '40']

/**
 * Extrai a lista de tamanhos específicos configurados para esta cor (se houver).
 * Suporta "Nome|#hex|M,G,GG" ou "Nome||M,G,GG".
 * Se não houver tamanhos específicos, retorna null (indicando que usa os tamanhos gerais da peça).
 */
export function getColorSizes(raw: string): string[] | null {
  if (!raw) return null
  const parts = raw.split('|')
  if (parts.length > 2 && parts[2].trim()) {
    const list = parts[2]
      .split(',')
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean)
    return list.length > 0 ? list : null
  }
  return null
}

/**
 * Retorna todos os tamanhos distintos existentes em um produto,
 * combinando os tamanhos gerais e os tamanhos específicos de cada cor,
 * ordenados harmoniosamente pelos padrões da moda.
 */
export function getAllProductSizes(
  generalSizes?: string[] | null,
  colors?: string[] | null,
): string[] {
  const set = new Set<string>()

  if (generalSizes) {
    for (const s of generalSizes) {
      if (s && s.trim()) set.add(s.trim().toUpperCase())
    }
  }

  if (colors) {
    for (const c of colors) {
      const cSizes = getColorSizes(c)
      if (cSizes) {
        for (const s of cSizes) {
          if (s && s.trim()) set.add(s.trim().toUpperCase())
        }
      }
    }
  }

  const all = Array.from(set)

  const standardOrder = [
    'PP',
    'P',
    'M',
    'MM',
    'G',
    'GG',
    'XG',
    'XXG',
    'G1',
    'G2',
    'G3',
    'G4',
    '32',
    '33',
    '34',
    '35',
    '36',
    '37',
    '38',
    '39',
    '40',
    '42',
    '44',
    '46',
    '48',
    '50',
    '52',
    '54',
    'ÚNICO',
    'UNICO',
    'U',
  ]

  return all.sort((a, b) => {
    const idxA = standardOrder.indexOf(a)
    const idxB = standardOrder.indexOf(b)
    if (idxA !== -1 && idxB !== -1) return idxA - idxB
    if (idxA !== -1) return -1
    if (idxB !== -1) return 1
    return a.localeCompare(b, undefined, { numeric: true })
  })
}

/**
 * Retorna a lista de tamanhos disponíveis para a cor atualmente selecionada.
 * Se a cor tem tamanhos específicos, retorna esses tamanhos.
 * Se a cor não tem tamanhos específicos (ou nenhuma cor selecionada), retorna os tamanhos gerais (ou todos os tamanhos da peça).
 */
export function getAvailableSizesForColor(
  colorRaw: string | null | undefined,
  allProductSizes: string[],
  generalSizes?: string[] | null,
): string[] {
  if (!colorRaw) {
    return generalSizes && generalSizes.length > 0 ? generalSizes : allProductSizes
  }
  const colorSizes = getColorSizes(colorRaw)
  if (colorSizes && colorSizes.length > 0) {
    return colorSizes
  }
  return generalSizes && generalSizes.length > 0 ? generalSizes : allProductSizes
}

/**
 * Formata um par nome/hex/tamanhos para armazenamento (ex: "Preto", "Azul Petróleo|#0e7490" ou "Preto|#18181b|M,MM,G,GG").
 */
export function formatColorEntry(
  name: string,
  customHex?: string,
  specificSizes?: string[] | null,
): string {
  const cleanName = name.trim()
  if (!cleanName) return ''

  const effectiveHex =
    customHex && customHex.startsWith('#') ? customHex : getColorHex(cleanName)

  const sizesStr =
    specificSizes && specificSizes.length > 0
      ? specificSizes
          .map((s) => s.trim().toUpperCase())
          .filter(Boolean)
          .join(',')
      : ''

  if (sizesStr) {
    return `${cleanName}|${effectiveHex}|${sizesStr}`
  }

  const defaultHex = getColorHex(cleanName)
  if (effectiveHex.toLowerCase() !== defaultHex.toLowerCase()) {
    return `${cleanName}|${effectiveHex}`
  }

  return cleanName
}

/**
 * Verifica se a cor é clara para aplicar contraste no anel e no ícone.
 */
export function isColorLight(hex: string): boolean {
  if (!hex.startsWith('#')) return false
  let c = hex.substring(1)
  if (c.length === 3) {
    c = c.split('').map((char) => char + char).join('')
  }
  if (c.length !== 6) return false
  const r = parseInt(c.substring(0, 2), 16)
  const g = parseInt(c.substring(2, 4), 16)
  const b = parseInt(c.substring(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.65
}
