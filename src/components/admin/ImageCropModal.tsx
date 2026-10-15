import { useState, useRef, useEffect, useCallback } from 'react'
import { IconClose } from '../ui/Icons'

type AspectRatio = '3:4' | '1:1' | 'free'

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
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0) // 0, 90, 180, 270
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [imageLoaded, setImageLoaded] = useState(false)

  const imageRef = useRef<HTMLImageElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  // Reseta transformações ao abrir nova imagem
  useEffect(() => {
    if (isOpen) {
      setZoom(1)
      setRotation(0)
      setPan({ x: 0, y: 0 })
      setImageLoaded(false)
    }
  }, [isOpen, imageUrl])

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
    const delta = e.deltaY < 0 ? 0.1 : -0.1
    setZoom((z) => Math.min(3, Math.max(0.5, +(z + delta).toFixed(2))))
  }

  // Processa o corte definitivo em alta resolução usando Canvas
  const handleCrop = async () => {
    if (!imageRef.current || !containerRef.current) return

    const img = imageRef.current
    const container = containerRef.current
    const rect = container.getBoundingClientRect()

    // Dimensões do quadro de corte (viewport do container)
    const targetW = rect.width
    const targetH = rect.height

    // Canvas de saída em alta resolução (mínimo 1200px para nitidez máxima de e-commerce)
    const scaleFactor = Math.max(1, 1200 / targetW)
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(targetW * scaleFactor)
    canvas.height = Math.round(targetH * scaleFactor)

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'

    // Limpa fundo (preto/transparente)
    ctx.fillStyle = '#0c0b0a'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Ajusta coordenadas e transformações
    ctx.save()
    ctx.scale(scaleFactor, scaleFactor)

    // Move para o centro do quadro de corte
    ctx.translate(targetW / 2 + pan.x, targetH / 2 + pan.y)
    ctx.rotate((rotation * Math.PI) / 180)
    ctx.scale(zoom, zoom)

    // Desenha a imagem centralizada na transformação
    const imgNaturalW = img.naturalWidth
    const imgNaturalH = img.naturalHeight

    // Fator base de encaixe da imagem no container
    const fitScale = Math.min(targetW / imgNaturalW, targetH / imgNaturalH)
    const drawW = imgNaturalW * fitScale
    const drawH = imgNaturalH * fitScale

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
        0.92,
      )
    } catch (err) {
      console.error('Erro ao recortar imagem:', err)
      alert(
        'Não foi possível exportar a imagem recortada devido a restrições de segurança do link externo (CORS). Dica: salve a imagem no seu computador/celular e use a aba "Armazenamento Local" para recortá-la livremente.',
      )
    }
  }

  if (!isOpen) return null

  // Proporção de aspecto para o quadro de corte
  const aspectClass =
    aspect === '3:4'
      ? 'w-[280px] h-[373px] sm:w-[330px] sm:h-[440px]'
      : aspect === '1:1'
        ? 'w-[280px] h-[280px] sm:w-[360px] sm:h-[360px]'
        : 'w-[280px] h-[340px] sm:w-[420px] sm:h-[420px]'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg rounded border border-gold/40 bg-ink-2 p-4 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <h2 className="font-display text-xl text-paper">Enquadrar & Cortar Foto</h2>
            <p className="text-[11px] text-mute">Arraste para posicionar e use o zoom para enquadrar a peça.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-mute hover:text-gold rounded transition"
            title="Fechar"
          >
            <IconClose className="w-5 h-5" />
          </button>
        </div>

        {/* Seleção de Formato / Proporção */}
        <div className="mt-4 flex items-center justify-center gap-2 text-xs">
          <span className="text-[10px] uppercase tracking-wider text-mute mr-1">Proporção:</span>
          <button
            type="button"
            onClick={() => setAspect('3:4')}
            className={`rounded px-3 py-1.5 font-medium transition ${
              aspect === '3:4'
                ? 'bg-gold text-ink font-semibold'
                : 'border border-white/15 text-paper hover:border-gold/50'
            }`}
          >
            3:4 (Lookbook Moda)
          </button>
          <button
            type="button"
            onClick={() => setAspect('1:1')}
            className={`rounded px-3 py-1.5 font-medium transition ${
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
            className={`rounded px-3 py-1.5 font-medium transition ${
              aspect === 'free'
                ? 'bg-gold text-ink font-semibold'
                : 'border border-white/15 text-paper hover:border-gold/50'
            }`}
          >
            Livre
          </button>
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
            className={`relative overflow-hidden border-2 border-gold/70 bg-ink shadow-inner cursor-grab active:cursor-grabbing select-none ${aspectClass}`}
          >
            {/* Imagem a ser manipulada */}
            <img
              ref={imageRef}
              src={imageUrl}
              alt="Enquadramento da foto"
              onLoad={() => setImageLoaded(true)}
              style={{
                transform: `translate(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px)) rotate(${rotation}deg) scale(${zoom})`,
                position: 'absolute',
                top: '50%',
                left: '50%',
                maxWidth: 'none',
                maxHeight: 'none',
                pointerEvents: 'none',
                userSelect: 'none',
              }}
              className="transition-transform duration-75"
              crossOrigin="anonymous"
            />

            {/* Linhas Guia (Regra dos Terços para enquadramento refinado) */}
            <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3">
              <div className="border-b border-r border-gold/20" />
              <div className="border-b border-r border-gold/20" />
              <div className="border-b border-gold/20" />
              <div className="border-b border-r border-gold/20" />
              <div className="border-b border-r border-gold/20" />
              <div className="border-b border-gold/20" />
              <div className="border-r border-gold/20" />
              <div className="border-r border-gold/20" />
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
              onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.1).toFixed(2)))}
              className="h-8 w-8 rounded border border-white/15 text-paper hover:border-gold transition flex items-center justify-center font-bold text-sm"
              title="Diminuir Zoom"
            >
              −
            </button>
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="flex-1 accent-gold cursor-pointer"
            />
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(3, +(z + 0.1).toFixed(2)))}
              className="h-8 w-8 rounded border border-white/15 text-paper hover:border-gold transition flex items-center justify-center font-bold text-sm"
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
              className="inline-flex items-center gap-1.5 rounded border border-white/15 px-3 py-1.5 text-xs text-paper hover:border-gold hover:text-gold transition"
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
              className="text-xs text-mute hover:text-paper underline"
            >
              Resetar Posição
            </button>
          </div>
        </div>

        {/* Rodapé de Ações */}
        <div className="mt-6 flex items-center justify-end gap-3 border-t border-white/10 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-white/20 px-4 py-2 text-xs uppercase tracking-wider text-paper hover:border-white/40 transition"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleCrop}
            className="rounded bg-gold px-5 py-2 text-xs uppercase tracking-wider text-ink font-semibold hover:bg-gold-light transition shadow-lg shadow-gold/20"
          >
            Confirmar Enquadramento
          </button>
        </div>
      </div>
    </div>
  )
}
