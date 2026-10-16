import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CATEGORIES } from '../config/store'
import { useCart } from '../context/CartContext'
import { effectivePriceCents, formatBRL } from '../lib/money'
import { fetchPublishedProductBySlug, primaryImage } from '../lib/products'
import type { Product } from '../types/product'
import {
  IconCart,
  IconRuler,
  IconShield,
  IconTruck,
  IconTag,
  IconPercent,
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
} from '../components/ui/Icons'
import { SizeGuideModal } from '../components/product/SizeGuideModal'
import { calculateCouponDiscount, fetchActiveCoupon } from '../lib/coupons'
import {
  getColorHex,
  getColorName,
  getColorSizes,
  isColorLight,
  getAllProductSizes,
  getAvailableSizesForColor,
} from '../lib/colors'

export function ProductPage() {
  const { slug = '' } = useParams()
  const navigate = useNavigate()
  const { addItem, appliedCoupon, applyCoupon } = useCart()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [size, setSize] = useState<string | null>(null)
  const [color, setColor] = useState<string | null>(null)
  const [qty, setQty] = useState(1)
  const [message, setMessage] = useState<string | null>(null)
  const [activeImage, setActiveImage] = useState<string | null>(null)
  const [imageLoading, setImageLoading] = useState(false)
  const [showSizeModal, setShowSizeModal] = useState(false)

  // Pré-carrega todas as fotos do produto no cache do navegador para troca instantânea
  useEffect(() => {
    if (!product?.images || product.images.length === 0) return
    product.images.forEach((img) => {
      const p = new Image()
      p.src = img.public_url
      if (p.decode) p.decode().catch(() => {})
    })
  }, [product?.images])

  function changeActiveImage(newUrl: string) {
    if (newUrl === activeImage) return
    setImageLoading(true)
    setActiveImage(newUrl)
  }

  // Cupom de Desconto na página do produto
  const [couponInput, setCouponInput] = useState('')
  const [couponChecking, setCouponChecking] = useState(false)
  const [couponError, setCouponError] = useState<string | null>(null)

  // Revalida se o cupom salvo na memória ainda está ativo e dentro das regras
  useEffect(() => {
    if (appliedCoupon) {
      fetchActiveCoupon(appliedCoupon.code).then((valid) => {
        if (!valid) {
          applyCoupon(null)
          setCouponError('O cupom aplicado foi desativado ou expirou.')
        }
      })
    }
  }, [appliedCoupon, applyCoupon])

  useEffect(() => {
    let active = true
    setLoading(true)
    fetchPublishedProductBySlug(slug)
      .then((data) => {
        if (!active) return
        if (data) {
          setProduct(data)
          const firstColor = data.colors[0] ?? null
          setColor(firstColor)
          const allSizes = getAllProductSizes(data.sizes, data.colors)
          const available = getAvailableSizesForColor(firstColor, allSizes, data.sizes)
          setSize(available[0] ?? null)
          if (firstColor) {
            const firstColorName = getColorName(firstColor)
            const matchedImg = data.images.find(
              (img) => img.color && getColorName(img.color).toLowerCase() === firstColorName.toLowerCase(),
            )
            setActiveImage(matchedImg?.public_url ?? primaryImage(data)?.public_url ?? null)
          } else {
            setActiveImage(primaryImage(data)?.public_url ?? null)
          }
        }
      })
      .catch(() => {
        if (active) setError('Não foi possível carregar este produto.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [slug])

  if (loading) return <p className="px-4 py-16 text-center text-mute">Carregando peça…</p>
  if (error) return <p className="px-4 py-16 text-center text-gold">{error}</p>
  if (!product) return <p className="px-4 py-16 text-center text-mute">Produto não encontrado ou não publicado.</p>

  const unitPrice = effectivePriceCents(product)
  const basePriceCents = (unitPrice ?? 0) * qty
  const couponDiscountCalc = appliedCoupon
    ? calculateCouponDiscount(appliedCoupon, basePriceCents)
    : { discountCents: 0, error: null }
  const singleDiscountCents = couponDiscountCalc.discountCents
  const finalPriceCents = Math.max(0, basePriceCents - singleDiscountCents)
  const categoryObj = CATEGORIES.find((c) => c.slug === product.category)
  const categoryLabel = categoryObj?.label ?? product.category
  const main = activeImage

  const allProductSizes = product ? getAllProductSizes(product.sizes, product.colors) : []
  const availableSizesForColor = product
    ? getAvailableSizesForColor(color, allProductSizes, product.sizes)
    : []
  const hasUnavailableSizes = allProductSizes.some((s) => !availableSizesForColor.includes(s))

  async function handleApplyCoupon(e?: React.FormEvent) {
    if (e) e.preventDefault()
    setCouponError(null)
    const code = couponInput.trim().toUpperCase()
    if (!code) {
      setCouponError('Por favor, informe o código do cupom.')
      return
    }
    setCouponChecking(true)
    try {
      const found = await fetchActiveCoupon(code)
      if (!found) {
        setCouponError('Cupom inválido ou não encontrado.')
        return
      }
      const check = calculateCouponDiscount(found, basePriceCents)
      if (check.error) {
        setCouponError(check.error)
        return
      }
      applyCoupon(found)
      setCouponInput('')
    } catch {
      setCouponError('Não foi possível validar o cupom. Tente novamente.')
    } finally {
      setCouponChecking(false)
    }
  }

  function validateSelection(): boolean {
    setMessage(null)
    if (product!.colors.length > 0 && !color) {
      setMessage('Por favor, selecione uma cor antes de continuar.')
      return false
    }
    const currentAvailable = getAvailableSizesForColor(color, allProductSizes, product?.sizes)
    if (currentAvailable.length > 0) {
      if (!size) {
        setMessage('Por favor, selecione um tamanho antes de continuar.')
        return false
      }
      if (!currentAvailable.includes(size)) {
        setMessage(
          `O tamanho ${size} não está disponível na cor selecionada. Por favor, escolha um dos tamanhos disponíveis.`,
        )
        return false
      }
    }
    if (!Number.isInteger(qty) || qty < 1) {
      setMessage('Informe uma quantidade válida.')
      return false
    }
    if (product!.track_stock && (product!.stock ?? 0) < qty) {
      setMessage('Quantidade indisponível no estoque atual.')
      return false
    }
    return true
  }

  function handleSelectColor(colorOption: string) {
    setColor(colorOption)
    const colorName = getColorName(colorOption)
    // Se houver uma foto cadastrada especificamente para esta cor, muda a foto principal imediatamente
    const matchedImg = product?.images.find(
      (img) => img.color && getColorName(img.color).toLowerCase() === colorName.toLowerCase(),
    )
    if (matchedImg) {
      changeActiveImage(matchedImg.public_url)
    }

    // Atualiza os tamanhos dinamicamente conforme a cor selecionada
    const allSizes = getAllProductSizes(product?.sizes, product?.colors)
    const nextAvailable = getAvailableSizesForColor(colorOption, allSizes, product?.sizes)
    if (size && !nextAvailable.includes(size)) {
      setSize(nextAvailable[0] ?? null)
    } else if (!size && nextAvailable.length > 0) {
      setSize(nextAvailable[0] ?? null)
    }
  }

  function addToCart() {
    if (!validateSelection()) return
    addItem({
      productId: product!.id,
      size: allProductSizes.length > 0 ? size : null,
      color: product!.colors.length > 0 ? (color ? getColorName(color) : null) : null,
      quantity: qty,
    })
    setMessage('Peça adicionada à sacola!')
    setTimeout(() => setMessage(null), 3500)
  }

  function buyNow() {
    if (!validateSelection()) return
    addItem({
      productId: product!.id,
      size: allProductSizes.length > 0 ? size : null,
      color: product!.colors.length > 0 ? (color ? getColorName(color) : null) : null,
      quantity: qty,
    })
    navigate('/carrinho')
  }

  const currentImageIndex = Math.max(
    0,
    product.images.findIndex((img) => img.public_url === activeImage),
  )

  function handlePrevImage(e?: React.MouseEvent) {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    if (!product || product.images.length <= 1) return
    const prevIndex =
      currentImageIndex <= 0 ? product.images.length - 1 : currentImageIndex - 1
    const nextImg = product.images[prevIndex]
    if (nextImg) {
      changeActiveImage(nextImg.public_url)
      if (nextImg.color) {
        const matched = product.colors.find(
          (c) => getColorName(c).toLowerCase() === getColorName(nextImg.color!).toLowerCase(),
        )
        if (matched) handleSelectColor(matched)
      }
    }
  }

  function handleNextImage(e?: React.MouseEvent) {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    if (!product || product.images.length <= 1) return
    const nextIndex =
      currentImageIndex >= product.images.length - 1 ? 0 : currentImageIndex + 1
    const nextImg = product.images[nextIndex]
    if (nextImg) {
      changeActiveImage(nextImg.public_url)
      if (nextImg.color) {
        const matched = product.colors.find(
          (c) => getColorName(c).toLowerCase() === getColorName(nextImg.color!).toLowerCase(),
        )
        if (matched) handleSelectColor(matched)
      }
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:py-12 pb-24 md:pb-12">
      <div className="grid gap-10 md:grid-cols-2">
        {/* Galeria de Fotos */}
        <div>
          <div className="relative aspect-[3/4] overflow-hidden rounded border border-white/10 bg-ink-2 select-none group flex items-center justify-center">
            {main ? (
              <img
                key={main}
                src={main}
                alt={product.name}
                loading="eager"
                decoding="async"
                onLoad={() => setImageLoading(false)}
                onError={() => setImageLoading(false)}
                className={`h-full w-full object-cover transition-all duration-300 ${
                  imageLoading ? 'opacity-35 blur-xs scale-[1.01]' : 'opacity-100 blur-0 scale-100'
                }`}
              />
            ) : (
              <div className="flex h-full items-center justify-center font-display text-5xl tracking-[0.3em] text-gold/50">
                SH
              </div>
            )}

            {/* Indicador de Carregamento da Foto */}
            {imageLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-xs z-20 pointer-events-none transition-opacity animate-fadeIn">
                <div className="relative flex items-center justify-center">
                  <div className="h-10 w-10 animate-spin rounded-full border-2 border-gold/30 border-t-gold" />
                  <span className="absolute font-display text-xs text-gold font-bold">SH</span>
                </div>
                <span className="mt-2.5 text-[10px] uppercase tracking-[0.25em] text-gold font-semibold drop-shadow">
                  Carregando foto…
                </span>
              </div>
            )}

            {/* Setas de Navegação entre Fotos */}
            {product.images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrevImage}
                  aria-label="Foto anterior"
                  title="Foto anterior"
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-black/65 border border-gold/50 text-gold shadow-lg backdrop-blur-md transition hover:scale-110 hover:bg-black/90 hover:border-gold active:scale-95 cursor-pointer z-10"
                >
                  <IconChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>

                <button
                  type="button"
                  onClick={handleNextImage}
                  aria-label="Próxima foto"
                  title="Próxima foto"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-black/65 border border-gold/50 text-gold shadow-lg backdrop-blur-md transition hover:scale-110 hover:bg-black/90 hover:border-gold active:scale-95 cursor-pointer z-10"
                >
                  <IconChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>

                {/* Indicador de foto (ex: 2 / 4) */}
                <div className="absolute bottom-3 right-3 rounded-full bg-black/75 border border-white/20 px-2.5 py-0.5 text-[11px] font-mono text-paper backdrop-blur-xs select-none shadow-sm pointer-events-none">
                  {currentImageIndex + 1} / {product.images.length}
                </div>
              </>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="mt-3 grid grid-cols-4 gap-2">
              {product.images.map((img) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => {
                    changeActiveImage(img.public_url)
                    if (img.color) {
                      const matched = product.colors.find(
                        (c) => getColorName(c).toLowerCase() === getColorName(img.color!).toLowerCase(),
                      )
                      if (matched) setColor(matched)
                    }
                  }}
                  className={`relative aspect-square overflow-hidden rounded border transition ${
                    activeImage === img.public_url
                      ? 'border-gold shadow-md shadow-gold/20'
                      : 'border-white/10 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img.public_url} alt="" className="h-full w-full object-cover" />
                  {img.color && (
                    <span
                      className="absolute bottom-1 right-1 h-3.5 w-3.5 rounded-full border border-white/40 shadow-sm"
                      style={{ backgroundColor: getColorHex(img.color) }}
                      title={`Foto da cor: ${getColorName(img.color)}`}
                    />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Informações da Peça */}
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-[0.28em] text-gold font-medium">{categoryLabel}</span>
            {product.gender && (
              <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-paper font-semibold">
                {product.gender}
              </span>
            )}
            {product.brand && (
              <span className="rounded border border-gold/40 px-2 py-0.5 text-[10px] uppercase tracking-wider text-gold font-semibold">
                {product.brand}
              </span>
            )}
          </div>

          <h1 className="mt-3 font-display text-3xl sm:text-4xl text-paper">{product.name}</h1>

          {product.is_example && (
            <p className="mt-3 border border-gold/40 bg-gold/10 px-3 py-2 text-xs text-gold">
              Peça de demonstração da boutique.
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-baseline gap-3">
            {product.is_promo && product.promo_price_cents != null && !appliedCoupon && (
              <span className="text-base text-mute line-through">{formatBRL(product.price_cents * qty)}</span>
            )}
            {appliedCoupon && singleDiscountCents > 0 && (
              <span className="text-base text-mute line-through">{formatBRL(basePriceCents)}</span>
            )}
            <span className="text-2xl sm:text-3xl font-display text-gold">
              {formatBRL(appliedCoupon && singleDiscountCents > 0 ? finalPriceCents : basePriceCents)}
            </span>
            {product.is_promo && (!appliedCoupon || singleDiscountCents === 0) && (
              <span className="rounded bg-red-950/80 border border-red-500/40 px-2 py-0.5 text-[10px] uppercase tracking-wider text-red-200 font-bold">
                Promoção
              </span>
            )}
            {appliedCoupon && singleDiscountCents > 0 && (
              <span className="rounded bg-gold/15 border border-gold/40 px-2 py-0.5 text-[10px] uppercase tracking-wider text-gold font-bold">
                Cupom {appliedCoupon.code} aplicado
              </span>
            )}
          </div>

          <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-mute">{product.description}</p>

          {/* Ficha Técnica / Subcategorias */}
          {(product.brand || product.material || product.model_type) && (
            <div className="mt-6 rounded border border-white/10 bg-ink-2 p-3.5 text-xs">
              <p className="text-[10px] uppercase tracking-[0.25em] text-gold font-semibold mb-2">Detalhes da Peça</p>
              <div className="grid grid-cols-2 gap-2 text-mute">
                {product.brand && (
                  <p><strong className="text-paper">Marca:</strong> {product.brand}</p>
                )}
                {product.material && (
                  <p><strong className="text-paper">Tecido:</strong> {product.material}</p>
                )}
                {product.model_type && (
                  <p><strong className="text-paper">Modelo:</strong> {product.model_type}</p>
                )}
                {product.gender && (
                  <p><strong className="text-paper">Gênero:</strong> {product.gender}</p>
                )}
              </div>
            </div>
          )}

          {/* 1. Seletor de Cores com Círculos Selecionáveis (PRIMEIRO) */}
          {product.colors.length > 0 && (
            <fieldset className="mt-7">
              <div className="flex items-center justify-between">
                <legend className="text-xs uppercase tracking-[0.2em] text-paper font-semibold">
                  Cor:{' '}
                  <span className="text-gold font-bold ml-1">
                    {color ? getColorName(color) : 'Selecione uma cor'}
                  </span>
                </legend>
                {product.images.some((img) => img.color) && (
                  <span className="text-[10px] text-mute uppercase tracking-wider">
                    Toque no círculo para ver a foto
                  </span>
                )}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2.5">
                {product.colors.map((option) => {
                  const colorName = getColorName(option)
                  const hex = getColorHex(option)
                  const optionSizes = getColorSizes(option)
                  const isSelected =
                    color === option || (color && getColorName(color).toLowerCase() === colorName.toLowerCase())
                  const isLight = isColorLight(hex)
                  const matchedImg = product.images.find(
                    (img) => img.color && getColorName(img.color).toLowerCase() === colorName.toLowerCase(),
                  )

                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => handleSelectColor(option)}
                      title={`Selecionar cor: ${colorName}${matchedImg ? ' (com foto)' : ''}${
                        optionSizes ? ` - Tamanhos: ${optionSizes.join(', ')}` : ''
                      }`}
                      className={`group relative flex items-center gap-2 rounded-full p-1.5 transition cursor-pointer ${
                        isSelected
                          ? 'ring-2 ring-gold bg-gold/15 pr-3.5 shadow-md shadow-gold/20'
                          : 'border border-white/15 bg-ink-2 hover:border-gold/50 hover:bg-white/5 pr-3'
                      }`}
                    >
                      {/* Círculo da Cor */}
                      <span
                        className={`relative flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full transition-transform group-hover:scale-105 ${
                          isLight ? 'border border-black/30' : 'border border-white/20'
                        } ${isSelected ? 'scale-110 shadow-sm' : ''}`}
                        style={{ backgroundColor: hex }}
                      >
                        {isSelected && (
                          <IconCheck
                            className={`w-3.5 h-3.5 ${
                              isLight ? 'text-black' : 'text-white'
                            } drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]`}
                          />
                        )}
                      </span>

                      {/* Nome da cor e tamanhos específicos se houver */}
                      <div className="flex flex-col text-left">
                        <span
                          className={`text-xs font-semibold uppercase tracking-wider ${
                            isSelected ? 'text-gold' : 'text-paper/90 group-hover:text-paper'
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
            </fieldset>
          )}

          {/* 2. Seletor de Tamanhos (EMBAIXO DA COR) */}
          {allProductSizes.length > 0 && (
            <fieldset className="mt-6">
              <div className="flex items-center justify-between">
                <legend className="text-xs uppercase tracking-[0.2em] text-paper font-semibold">
                  Tamanho:{' '}
                  <span className="text-gold font-bold ml-1">{size || 'Selecione'}</span>
                  {color && (
                    <span className="text-mute font-normal lowercase text-[11px] ml-1.5">
                      (para a cor {getColorName(color)})
                    </span>
                  )}
                </legend>
                <button
                  type="button"
                  onClick={() => setShowSizeModal(true)}
                  className="inline-flex items-center gap-1.5 text-xs text-gold hover:underline transition cursor-pointer"
                >
                  <IconRuler className="w-3.5 h-3.5" />
                  <span>Tabela de Medidas</span>
                </button>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {allProductSizes.map((option) => {
                  const isAvailable = availableSizesForColor.includes(option)
                  const isSelected = size === option

                  if (!isAvailable) {
                    return (
                      <button
                        key={option}
                        type="button"
                        disabled
                        title={`Tamanho ${option} indisponível na cor ${
                          color ? getColorName(color) : 'selecionada'
                        }`}
                        className="min-h-11 min-w-11 rounded border border-white/10 bg-white/[0.04] px-4 text-xs font-semibold uppercase tracking-wider text-mute/40 line-through cursor-not-allowed select-none transition opacity-40"
                      >
                        {option}
                      </button>
                    )
                  }

                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setSize(option)}
                      className={`min-h-11 min-w-11 rounded border px-4 text-xs font-semibold uppercase tracking-wider transition cursor-pointer ${
                        isSelected
                          ? 'border-gold bg-gold text-ink font-bold shadow-md shadow-gold/20'
                          : 'border-white/20 text-paper hover:border-gold/50 bg-ink-2'
                      }`}
                    >
                      {option}
                    </button>
                  )
                })}
              </div>

              {hasUnavailableSizes && (
                <p className="mt-2 text-[11px] text-mute flex items-center gap-1.5">
                  <span className="inline-block w-3 h-3 rounded-full bg-white/10 border border-white/20 line-through text-center text-[9px] leading-3 text-mute/70">
                    /
                  </span>
                  Tamanhos em cinza e riscados não estão disponíveis na cor selecionada.
                </p>
              )}
            </fieldset>
          )}

          {/* Quantidade */}
          <div className="mt-6 flex items-center gap-3">
            <label className="text-xs uppercase tracking-[0.2em] text-paper font-semibold" htmlFor="qty">
              Qtd
            </label>
            <div className="flex rounded border border-white/20 bg-ink-2">
              <button
                type="button"
                className="min-h-11 min-w-11 text-lg text-paper hover:text-gold transition"
                onClick={() => setQty((n) => Math.max(1, n - 1))}
                aria-label="Diminuir quantidade"
              >
                −
              </button>
              <input
                id="qty"
                className="w-14 bg-transparent text-center text-sm font-semibold text-paper"
                type="number"
                min={1}
                value={qty}
                onChange={(e) => setQty(Math.max(1, Math.floor(Number(e.target.value) || 1)))}
              />
              <button
                type="button"
                className="min-h-11 min-w-11 text-lg text-paper hover:text-gold transition"
                onClick={() => setQty((n) => n + 1)}
                aria-label="Aumentar quantidade"
              >
                +
              </button>
            </div>
          </div>

          {/* CAMPO DE CUPOM DE DESCONTO NA HORA DA COMPRA */}
          <div className="mt-7 rounded border border-gold/40 bg-ink-2 p-3.5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="flex items-center gap-1.5 text-xs uppercase tracking-[0.2em] text-gold font-semibold">
                <IconTag className="w-4 h-4 text-gold" />
                Cupom de Desconto
              </span>
              {appliedCoupon && (
                <span className="text-[10px] uppercase tracking-wider text-green-400 font-bold flex items-center gap-1">
                  <IconCheck className="w-3.5 h-3.5 text-green-400" />
                  Ativo na Compra
                </span>
              )}
            </div>

            {!appliedCoupon ? (
              <div className="space-y-2.5">
                <form onSubmit={(e) => void handleApplyCoupon(e)} className="flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => {
                      setCouponInput(e.target.value.toUpperCase().replace(/\s+/g, ''))
                      if (couponError) setCouponError(null)
                    }}
                    placeholder="Digite o código do cupom..."
                    className="min-h-10 flex-1 rounded border border-white/15 bg-ink px-3 text-xs text-paper font-mono uppercase tracking-wider focus:border-gold focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={couponChecking || !couponInput.trim()}
                    className="inline-flex min-h-10 items-center justify-center rounded bg-gold px-4 text-xs uppercase tracking-wider text-ink font-semibold hover:bg-gold-light transition disabled:opacity-50 cursor-pointer"
                  >
                    {couponChecking ? 'Validando…' : 'Aplicar'}
                  </button>
                </form>
              </div>
            ) : (
              <div className="flex items-center justify-between rounded border border-gold/40 bg-gold/10 p-2.5">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gold text-ink">
                    <IconPercent className="w-3.5 h-3.5" />
                  </span>
                  <div>
                    <p className="text-xs font-bold text-paper font-mono tracking-wider">
                      {appliedCoupon.code}{' '}
                      <span className="text-gold font-sans font-normal">
                        (
                        {appliedCoupon.discount_type === 'percent'
                          ? `${appliedCoupon.discount_value}% OFF`
                          : `${formatBRL(appliedCoupon.discount_value)} OFF`}
                        )
                      </span>
                    </p>
                    {singleDiscountCents > 0 && (
                      <p className="text-[11px] text-gold font-medium">
                        Desconto de {formatBRL(singleDiscountCents)} aplicado nesta compra!
                      </p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => applyCoupon(null)}
                  className="text-xs text-mute hover:text-red-400 underline font-medium cursor-pointer"
                >
                  Remover
                </button>
              </div>
            )}

            {couponError && <p className="mt-2 text-xs text-red-400">{couponError}</p>}
          </div>

          {/* BOTÃO ESTILO SHOPEE: Carrinho [🛒] ao lado + COMPRAR AGORA principal */}
          <div className="mt-8 flex items-center gap-3">
            <button
              type="button"
              onClick={addToCart}
              disabled={!product.available}
              title="Adicionar à sacola de compras"
              className="flex h-12 w-14 shrink-0 items-center justify-center rounded border border-gold/70 bg-gold/10 text-gold hover:bg-gold hover:text-ink transition active:scale-95 disabled:opacity-40"
            >
              <IconCart className="w-6 h-6" />
              <span className="sr-only">Adicionar à sacola</span>
            </button>

            <button
              type="button"
              onClick={buyNow}
              disabled={!product.available}
              className="flex-1 min-h-12 rounded bg-gold px-6 text-xs sm:text-sm uppercase tracking-[0.22em] font-bold text-ink hover:bg-gold-light transition shadow-lg shadow-gold/20 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span>{product.available ? 'Comprar Agora' : 'Indisponível'}</span>
              {appliedCoupon && singleDiscountCents > 0 && (
                <span className="text-xs bg-ink text-gold px-2 py-0.5 rounded font-mono font-bold">
                  {formatBRL(finalPriceCents)}
                </span>
              )}
            </button>
          </div>

          {message && (
            <div className="mt-4 rounded border border-gold/40 bg-gold/10 p-3 text-xs text-gold animate-fadeIn">
              {message}
            </div>
          )}

          {/* Selos de Confiança na Página do Produto */}
          <div className="mt-8 border-t border-white/10 pt-5 grid grid-cols-2 gap-3 text-[11px] text-mute">
            <div className="flex items-center gap-2">
              <IconTruck className="w-4 h-4 text-gold shrink-0" />
              <span>Envio para todo o Brasil</span>
            </div>
            <div className="flex items-center gap-2">
              <IconShield className="w-4 h-4 text-gold shrink-0" />
              <span>Troca fácil garantida</span>
            </div>
          </div>
        </div>
      </div>

      {/* BARRA FIXA FLUTUANTE PARA CELULAR (Estilo Shopee) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-ink/95 backdrop-blur-lg p-2.5 md:hidden shadow-2xl flex items-center gap-2.5">
        <button
          type="button"
          onClick={addToCart}
          disabled={!product.available}
          title="Adicionar à sacola"
          className="flex h-11 w-12 shrink-0 items-center justify-center rounded border border-gold/60 bg-gold/10 text-gold hover:bg-gold hover:text-ink transition active:scale-95 disabled:opacity-40"
        >
          <IconCart className="w-5 h-5" />
          <span className="sr-only">Adicionar à sacola</span>
        </button>

        <button
          type="button"
          onClick={buyNow}
          disabled={!product.available}
          className="flex-1 min-h-11 rounded bg-gold px-4 text-xs uppercase tracking-[0.2em] font-bold text-ink hover:bg-gold-light transition shadow-md shadow-gold/20 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <span>{product.available ? 'Comprar Agora' : 'Indisponível'}</span>
          {appliedCoupon && singleDiscountCents > 0 && (
            <span className="text-[10px] bg-ink text-gold px-1.5 py-0.5 rounded font-mono font-bold">
              {formatBRL(finalPriceCents)}
            </span>
          )}
        </button>
      </div>

      {/* Modal da Tabela de Medidas */}
      <SizeGuideModal
        category={product.category}
        isOpen={showSizeModal}
        onClose={() => setShowSizeModal(false)}
      />
    </div>
  )
}
