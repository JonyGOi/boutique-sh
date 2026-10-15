import { useState, useRef, useEffect, useCallback } from 'react'
import { IconClose } from '../ui/Icons'

type AspectRatio = '3:4' | '1:1' | 'free'
type FitMode = 'cover' | 'contain'

interface ImageCropModalProps {
  isOpen: boolean
  imageUrl: string
  onClose: () => void
  onConfirm: (croppedFile: File) => void
  fileName?: string
}

export function ImageCropModal({
  isOpen,
  imageUrl,
  onClose,
  onConfirm,
  fileName = 'foto-enquadrada.jpg',
}: ImageCropModalProps) {
  const [aspect, setAspect] = useState<AspectRatio>('3:4')
  const [fitMode, setFitMode] = useState<FitMode>('cover')
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0) // 0, 90, 180, 270
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [imageLoaded, setImageLoaded] = useState(false)
  const [naturalDims, setNaturalDims] = useState({ width: 0, height: 0 })
  const [containerDims, setContainerDims] = useState({ width: 330, height: 440 })

  const imageRef = useRef<HTMLImageElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  // Reseta transformações ao abrir nova imagem
  useEffect(() => {
    if (isOpen) {
      setZoom(1)
      setRotation(0)
      setPan({ x: 0, y: 0 })
      setFitMode('cover')
      setImageLoaded(false)
      setNaturalDims({ width: 0, height: 0 })
    }
  }, [isOpen, imageUrl])

  // Mede as dimensões reais do container na tela sempre que mudar o aspect ou carregar
  useEffect(() => {
    if (!isOpen) return
    const updateContainerSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        if (rect.width > 0 && rect.height > 0) {
          setContainerDims({ width: rect.width, height: rect.height })
        }
      }
    }
    updateContainerSize()
    const timer = setTimeout(updateContainerSize, 50)
    window.addEventListener('resize', updateContainerSize)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', updateContainerSize)
    }
  }, [isOpen, aspect, imageLoaded])

  // Fecha com tecla ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  // Início do arrasto (Mouse & Touch)
  const handleStart = (clientX: number, clientY: number) => {
    setIsDragging(true)
    setDragStart({ x: clientX - pan.x, y: clientY - pan.y })
  }

  // Movimento do arrasto
  const handleMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!isDragging) return
      setPan({
        x: clientX - dragStart.x,
        y: clientY - dragStart.y,
      })
    },
    [isDragging, dragStart],
  )

  const handleEnd = () => {
    setIsDragging(false)
  }

  // Roda 90 graus no sentido horário
  const rotateRight = () => {
    setRotation((r) => (r + 90) % 360)
  }

  // Zoom pelo scroll do mouse
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY < 0 ? 0.08 : -0.08
    setZoom((z) => Math.min(3, Math.max(0.6, +(z + delta).toFixed(2))))
  }

  // Dimensões do quadro de corte (viewport do container)
  const targetW = containerDims.width || 330
  const targetH = containerDims.height || 440

  // Se rotacionado em 90 ou 270 graus, inverte a largura e altura para cálculo de encaixe
  const isRotatedSideways = rotation === 90 || rotation === 270
  const effectiveW = isRotatedSideways ? naturalDims.height : naturalDims.width
  const effectiveH = isRotatedSideways ? naturalDims.width : naturalDims.height

  // Escala base calculada para COVER (preencher sem bordas) ou CONTAIN (encaixar tudo)
  const baseScale =
    effectiveW > 0 && effectiveH > 0
      ? fitMode === 'cover'
        ? Math.max(targetW / effectiveW, targetH / effectiveH)
        : Math.min(targetW / effectiveW, targetH / effectiveH)
      : 1

  const drawW = naturalDims.width * baseScale
  const drawH = naturalDims.height * baseScale

  // Processa o corte definitivo em alta resolução usando Canvas exatamente com os mesmos parâmetros da tela
  const handleCrop = async () => {
    if (!imageRef.current || !containerRef.current) return

    const img = imageRef.current
    const container = containerRef.current
    const rect = container.getBoundingClientRect()
    const actualW = rect.width || targetW
    const actualH = rect.height || targetH

    // Canvas de saída em alta resolução (mínimo 1200px para nitidez máxima de e-commerce lookbook)
    const exportScale = Math.max(1, 1200 / actualW)
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(actualW * exportScale)
    canvas.height = Math.round(actualH * exportScale)

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'

    // Fundo boutique
    ctx.fillStyle = '#0c0b0a'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Ajusta coordenadas e transformações com exportScale
    ctx.save()
    // 1. Escala o contexto para o tamanho de alta resolução do canvas
    ctx.scale(exportScale, exportScale)

    // 2. Move para o centro do quadro de corte (mesma lógica do DOM: centro + pan)
    ctx.translate(actualW / 2 + pan.x, actualH / 2 + pan.y)
    ctx.rotate((rotation * Math.PI) / 180)
    ctx.scale(zoom, zoom)

    // 3. Desenha a imagem exatamente com as mesmas dimensões base renderizadas na prévia
    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH)
    ctx.restore()

    // Converte para Blob JPEG de alta qualidade
    try {
      canvas.toBlob(
        (blob) => {
          if (!blob) return
          const croppedFile = new File([blob], fileName.replace(/\.[^/.]+$/, '') + '-crop.jpg', {
            type: 'image/jpeg',
            lastModified: Date.now(),
          })
          onConfirm(croppedFile)
          onClose()
        },
        'image/jpeg',
        0.93,
      )
    } catch (err) {
      console.error('Erro ao recortar imagem:', err)
      alert(
        'Não foi possível exportar a imagem recortada devido a restrições de segurança do link externo (CORS). Dica: salve a imagem no seu computador/celular e use a aba "Armazenamento Local" para recortá-la livremente.',
      )
    }
  }

  if (!isOpen) return null

  // Proporção de aspecto para o quadro de corte na tela
  const aspectClass =
    aspect === '3:4'
      ? 'w-[280px] h-[373px] sm:w-[330px] sm:h-[440px]'
      : aspect === '1:1'
        ? 'w-[280px] h-[280px] sm:w-[360px] sm:h-[360px]'
        : 'w-[280px] h-[350px] sm:w-[400px] sm:h-[440px]'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg rounded border border-gold/40 bg-ink-2 p-4 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <h2 className="font-display text-xl text-paper">Enquadrar & Cortar Foto</h2>
            <p className="text-[11px] text-mute">
              Arraste para posicionar e use o zoom para preencher todo o retângulo.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-mute hover:text-gold rounded transition cursor-pointer"
            title="Fechar"
          >
            <IconClose className="w-5 h-5" />
          </button>
        </div>

        {/* Seleção de Formato / Proporção */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase tracking-wider text-mute">Proporção:</span>
            <button
              type="button"
              onClick={() => setAspect('3:4')}
              className={`rounded px-2.5 py-1 font-medium transition cursor-pointer ${
                aspect === '3:4'
                  ? 'bg-gold text-ink font-semibold'
                  : 'border border-white/15 text-paper hover:border-gold/50'
              }`}
            >
              3:4 (Lookbook)
            </button>
            <button
              type="button"
              onClick={() => setAspect('1:1')}
              className={`rounded px-2.5 py-1 font-medium transition cursor-pointer ${
                aspect === '1:1'
                  ? 'bg-gold text-ink font-semibold'
                  : 'border border-white/15 text-paper hover:border-gold/50'
              }`}
            >
              1:1 (Quadrado)
            </button>
            <button
              type="button"
              onClick={() => setAspect('free')}
              className={`rounded px-2.5 py-1 font-medium transition cursor-pointer ${
                aspect === 'free'
                  ? 'bg-gold text-ink font-semibold'
                  : 'border border-white/15 text-paper hover:border-gold/50'
              }`}
            >
              Livre
            </button>
          </div>

          {/* Modo Preencher vs Encaixar */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setFitMode('cover')}
              title="Preenche todo o retângulo eliminando bordas vazias"
              className={`rounded px-2 py-1 text-[11px] font-medium transition cursor-pointer ${
                fitMode === 'cover'
                  ? 'border border-gold text-gold font-bold bg-gold/10'
                  : 'border border-white/15 text-mute hover:text-paper'
              }`}
            >
              Preencher
            </button>
            <button
              type="button"
              onClick={() => setFitMode('contain')}
              title="Mostra a foto inteira dentro do quadro"
              className={`rounded px-2 py-1 text-[11px] font-medium transition cursor-pointer ${
                fitMode === 'contain'
                  ? 'border border-gold text-gold font-bold bg-gold/10'
                  : 'border border-white/15 text-mute hover:text-paper'
              }`}
            >
              Encaixar
            </button>
          </div>
        </div>

        {/* Área Interativa de Corte */}
        <div className="mt-4 flex justify-center">
          <div
            ref={containerRef}
            onWheel={handleWheel}
            onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
            onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
            onMouseUp={handleEnd}
            onMouseLeave={handleEnd}
            onTouchStart={(e) => {
              if (e.touches[0]) handleStart(e.touches[0].clientX, e.touches[0].clientY)
            }}
            onTouchMove={(e) => {
              if (e.touches[0]) handleMove(e.touches[0].clientX, e.touches[0].clientY)
            }}
            onTouchEnd={handleEnd}
            className={`relative overflow-hidden border-2 border-gold bg-[#0c0b0a] shadow-2xl cursor-grab active:cursor-grabbing select-none ${aspectClass}`}
          >
            {/* Imagem a ser manipulada (dimensionada rigorosamente para o quadro) */}
            <img
              ref={imageRef}
              src={imageUrl}
              alt="Enquadramento da foto"
              onLoad={(e) => {
                setNaturalDims({
                  width: e.currentTarget.naturalWidth,
                  height: e.currentTarget.naturalHeight,
                })
                setImageLoaded(true)
              }}
              style={{
                width: drawW > 0 ? `${drawW}px` : 'auto',
                height: drawH > 0 ? `${drawH}px` : 'auto',
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: `translate(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px)) rotate(${rotation}deg) scale(${zoom})`,
                maxWidth: 'none',
                maxHeight: 'none',
                pointerEvents: 'none',
                userSelect: 'none',
              }}
              className="transition-transform duration-75"
              crossOrigin="anonymous"
            />

            {/* Linhas Guia de Enquadramento (Regra dos Terços) */}
            <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3">
              <div className="border-b border-r border-gold/25" />
              <div className="border-b border-r border-gold/25" />
              <div className="border-b border-r border-gold/25" />
              <div className="border-b border-r border-gold/25" />
              <div className="border-b border-r border-gold/25" />
              <div className="border-b border-r border-gold/25" />
              <div className="border-r border-gold/25" />
              <div className="border-r border-gold/25" />
              <div />
            </div>

            {/* Dica de toque se ainda carregando */}
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-ink text-xs text-mute">
                Carregando imagem…
              </div>
            )}
          </div>
        </div>

        {/* Controles de Zoom e Rotação */}
        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-xs text-mute shrink-0">Zoom:</span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.6, +(z - 0.1).toFixed(2)))}
              className="h-8 w-8 rounded border border-white/15 text-paper hover:border-gold transition flex items-center justify-center font-bold text-sm cursor-pointer"
              title="Diminuir Zoom"
            >
              −
            </button>
            <input
              type="range"
              min="0.6"
              max="3"
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="flex-1 accent-gold cursor-pointer"
            />
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(3, +(z + 0.1).toFixed(2)))}
              className="h-8 w-8 rounded border border-white/15 text-paper hover:border-gold transition flex items-center justify-center font-bold text-sm cursor-pointer"
              title="Aumentar Zoom"
            >
              +
            </button>
            <span className="text-xs text-gold font-mono w-12 text-right">
              {Math.round(zoom * 100)}%
            </span>
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={rotateRight}
              className="inline-flex items-center gap-1.5 rounded border border-white/15 px-3 py-1.5 text-xs text-paper hover:border-gold hover:text-gold transition cursor-pointer"
            >
              <span>↻ Girar 90°</span>
              {rotation > 0 && <span className="text-gold font-mono">({rotation}°)</span>}
            </button>

            <button
              type="button"
              onClick={() => {
                setZoom(1)
                setRotation(0)
                setPan({ x: 0, y: 0 })
              }}
              className="text-xs text-mute hover:text-gold underline cursor-pointer"
            >
              Centralizar / Resetar
            </button>
          </div>
        </div>

        {/* Rodapé de Ações */}
        <div className="mt-6 flex items-center justify-end gap-3 border-t border-white/10 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-white/20 px-4 py-2 text-xs uppercase tracking-wider text-paper hover:border-white/40 transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleCrop}
            className="rounded bg-gold px-5 py-2 text-xs uppercase tracking-wider text-ink font-semibold hover:bg-gold-light transition shadow-lg shadow-gold/20 cursor-pointer"
          >
            Confirmar Enquadramento
          </button>
        </div>
      </div>
    </div>
  )
}
