import { useState } from 'react'
import { IconSparkles, IconCheck, IconInfo } from '../ui/Icons'
import { PRODUCT_CATEGORIES } from '../../config/store'
import { formatColorEntry, getColorHex } from '../../lib/colors'

export interface ParsedProductData {
  name?: string
  brand?: string
  sizes?: string[]
  colors?: string[] // formatColorEntry string
  price?: string
  promoPrice?: string
  category?: string
  description?: string
  material?: string
  gender?: string
  model_type?: string
  stock?: number
}

interface QuickProductTextImportProps {
  onApply: (data: ParsedProductData) => void
  disabled?: boolean
}

const SAMPLE_TEXT = `Nome: calça jeans Reta
Marca: M.OFFICER
Tamanho: 40
Cor: preto
valor: 159,90
Tipo: Calça`

export function parseProductText(rawText: string): ParsedProductData {
  const result: ParsedProductData = {}
  if (!rawText.trim()) return result

  const lines = rawText.split('\n')

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    // Detect separator: colon (:) or equal (=) or dash (-)
    const separatorMatch = trimmed.match(/^([^:=]+)[:=]\s*(.*)$/)
    if (!separatorMatch) continue

    const key = separatorMatch[1].trim().toLowerCase()
    const value = separatorMatch[2].trim()
    if (!value) continue

    // 1. Nome do produto
    if (
      key === 'nome' ||
      key === 'produto' ||
      key === 'título' ||
      key === 'titulo' ||
      key === 'peça' ||
      key === 'peca'
    ) {
      result.name = value
      continue
    }

    // 2. Marca / Grife
    if (key === 'marca' || key === 'grife') {
      result.brand = value
      continue
    }

    // 3. Tamanho / Tamanhos
    if (key === 'tamanho' || key === 'tamanhos' || key === 'tam' || key === 'tams') {
      // Split by comma, slash, semicolon or spaces if standard
      const rawTokens = value.split(/[,;/]+/)
      const parsedSizes: string[] = []
      for (const token of rawTokens) {
        const cleaned = token.trim()
        if (cleaned) {
          // If user typed "38 40 42" or "P M G"
          if (/\s+/.test(cleaned) && !/único|tamanho/i.test(cleaned)) {
            cleaned.split(/\s+/).forEach((sub) => {
              if (sub.trim()) parsedSizes.push(sub.trim().toUpperCase())
            })
          } else {
            parsedSizes.push(cleaned.toUpperCase())
          }
        }
      }
      if (parsedSizes.length > 0) {
        result.sizes = Array.from(new Set(parsedSizes))
      }
      continue
    }

    // 4. Cor / Cores
    if (key === 'cor' || key === 'cores') {
      // Split by comma, slash, semicolon, or " e "
      const rawTokens = value.split(/[,;/]+|\s+e\s+/i)
      const parsedColors: string[] = []
      for (const token of rawTokens) {
        const cleaned = token.trim()
        if (!cleaned) continue
        // Capitalize first letter of each word (e.g. "off white" -> "Off White")
        const formattedName = cleaned
          .split(' ')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(' ')
        const hex = getColorHex(formattedName)
        parsedColors.push(formatColorEntry(formattedName, hex))
      }
      if (parsedColors.length > 0) {
        result.colors = Array.from(new Set(parsedColors))
      }
      continue
    }

    // 5. Preço / Valor
    if (
      key === 'valor' ||
      key === 'preço' ||
      key === 'preco' ||
      key === 'r$' ||
      key === 'preco normal'
    ) {
      // Clean R$, spaces, normalize to 159,90 format
      const cleanedNum = value.replace(/[^\d.,]/g, '').trim()
      if (cleanedNum) {
        // If it's something like "159.90", convert to "159,90"
        if (cleanedNum.includes('.') && !cleanedNum.includes(',')) {
          result.price = cleanedNum.replace('.', ',')
        } else {
          result.price = cleanedNum
        }
      }
      continue
    }

    // 6. Preço Promocional
    if (
      key === 'promo' ||
      key === 'promoção' ||
      key === 'promocao' ||
      key === 'preço promo' ||
      key === 'preco promo' ||
      key === 'valor promo'
    ) {
      const cleanedNum = value.replace(/[^\d.,]/g, '').trim()
      if (cleanedNum) {
        if (cleanedNum.includes('.') && !cleanedNum.includes(',')) {
          result.promoPrice = cleanedNum.replace('.', ',')
        } else {
          result.promoPrice = cleanedNum
        }
      }
      continue
    }

    // 7. Tipo / Categoria
    if (key === 'tipo' || key === 'categoria' || key === 'seção' || key === 'secao') {
      const valLower = value.toLowerCase()
      // Map to PRODUCT_CATEGORIES slugs
      if (/cal[çc]a|jeans|legging|pantacourt|pantalona/i.test(valLower)) {
        result.category = 'calcas'
      } else if (/camisa|polo|camisete/i.test(valLower)) {
        result.category = 'camisas'
      } else if (/vestido|chemise|tubinho|longo/i.test(valLower)) {
        result.category = 'vestidos'
      } else if (/bermuda|short/i.test(valLower)) {
        result.category = 'bermudas'
      } else if (/blazer|terno|casaqueto|jaqueta|casaco/i.test(valLower)) {
        result.category = 'blazers'
      } else if (/blusa|cropped|regata|top|t-shirt|camiseta/i.test(valLower)) {
        result.category = 'blusas'
      } else if (/cal[çc]ado|sapato|sand[aá]lia|rasteira|rasteirinha|t[eê]nis|salto|scarpin|mule|bota/i.test(valLower)) {
        result.category = 'calcados'
      } else if (/acess[oó]rio|bolsa|rel[oó]gio|pulseira|cinto|[oó]culos|colar|brinco/i.test(valLower)) {
        result.category = 'acessorios'
      } else {
        // Direct slug match fallback
        const direct = PRODUCT_CATEGORIES.find((c) => c.slug === valLower || c.label.toLowerCase() === valLower)
        if (direct) result.category = direct.slug
      }
      continue
    }

    // 8. Descrição
    if (key === 'descrição' || key === 'descricao' || key === 'detalhes' || key === 'obs') {
      result.description = value
      continue
    }

    // 9. Tecido / Material
    if (key === 'tecido' || key === 'material' || key === 'composição' || key === 'composicao') {
      result.material = value
      continue
    }

    // 10. Sexo / Gênero
    if (key === 'sexo' || key === 'gênero' || key === 'genero' || key === 'linha') {
      const gLower = value.toLowerCase()
      if (/fem/i.test(gLower)) result.gender = 'Feminino'
      else if (/masc/i.test(gLower)) result.gender = 'Masculino'
      else if (/uni/i.test(gLower)) result.gender = 'Unissex'
      else result.gender = value
      continue
    }

    // 11. Modelo / Corte
    if (key === 'modelo' || key === 'corte') {
      result.model_type = value
      continue
    }

    // 12. Estoque
    if (key === 'estoque' || key === 'qtd' || key === 'quantidade') {
      const num = parseInt(value.replace(/\D/g, ''), 10)
      if (!isNaN(num)) result.stock = num
      continue
    }
  }

  return result
}

export function QuickProductTextImport({ onApply, disabled }: QuickProductTextImportProps) {
  const [text, setText] = useState('')
  const [isOpen, setIsOpen] = useState(true)
  const [appliedFeedback, setAppliedFeedback] = useState<string | null>(null)

  const parsed = parseProductText(text)
  const identifiedCount = Object.keys(parsed).length

  function handleProcessAndApply() {
    if (identifiedCount === 0) return
    onApply(parsed)
    setAppliedFeedback(
      `✓ ${identifiedCount} campo(s) identificado(s) e preenchidos no formulário! Role para baixo para anexar as fotos e conferir a prévia.`,
    )
    setTimeout(() => setAppliedFeedback(null), 8000)
  }

  function handleLoadSample() {
    setText(SAMPLE_TEXT)
    const sampleParsed = parseProductText(SAMPLE_TEXT)
    onApply(sampleParsed)
    setAppliedFeedback('✓ Exemplo carregado e aplicado no formulário com sucesso!')
    setTimeout(() => setAppliedFeedback(null), 8000)
  }

  function handleClear() {
    setText('')
    setAppliedFeedback(null)
  }

  return (
    <div className="rounded border border-gold/40 bg-ink-2 shadow-md overflow-hidden">
      {/* Cabeçalho do Card */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-gold/10 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gold text-ink font-bold shadow-sm">
            <IconSparkles className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-gold">
              Cadastro Rápido Facilitado por Texto
            </h2>
            <p className="text-[11px] text-mute">
              Cole os dados da peça e o sistema preenche o formulário e a prévia automaticamente.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleLoadSample}
            disabled={disabled}
            className="rounded border border-gold/50 bg-gold/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-gold hover:bg-gold hover:text-ink transition cursor-pointer"
            title="Carregar exemplo: Calça Jeans M.OFFICER"
          >
            📋 Carregar Exemplo
          </button>
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            className="text-xs text-mute hover:text-paper transition px-2 py-1"
          >
            {isOpen ? 'Ocultar ▲' : 'Expandir ▼'}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="p-4 space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="quickText" className="text-[11px] uppercase tracking-wider text-paper font-semibold">
                Cole o texto com as informações da peça:
              </label>
              <span className="text-[10px] text-mute">
                Reconhece: Nome, Marca, Tamanho, Cor, Valor, Tipo/Categoria, Tecido, Sexo, etc.
              </span>
            </div>
            <textarea
              id="quickText"
              rows={6}
              value={text}
              onChange={(e) => {
                setText(e.target.value)
                setAppliedFeedback(null)
              }}
              disabled={disabled}
              placeholder={`Exemplo:\nNome: calça jeans Reta\nMarca: M.OFFICER\nTamanho: 40\nCor: preto\nvalor: 159,90\nTipo: Calça`}
              className="w-full rounded border border-white/20 bg-ink px-3 py-2.5 font-mono text-xs text-paper placeholder-white/30 focus:border-gold focus:outline-none leading-relaxed"
            />
          </div>

          {/* Resumo do que foi reconhecido em tempo real */}
          {identifiedCount > 0 && (
            <div className="rounded border border-gold/30 bg-ink p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-gold font-bold flex items-center gap-1.5">
                  <IconCheck className="w-3.5 h-3.5 text-gold" />
                  {identifiedCount} campo(s) identificado(s) no texto:
                </span>
                <span className="text-[10px] text-mute">Pronto para aplicar</span>
              </div>

              <div className="flex flex-wrap gap-1.5 text-xs">
                {parsed.name && (
                  <span className="inline-flex items-center gap-1 rounded bg-white/10 px-2 py-0.5 text-[11px] text-paper">
                    <strong className="text-gold">Nome:</strong> {parsed.name}
                  </span>
                )}
                {parsed.brand && (
                  <span className="inline-flex items-center gap-1 rounded bg-white/10 px-2 py-0.5 text-[11px] text-paper">
                    <strong className="text-gold">Marca:</strong> {parsed.brand}
                  </span>
                )}
                {parsed.sizes && parsed.sizes.length > 0 && (
                  <span className="inline-flex items-center gap-1 rounded bg-white/10 px-2 py-0.5 text-[11px] text-paper">
                    <strong className="text-gold">Tamanho:</strong> {parsed.sizes.join(', ')}
                  </span>
                )}
                {parsed.colors && parsed.colors.length > 0 && (
                  <span className="inline-flex items-center gap-1 rounded bg-white/10 px-2 py-0.5 text-[11px] text-paper">
                    <strong className="text-gold">Cor:</strong> {parsed.colors.map((c) => c.split('|')[0]).join(', ')}
                  </span>
                )}
                {parsed.price && (
                  <span className="inline-flex items-center gap-1 rounded bg-white/10 px-2 py-0.5 text-[11px] text-paper">
                    <strong className="text-gold">Valor:</strong> R$ {parsed.price}
                  </span>
                )}
                {parsed.category && (
                  <span className="inline-flex items-center gap-1 rounded bg-white/10 px-2 py-0.5 text-[11px] text-paper">
                    <strong className="text-gold">Tipo:</strong>{' '}
                    {PRODUCT_CATEGORIES.find((c) => c.slug === parsed.category)?.label ?? parsed.category}
                  </span>
                )}
                {parsed.material && (
                  <span className="inline-flex items-center gap-1 rounded bg-white/10 px-2 py-0.5 text-[11px] text-paper">
                    <strong className="text-gold">Tecido:</strong> {parsed.material}
                  </span>
                )}
                {parsed.gender && (
                  <span className="inline-flex items-center gap-1 rounded bg-white/10 px-2 py-0.5 text-[11px] text-paper">
                    <strong className="text-gold">Sexo:</strong> {parsed.gender}
                  </span>
                )}
                {parsed.promoPrice && (
                  <span className="inline-flex items-center gap-1 rounded bg-white/10 px-2 py-0.5 text-[11px] text-paper">
                    <strong className="text-gold">Promoção:</strong> R$ {parsed.promoPrice}
                  </span>
                )}
              </div>
            </div>
          )}

          {appliedFeedback && (
            <div className="rounded border border-green-500/40 bg-green-950/40 p-2.5 text-xs text-green-300 font-medium flex items-center gap-2">
              <IconCheck className="w-4 h-4 text-green-400 shrink-0" />
              <span>{appliedFeedback}</span>
            </div>
          )}

          {/* Botões de Ação */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleProcessAndApply}
                disabled={disabled || identifiedCount === 0}
                className="inline-flex items-center gap-1.5 rounded bg-gold px-4 py-2 text-xs font-bold uppercase tracking-wider text-ink hover:bg-gold-light transition disabled:opacity-40 cursor-pointer shadow-sm"
              >
                <IconSparkles className="w-3.5 h-3.5" />
                Identificar & Preencher Campos
              </button>
              {text && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="rounded border border-white/20 px-3 py-2 text-xs text-mute hover:text-paper transition"
                >
                  Limpar
                </button>
              )}
            </div>

            <p className="text-[11px] text-mute flex items-center gap-1">
              <IconInfo className="w-3 h-3 text-gold" />
              Você também pode editar qualquer campo manualmente no formulário.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
