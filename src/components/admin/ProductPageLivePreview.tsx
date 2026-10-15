import { useState } from 'react'
import {
  IconDeviceMobile,
  IconDeviceDesktop,
  IconRuler,
  IconCheck,
  IconShield,
  IconTruck,
  IconCart,
  IconWhatsApp,
  IconHanger,
  IconEye,
} from '../ui/Icons'
import { CATEGORIES } from '../../config/store'
import { getColorHex, getColorName, getColorSizes, isColorLight } from '../../lib/colors'
import { formatBRL, parseBRLToCents } from '../../lib/money'

export interface PreviewImage {
  id: string
  url: string
  is_primary: boolean
  color?: string | null
}

interface ProductPageLivePreviewProps {
  name: string
  description: string
  price: string // string like "159,90"
  promo?: string | null
  is_promo?: boolean
  category: string
  brand?: string | null
  material?: string | null
  gender?: string | null
  model_type?: string | null
  sizes: string[]
  colors: string[]
  images: PreviewImage[]
}

export function ProductPageLivePreview({
  name,
  description,
  price,
  promo,
  is_promo,
  category,
  brand,
  material,
  gender,
  model_type,
  sizes,
  colors,
  images,
}: ProductPageLivePreviewProps) {
  const [deviceMode, setDeviceMode] = useState<'mobile' | 'desktop'>('mobile')
  const [selectedSize, setSelectedSize] = useState<string | null>(sizes[0] ?? null)
  const [selectedColor, setSelectedColor] = useState<string | null>(colors[0] ?? null)
  const [manualImage, setManualImage] = useState<string | null>(null)
  const [qty, setQty] = useState(1)

  // Compute active image:
  // 1. If manual image was picked, use it
  // 2. If a color is selected and has a matching photo, use that
  // 3. Else use primary photo or first photo
  let activeUrl: string | null = manualImage

  if (!activeUrl && selectedColor) {
    const selColorName = getColorName(selectedColor).toLowerCase()
    const colorMatch = images.find(
      (img) => img.color && getColorName(img.color).toLowerCase() === selColorName,
    )
    if (colorMatch) {
      activeUrl = colorMatch.url
    }
  }

  if (!activeUrl) {
    const primary = images.find((i) => i.is_primary) ?? images[0]
    activeUrl = primary?.url ?? null
  }

  // Price formatting
  const priceCents = parseBRLToCents(price) ?? 0
  const promoCents = is_promo && promo ? parseBRLToCents(promo) : null
  const effectiveCents = promoCents != null ? promoCents : priceCents

  const categoryObj = CATEGORIES.find((c) => c.slug === category)
  const categoryLabel = categoryObj?.label ?? category

  const colorSizes = selectedColor ? getColorSizes(selectedColor) : null
  const activeSizes = colorSizes && colorSizes.length > 0 ? colorSizes : sizes

  function handleSelectColor(colorEntry: string) {
    setSelectedColor(colorEntry)
    const colorName = getColorName(colorEntry).toLowerCase()
    const match = images.find(
      (img) => img.color && getColorName(img.color).toLowerCase() === colorName,
    )
    if (match) {
      setManualImage(match.url)
    }

    const nextColorSizes = getColorSizes(colorEntry)
    const nextAvailable = nextColorSizes && nextColorSizes.length > 0 ? nextColorSizes : sizes
    if (selectedSize && !nextAvailable.includes(selectedSize)) {
      setSelectedSize(nextAvailable[0] ?? null)
    } else if (!selectedSize && nextAvailable.length > 0) {
      setSelectedSize(nextAvailable[0] ?? null)
    }
  }

  return (
    <div className="rounded border border-gold/40 bg-ink-2 shadow-xl overflow-hidden flex flex-col">
      {/* Top bar com Seletor de Dispositivo */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-ink px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-gold flex items-center gap-1.5">
            <IconEye className="w-4 h-4 text-gold" />
            Prévia da Página do Produto (Ao Vivo)
          </span>
        </div>

        <div className="flex items-center rounded border border-white/15 bg-ink-2 p-1">
          <button
            type="button"
            onClick={() => setDeviceMode('mobile')}
            className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs rounded transition font-medium ${
              deviceMode === 'mobile'
                ? 'bg-gold text-ink font-bold shadow-sm'
                : 'text-mute hover:text-paper'
            }`}
            title="Ver como os clientes verão no celular"
          >
            <IconDeviceMobile className="w-3.5 h-3.5" />
            <span>Celular</span>
          </button>
          <button
            type="button"
            onClick={() => setDeviceMode('desktop')}
            className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs rounded transition font-medium ${
              deviceMode === 'desktop'
                ? 'bg-gold text-ink font-bold shadow-sm'
                : 'text-mute hover:text-paper'
            }`}
            title="Ver como os clientes verão no computador"
          >
            <IconDeviceDesktop className="w-3.5 h-3.5" />
            <span>Computador</span>
          </button>
        </div>
      </div>

      {/* Frame de visualização da página */}
      <div
        className={`bg-ink p-4 sm:p-6 overflow-y-auto max-h-[850px] transition-all duration-300 ${
          deviceMode === 'mobile' ? 'max-w-md mx-auto my-4 rounded-xl border border-white/20 shadow-2xl' : 'w-full'
        }`}
      >
        {/* Barra superior simulada da loja */}
        <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-2 text-[10px] tracking-widest text-mute">
          <span className="uppercase font-semibold text-gold">BOUTIQUE SH</span>
          <span className="text-white/40">Modo Prévia</span>
        </div>

        {/* Layout do Produto */}
        <div
          className={`grid gap-6 ${
            deviceMode === 'desktop' ? 'md:grid-cols-2 md:gap-8 items-start' : 'grid-cols-1'
          }`}
        >
          {/* Coluna de Imagens */}
          <div className="space-y-3">
            {/* Foto Principal */}
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded bg-ink-2 border border-white/15 shadow-inner flex items-center justify-center">
              {activeUrl ? (
                <img
                  src={activeUrl}
                  alt={name || 'Produto'}
                  className="h-full w-full object-cover transition-opacity duration-200"
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-6 text-center text-mute space-y-2">
                  <IconHanger className="w-12 h-12 text-gold/40" />
                  <p className="text-xs font-medium text-paper">Aguardando fotos da peça</p>
                  <p className="text-[11px] text-mute max-w-xs">
                    Anexe fotos no formulário para visualizar aqui o resultado final com enquadramento real!
                  </p>
                </div>
              )}

              {/* Tag de Cor vinculada se houver */}
              {activeUrl && (
                <span className="absolute bottom-2 left-2 rounded bg-black/85 border border-gold/40 px-2 py-0.5 text-[9px] uppercase tracking-wider text-gold font-semibold backdrop-blur-xs">
                  {images.find((i) => i.url === activeUrl)?.color
                    ? `Cor: ${getColorName(images.find((i) => i.url === activeUrl)!.color!)}`
                    : 'Foto Principal'}
                </span>
              )}
            </div>

            {/* Miniaturas de outras fotos */}
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {images.map((img, idx) => {
                  const isActive = activeUrl === img.url
                  return (
                    <button
                      key={img.id || idx}
                      type="button"
                      onClick={() => setManualImage(img.url)}
                      className={`relative aspect-[3/4] overflow-hidden rounded border transition cursor-pointer ${
                        isActive
                          ? 'border-gold ring-1 ring-gold shadow-md'
                          : 'border-white/10 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img.url} alt="" className="h-full w-full object-cover" />
                      {img.color && (
                        <span
                          className="absolute bottom-1 right-1 h-2.5 w-2.5 rounded-full border border-white/40 shadow-sm"
                          style={{ backgroundColor: getColorHex(img.color) }}
                          title={`Cor: ${getColorName(img.color)}`}
                        />
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Coluna de Informações e Compra */}
          <div className="space-y-4">
            {/* Categoria e Marca */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] uppercase tracking-[0.25em] text-gold font-semibold">
                {categoryLabel}
              </span>
              {gender && (
                <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-paper font-semibold">
                  {gender}
                </span>
              )}
              {brand && (
                <span className="rounded border border-gold/40 bg-gold/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-gold font-semibold">
                  {brand}
                </span>
              )}
            </div>

            {/* Título do Produto */}
            <h1 className="font-display text-2xl sm:text-3xl text-paper leading-tight">
              {name || 'Nome do Produto'}
            </h1>

            {/* Preço */}
            <div className="flex flex-wrap items-baseline gap-2.5">
              {is_promo && promoCents != null && priceCents > promoCents && (
                <span className="text-sm text-mute line-through">{formatBRL(priceCents * qty)}</span>
              )}
              <span className="font-display text-2xl sm:text-3xl text-gold font-bold">
                {formatBRL(effectiveCents * qty)}
              </span>
              {is_promo && promoCents != null && (
                <span className="rounded bg-red-950/80 border border-red-500/40 px-2 py-0.5 text-[9px] uppercase tracking-wider text-red-200 font-bold">
                  Promoção
                </span>
              )}
            </div>

            {effectiveCents > 0 && (
              <p className="text-[11px] text-mute">
                ou até 3x de{' '}
                <strong className="text-paper">{formatBRL(Math.round(effectiveCents / 3))}</strong> sem juros
                no cartão
              </p>
            )}

            {/* Descrição */}
            {description ? (
              <p className="text-xs text-mute whitespace-pre-wrap leading-relaxed line-clamp-4">
                {description}
              </p>
            ) : (
              <p className="text-xs text-mute/50 italic">Sem descrição informada ainda.</p>
            )}

            {/* Ficha Técnica / Subcategorias */}
            {(brand || material || model_type || gender) && (
              <div className="rounded border border-white/10 bg-ink-2 p-3 text-xs space-y-1.5">
                <p className="text-[10px] uppercase tracking-[0.2em] text-gold font-semibold">
                  Detalhes da Peça
                </p>
                <div className="grid grid-cols-2 gap-2 text-mute text-[11px]">
                  {brand && (
                    <p>
                      <strong className="text-paper">Marca:</strong> {brand}
                    </p>
                  )}
                  {material && (
                    <p>
                      <strong className="text-paper">Tecido:</strong> {material}
                    </p>
                  )}
                  {gender && (
                    <p>
                      <strong className="text-paper">Linha:</strong> {gender}
                    </p>
                  )}
                  {model_type && (
                    <p>
                      <strong className="text-paper">Modelo:</strong> {model_type}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Seletor de Tamanhos */}
            {activeSizes.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase tracking-[0.2em] text-paper font-semibold">
                    Tamanho{' '}
                    {colorSizes && colorSizes.length > 0 && (
                      <span className="text-gold font-normal lowercase text-[10px]">
                        (para a cor {getColorName(selectedColor!)})
                      </span>
                    )}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] text-gold">
                    <IconRuler className="w-3 h-3" />
                    Tabela de Medidas
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {activeSizes.map((s) => {
                    const isSelected = (selectedSize || activeSizes[0]) === s
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSelectedSize(s)}
                        className={`min-h-10 min-w-10 rounded border px-3 text-xs font-semibold uppercase tracking-wider transition cursor-pointer ${
                          isSelected
                            ? 'border-gold bg-gold text-ink shadow-sm'
                            : 'border-white/20 text-paper hover:border-gold/50'
                        }`}
                      >
                        {s}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Seletor de Cores */}
            {colors.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase tracking-[0.2em] text-paper font-semibold">
                    Cor:{' '}
                    <span className="text-gold font-bold ml-1">
                      {selectedColor ? getColorName(selectedColor) : getColorName(colors[0])}
                    </span>
                  </span>
                  <span className="text-[10px] text-mute">Toque para selecionar</span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {colors.map((c) => {
                    const colorName = getColorName(c)
                    const hex = getColorHex(c)
                    const optionSizes = getColorSizes(c)
                    const isSelected =
                      (selectedColor ? getColorName(selectedColor).toLowerCase() : '') ===
                      colorName.toLowerCase()
                    const isLight = isColorLight(hex)

                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => handleSelectColor(c)}
                        className={`group flex items-center gap-2 rounded-full p-1.5 transition cursor-pointer ${
                          isSelected
                            ? 'ring-2 ring-gold bg-gold/15 pr-3 shadow-sm'
                            : 'border border-white/15 bg-ink-2 hover:border-gold/50 pr-2.5'
                        }`}
                      >
                        <span
                          className={`flex h-6 w-6 items-center justify-center rounded-full ${
                            isLight ? 'border border-black/30' : 'border border-white/20'
                          }`}
                          style={{ backgroundColor: hex }}
                        >
                          {isSelected && (
                            <IconCheck
                              className={`w-3 h-3 ${isLight ? 'text-black' : 'text-white'}`}
                            />
                          )}
                        </span>
                        <div className="flex flex-col text-left">
                          <span
                            className={`text-[11px] font-semibold uppercase tracking-wider ${
                              isSelected ? 'text-gold' : 'text-paper'
                            }`}
                          >
                            {colorName}
                          </span>
                          {optionSizes && (
                            <span className="text-[9px] text-mute font-mono">
                              {optionSizes.join(', ')}
                            </span>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Quantidade */}
            <div className="flex items-center gap-3 pt-1">
              <span className="text-[11px] uppercase tracking-[0.2em] text-paper font-semibold">
                Qtd:
              </span>
              <div className="flex rounded border border-white/20 bg-ink-2">
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="min-h-9 min-w-9 text-paper hover:text-gold transition font-bold"
                >
                  −
                </button>
                <span className="w-10 flex items-center justify-center text-xs font-semibold text-paper">
                  {qty}
                </span>
                <button
                  type="button"
                  onClick={() => setQty((q) => q + 1)}
                  className="min-h-9 min-w-9 text-paper hover:text-gold transition font-bold"
                >
                  +
                </button>
              </div>
            </div>

            {/* Botões de Ação da Loja */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                className="w-full min-h-12 rounded bg-gold px-4 text-xs font-bold uppercase tracking-[0.2em] text-ink hover:bg-gold-light transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <IconCart className="w-4 h-4" />
                Adicionar à Sacola
              </button>

              <button
                type="button"
                className="w-full min-h-11 rounded border border-gold/60 bg-gold/10 px-4 text-xs font-bold uppercase tracking-[0.18em] text-gold hover:bg-gold hover:text-ink transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <IconWhatsApp className="w-4 h-4" />
                Comprar pelo WhatsApp
              </button>
            </div>

            {/* Selos de Confiança Boutique SH */}
            <div className="border-t border-white/10 pt-3 grid grid-cols-2 gap-2 text-[10px] text-mute">
              <div className="flex items-center gap-2">
                <IconTruck className="w-3.5 h-3.5 text-gold shrink-0" />
                <span>Envio para todo Brasil</span>
              </div>
              <div className="flex items-center gap-2">
                <IconShield className="w-3.5 h-3.5 text-gold shrink-0" />
                <span>Compra 100% Segura</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
