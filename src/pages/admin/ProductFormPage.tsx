import { type FormEvent, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { MAX_IMAGES_PER_PRODUCT, PRODUCT_CATEGORIES } from '../../config/store'
import {
  addProductImage,
  createProduct,
  deleteProductImage,
  setPrimaryImage,
  updateProduct,
  updateProductImageColor,
  type ProductInput,
} from '../../lib/adminApi'
import { normalizeImageUrl, validateImageFile } from '../../lib/images'
import { formatBRL, parseBRLToCents } from '../../lib/money'
import { fetchAdminProduct } from '../../lib/products'
import { IconFolder, IconLink, IconCheck, IconInfo, IconStar, IconCrop } from '../../components/ui/Icons'
import { ImageCropModal } from '../../components/admin/ImageCropModal'
import {
  POPULAR_COLORS,
  formatColorEntry,
  getColorHex,
  getColorName,
  isColorLight,
} from '../../lib/colors'
import type { Product, ProductImageRow } from '../../types/product'

const empty: ProductInput = {
  name: '',
  description: '',
  price_cents: 0,
  category: 'vestidos',
  sizes: [],
  colors: [],
  stock: null,
  track_stock: false,
  available: true,
  published: false,
  is_launch: false,
  is_featured: false,
  is_promo: false,
  promo_price_cents: null,
  archived: false,
  brand: '',
  material: '',
  gender: '',
  model_type: '',
}

type PendingImage = {
  id: string
  fileOrUrl: File | string
  preview: string
  is_primary: boolean
  color?: string | null
}

export function ProductFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = !id
  const [form, setForm] = useState<ProductInput>(empty)
  const [price, setPrice] = useState('')
  const [promo, setPromo] = useState('')
  const [sizeInput, setSizeInput] = useState('')
  const [product, setProduct] = useState<Product | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [loading, setLoading] = useState(!isNew)

  // Cores personalizadas e upload de foto por cor
  const [newColorName, setNewColorName] = useState('')
  const [newColorHex, setNewColorHex] = useState('#18181b')
  const [colorUploadTarget, setColorUploadTarget] = useState<string | null>(null)
  const colorFileInputRef = useRef<HTMLInputElement>(null)

  // Images state
  const [imageTab, setImageTab] = useState<'local' | 'link'>('local')
  const [imageUrlInput, setImageUrlInput] = useState('')
  const [urlPreviewStatus, setUrlPreviewStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [uploadingProgress, setUploadingProgress] = useState<string | null>(null)
  const [pendingNewImages, setPendingNewImages] = useState<PendingImage[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cropFileInputRef = useRef<HTMLInputElement>(null)

  // Crop / Framing modal state
  const [cropModalOpen, setCropModalOpen] = useState(false)
  const [cropImageUrl, setCropImageUrl] = useState('')
  const [cropFileName, setCropFileName] = useState('foto.jpg')
  const [cropTarget, setCropTarget] = useState<
    | { type: 'pending'; id: string; color?: string | null }
    | { type: 'existing'; imgId: string; imgPath: string; isPrimary: boolean; sortOrder: number; color?: string | null }
    | { type: 'newSingle'; isPrimary: boolean; color?: string | null }
    | null
  >(null)

  useEffect(() => {
    if (!id) return
    let active = true
    fetchAdminProduct(id)
      .then((data) => {
        if (!active) return
        if (!data) {
          setError('Produto não encontrado.')
          return
        }
        setProduct(data)
        setForm({
          name: data.name,
          description: data.description,
          price_cents: data.price_cents,
          category: data.category,
          sizes: data.sizes,
          colors: data.colors,
          stock: data.stock,
          track_stock: data.track_stock,
          available: data.available,
          published: data.published,
          is_launch: data.is_launch,
          is_featured: data.is_featured,
          is_promo: data.is_promo,
          promo_price_cents: data.promo_price_cents,
          archived: data.archived,
          brand: data.brand ?? '',
          material: data.material ?? '',
          gender: data.gender ?? '',
          model_type: data.model_type ?? '',
        })
        setPrice(formatBRL(data.price_cents).replace('R$', '').trim())
        setPromo(
          data.promo_price_cents != null
            ? formatBRL(data.promo_price_cents).replace('R$', '').trim()
            : '',
        )
      })
      .catch(() => setError('Não foi possível carregar o produto.'))
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [id])

  function addChip(kind: 'sizes' | 'colors', value: string) {
    const token = value.trim()
    if (!token) return
    setForm((prev: ProductInput) =>
      prev[kind].includes(token) ? prev : { ...prev, [kind]: [...prev[kind], token] },
    )
  }

  function buildInput(): ProductInput | string {
    const priceCents = parseBRLToCents(price)
    if (!form.name.trim() || form.name.trim().length < 2) return 'Informe um nome válido.'
    if (priceCents == null || priceCents < 1) return 'Informe um preço válido, por exemplo 129,90.'
    const promoCents = promo.trim() ? parseBRLToCents(promo) : null
    if (promo.trim() && promoCents == null) return 'Preço promocional inválido.'
    if (form.is_promo && (promoCents == null || promoCents >= priceCents)) {
      return 'A promoção precisa de um preço menor que o valor original.'
    }
    if (!PRODUCT_CATEGORIES.some((c) => c.slug === form.category)) return 'Categoria inválida.'
    return {
      ...form,
      name: form.name.trim(),
      description: form.description.trim(),
      price_cents: priceCents,
      promo_price_cents: form.is_promo ? promoCents : null,
      stock: form.track_stock ? Math.max(0, Number(form.stock ?? 0)) : null,
      brand: form.brand?.trim() || null,
      material: form.material?.trim() || null,
      gender: form.gender?.trim() || null,
      model_type: form.model_type?.trim() || null,
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSuccess(null)
    const input = buildInput()
    if (typeof input === 'string') {
      setError(input)
      return
    }
    setPending(true)
    try {
      if (isNew) {
        const createdId = await createProduct(input)
        // Se houver imagens adicionadas na criação, salva todas no novo produto
        if (pendingNewImages.length > 0) {
          setUploadingProgress('Salvando fotografias no Supabase…')
          for (let i = 0; i < pendingNewImages.length; i++) {
            const item = pendingNewImages[i]
            await addProductImage(createdId, item.fileOrUrl, item.is_primary, i, item.color)
          }
        }
        navigate('/admin', { state: { notice: 'Produto cadastrado com sucesso!' } })
      } else if (id) {
        await updateProduct(id, input)
        navigate('/admin', { state: { notice: 'Alterações salvas com sucesso!' } })
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Não foi possível salvar. Verifique os dados e tente novamente.'
      setError(msg)
    } finally {
      setPending(false)
      setUploadingProgress(null)
    }
  }

  // Upload de arquivos locais (Computador ou Celular)
  async function onUpload(files: FileList | null) {
    if (!files?.length) return
    setError(null)
    const fileList = Array.from(files)
    const currentCount = isNew ? pendingNewImages.length : (product?.images.length ?? 0)

    if (currentCount + fileList.length > MAX_IMAGES_PER_PRODUCT) {
      setError(`No máximo ${MAX_IMAGES_PER_PRODUCT} imagens por produto.`)
      return
    }

    // Se for criação de novo produto, armazena no estado temporário
    if (isNew) {
      const newItems: PendingImage[] = []
      for (const file of fileList) {
        const invalid = validateImageFile(file)
        if (invalid) {
          setError(invalid)
          return
        }
        newItems.push({
          id: crypto.randomUUID(),
          fileOrUrl: file,
          preview: URL.createObjectURL(file),
          is_primary: currentCount === 0 && newItems.length === 0,
        })
      }
      setPendingNewImages((prev) => [...prev, ...newItems])
      setSuccess(`${fileList.length} foto(s) selecionada(s) para o novo produto.`)
      return
    }

    // Se for edição de produto existente, envia imediatamente ao Supabase
    if (!id) return
    setUploadingProgress(`Iniciando upload de ${fileList.length} foto(s)…`)

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i]
      const invalid = validateImageFile(file)
      if (invalid) {
        setError(invalid)
        setUploadingProgress(null)
        return
      }
      try {
        setUploadingProgress(`Otimizando e enviando foto ${i + 1} de ${fileList.length}…`)
        const isPrimary = (product?.images.length ?? 0) === 0 && i === 0
        const sortOrder = (product?.images.length ?? 0) + i
        await addProductImage(id, file, isPrimary, sortOrder)
      } catch (err: any) {
        setError(err.message || 'Falha no envio da imagem.')
        setUploadingProgress(null)
        return
      }
    }

    const refreshed = await fetchAdminProduct(id)
    setProduct(refreshed)
    setUploadingProgress(null)
    setSuccess('Fotos do armazenamento local enviadas com sucesso!')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // Normalização e teste prévio de link de imagem
  const normalizedUrl = normalizeImageUrl(imageUrlInput)
  const isGoogleDriveLink = /drive\.google\.com|googleusercontent\.com/i.test(imageUrlInput)

  function handleUrlChange(value: string) {
    setImageUrlInput(value)
    if (!value.trim()) {
      setUrlPreviewStatus('idle')
      return
    }
    setUrlPreviewStatus('loading')
    const clean = normalizeImageUrl(value)
    const img = new Image()
    img.onload = () => setUrlPreviewStatus('success')
    img.onerror = () => setUrlPreviewStatus('error')
    img.src = clean
  }

  // Adicionar foto por link (URL da Internet)
  async function onAddImageUrl() {
    if (!imageUrlInput.trim()) return
    setError(null)
    const cleanUrl = normalizeImageUrl(imageUrlInput)
    const currentCount = isNew ? pendingNewImages.length : (product?.images.length ?? 0)

    if (currentCount >= MAX_IMAGES_PER_PRODUCT) {
      setError(`No máximo ${MAX_IMAGES_PER_PRODUCT} imagens por produto.`)
      return
    }

    if (isNew) {
      setPendingNewImages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          fileOrUrl: cleanUrl,
          preview: cleanUrl,
          is_primary: prev.length === 0,
        },
      ])
      setImageUrlInput('')
      setUrlPreviewStatus('idle')
      setSuccess('Foto adicionada por link!')
      return
    }

    if (!id) return
    try {
      setPending(true)
      const isPrimary = (product?.images.length ?? 0) === 0
      const sortOrder = product?.images.length ?? 0
      await addProductImage(id, cleanUrl, isPrimary, sortOrder)
      setImageUrlInput('')
      setUrlPreviewStatus('idle')
      const refreshed = await fetchAdminProduct(id)
      setProduct(refreshed)
      setSuccess('Foto adicionada via link salva no Supabase com sucesso!')
    } catch {
      setError('Não foi possível salvar a imagem por link.')
    } finally {
      setPending(false)
    }
  }

  function handleRemovePending(imgId: string) {
    setPendingNewImages((prev) => {
      const filtered = prev.filter((item) => item.id !== imgId)
      if (filtered.length > 0 && !filtered.some((i) => i.is_primary)) {
        filtered[0].is_primary = true
      }
      return filtered
    })
  }

  function handleSetPrimaryPending(imgId: string) {
    setPendingNewImages((prev) =>
      prev.map((item) => ({
        ...item,
        is_primary: item.id === imgId,
      })),
    )
  }

  // Inicia enquadramento de foto pendente
  function startCropPending(img: PendingImage) {
    setCropImageUrl(img.preview)
    setCropFileName(typeof img.fileOrUrl === 'string' ? 'foto-link.jpg' : img.fileOrUrl.name)
    setCropTarget({ type: 'pending', id: img.id, color: img.color })
    setCropModalOpen(true)
  }

  // Inicia enquadramento de foto já existente na nuvem
  function startCropExisting(img: { id: string; path: string; public_url: string; is_primary: boolean; sort_order: number; color?: string | null }) {
    setCropImageUrl(img.public_url)
    setCropFileName(`foto-${img.id}.jpg`)
    setCropTarget({
      type: 'existing',
      imgId: img.id,
      imgPath: img.path,
      isPrimary: img.is_primary,
      sortOrder: img.sort_order,
      color: img.color,
    })
    setCropModalOpen(true)
  }

  // Seleciona arquivo do computador/celular direto para corte guiado
  function onSelectFileToCrop(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const invalid = validateImageFile(file)
    if (invalid) {
      setError(invalid)
      return
    }
    const currentCount = isNew ? pendingNewImages.length : (product?.images.length ?? 0)
    if (currentCount >= MAX_IMAGES_PER_PRODUCT) {
      setError(`No máximo ${MAX_IMAGES_PER_PRODUCT} imagens por produto.`)
      return
    }
    const preview = URL.createObjectURL(file)
    setCropImageUrl(preview)
    setCropFileName(file.name)
    setCropTarget({
      type: 'newSingle',
      isPrimary: currentCount === 0,
    })
    setCropModalOpen(true)
    if (cropFileInputRef.current) cropFileInputRef.current.value = ''
  }

  // Inicia enquadramento a partir de link URL
  function startCropLink() {
    if (!imageUrlInput.trim()) return
    const cleanUrl = normalizeImageUrl(imageUrlInput)
    const currentCount = isNew ? pendingNewImages.length : (product?.images.length ?? 0)
    if (currentCount >= MAX_IMAGES_PER_PRODUCT) {
      setError(`No máximo ${MAX_IMAGES_PER_PRODUCT} imagens por produto.`)
      return
    }
    setCropImageUrl(cleanUrl)
    setCropFileName('foto-link.jpg')
    setCropTarget({
      type: 'newSingle',
      isPrimary: currentCount === 0,
    })
    setCropModalOpen(true)
  }

  // Callback ao confirmar o enquadramento/corte no modal
  async function onConfirmCrop(croppedFile: File) {
    if (!cropTarget) return

    if (cropTarget.type === 'pending') {
      const newPreview = URL.createObjectURL(croppedFile)
      setPendingNewImages((prev) =>
        prev.map((item) =>
          item.id === cropTarget.id
            ? { ...item, fileOrUrl: croppedFile, preview: newPreview }
            : item,
        ),
      )
      setSuccess('Foto enquadrada e atualizada!')
      return
    }

    if (cropTarget.type === 'newSingle') {
      if (isNew) {
        setPendingNewImages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            fileOrUrl: croppedFile,
            preview: URL.createObjectURL(croppedFile),
            is_primary: cropTarget.isPrimary || prev.length === 0,
            color: cropTarget.color || null,
          },
        ])
        setImageUrlInput('')
        setUrlPreviewStatus('idle')
        setSuccess('Foto enquadrada adicionada à lista do produto!')
      } else if (id) {
        try {
          setUploadingProgress('Enviando foto enquadrada ao Supabase…')
          const currentCount = product?.images.length ?? 0
          await addProductImage(id, croppedFile, cropTarget.isPrimary, currentCount, cropTarget.color)
          setImageUrlInput('')
          setUrlPreviewStatus('idle')
          const refreshed = await fetchAdminProduct(id)
          setProduct(refreshed)
          setSuccess('Foto enquadrada enviada com sucesso!')
        } catch (err: any) {
          setError(err.message || 'Erro ao enviar foto enquadrada.')
        } finally {
          setUploadingProgress(null)
        }
      }
      return
    }

    if (cropTarget.type === 'existing' && id) {
      try {
        setUploadingProgress('Atualizando foto no Supabase com novo enquadramento…')
        await addProductImage(id, croppedFile, cropTarget.isPrimary, cropTarget.sortOrder, cropTarget.color)
        await deleteProductImage(cropTarget.imgId, cropTarget.imgPath)
        const refreshed = await fetchAdminProduct(id)
        setProduct(refreshed)
        setSuccess('Foto recortada e atualizada com sucesso no Supabase!')
      } catch (err: any) {
        setError(err.message || 'Erro ao substituir foto recortada.')
      } finally {
        setUploadingProgress(null)
      }
      return
    }
  }

  // ============================================
  // GERENCIAMENTO DE CORES & FOTOS POR COR
  // ============================================

  function handleAddColor(name?: string, hex?: string) {
    const rawName = (name || newColorName).trim()
    if (!rawName) return
    const formatted = formatColorEntry(rawName, hex || newColorHex)
    const cleanName = getColorName(formatted).toLowerCase()
    if (!form.colors.some((c) => getColorName(c).toLowerCase() === cleanName)) {
      setForm((prev) => ({ ...prev, colors: [...prev.colors, formatted] }))
    }
    setNewColorName('')
    setNewColorHex('#18181b')
  }

  function handleRemoveColor(colorEntry: string) {
    const colorName = getColorName(colorEntry).toLowerCase()
    setForm((prev) => ({
      ...prev,
      colors: prev.colors.filter((c) => getColorName(c).toLowerCase() !== colorName),
    }))
    if (isNew) {
      setPendingNewImages((prev) =>
        prev.map((img) =>
          img.color && getColorName(img.color).toLowerCase() === colorName
            ? { ...img, color: null }
            : img,
        ),
      )
    } else if (product && id) {
      product.images.forEach((img) => {
        if (img.color && getColorName(img.color).toLowerCase() === colorName) {
          void updateProductImageColor(img.id, null)
        }
      })
      void fetchAdminProduct(id).then((refreshed) => setProduct(refreshed))
    }
  }

  function handleUpdateColorHex(colorEntry: string, newHex: string) {
    const name = getColorName(colorEntry)
    const updated = formatColorEntry(name, newHex)
    setForm((prev) => ({
      ...prev,
      colors: prev.colors.map((c) =>
        getColorName(c).toLowerCase() === name.toLowerCase() ? updated : c,
      ),
    }))
  }

  function handleTriggerUploadForColor(colorName: string) {
    setColorUploadTarget(colorName)
    colorFileInputRef.current?.click()
  }

  async function onUploadColorFile(files: FileList | null) {
    if (!files?.length || !colorUploadTarget) return
    const file = files[0]
    const invalid = validateImageFile(file)
    if (invalid) {
      setError(invalid)
      setColorUploadTarget(null)
      return
    }

    const currentCount = isNew ? pendingNewImages.length : (product?.images.length ?? 0)
    if (currentCount >= MAX_IMAGES_PER_PRODUCT) {
      setError(`No máximo ${MAX_IMAGES_PER_PRODUCT} imagens por produto.`)
      setColorUploadTarget(null)
      return
    }

    const colorName = colorUploadTarget

    if (isNew) {
      // Remove vínculo de foto anterior para essa mesma cor se houver
      setPendingNewImages((prev) => {
        const unlinked = prev.map((img) =>
          img.color && getColorName(img.color).toLowerCase() === colorName.toLowerCase()
            ? { ...img, color: null }
            : img,
        )
        return [
          ...unlinked,
          {
            id: crypto.randomUUID(),
            fileOrUrl: file,
            preview: URL.createObjectURL(file),
            is_primary: prev.length === 0,
            color: colorName,
          },
        ]
      })
      setSuccess(`Foto adicionada e vinculada à cor ${colorName}!`)
    } else if (id) {
      try {
        setUploadingProgress(`Enviando foto da cor ${colorName} ao Supabase…`)
        const sortOrder = product?.images.length ?? 0
        await addProductImage(id, file, false, sortOrder, colorName)
        const refreshed = await fetchAdminProduct(id)
        setProduct(refreshed)
        setSuccess(`Foto da cor ${colorName} salva com sucesso!`)
      } catch (err: any) {
        setError(err.message || 'Erro ao enviar foto da cor.')
      } finally {
        setUploadingProgress(null)
      }
    }

    setColorUploadTarget(null)
    if (colorFileInputRef.current) colorFileInputRef.current.value = ''
  }

  async function handleAssignColorToImage(
    img: PendingImage | ProductImageRow,
    colorName: string | null,
  ) {
    if (isNew) {
      setPendingNewImages((prev) =>
        prev.map((item) =>
          item.id === img.id ? { ...item, color: colorName || null } : item,
        ),
      )
    } else if (id) {
      await updateProductImageColor(img.id, colorName || null)
      const refreshed = await fetchAdminProduct(id)
      setProduct(refreshed)
    }
  }

  if (loading) return <p className="text-sm text-mute">Carregando formulário…</p>

  const existingImagesCount = product?.images.length ?? 0
  const totalImagesCount = isNew ? pendingNewImages.length : existingImagesCount

  return (
    <form onSubmit={onSubmit} className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-4xl">{isNew ? 'Novo produto' : 'Editar produto'}</h1>
        <Button type="button" variant="outline" onClick={() => navigate('/admin')}>
          ← Voltar ao painel
        </Button>
      </div>

      <label className="block text-xs uppercase tracking-[0.2em]">
        Nome
        <input
          className="mt-2 min-h-11 w-full border border-white/15 bg-ink-2 px-3 text-sm focus:border-gold focus:outline-none"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
          maxLength={120}
        />
      </label>

      <label className="block text-xs uppercase tracking-[0.2em]">
        Descrição
        <textarea
          className="mt-2 min-h-32 w-full border border-white/15 bg-ink-2 px-3 py-3 text-sm focus:border-gold focus:outline-none"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          maxLength={4000}
        />
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-xs uppercase tracking-[0.2em]">
          Preço (R$)
          <input
            className="mt-2 min-h-11 w-full border border-white/15 bg-ink-2 px-3 text-sm focus:border-gold focus:outline-none"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="129,90"
            required
          />
        </label>
        <label className="block text-xs uppercase tracking-[0.2em]">
          Categoria
          <select
            className="mt-2 min-h-11 w-full border border-white/15 bg-ink-2 px-3 text-sm focus:border-gold focus:outline-none"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          >
            {PRODUCT_CATEGORIES.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Subcategorias dinâmicas baseadas na Categoria selecionada */}
      <div className="rounded border border-gold/30 bg-ink p-4 space-y-4">
        <p className="text-[10px] uppercase tracking-[0.25em] text-gold font-bold">
          Subcategorias & Detalhes da Peça
        </p>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {/* Marca / Grife (para Vestidos, Camisas, Calças, Bermudas, Blazers, Blusas, Calçados) */}
          <label className="block text-xs uppercase tracking-[0.18em]">
            Marca / Grife
            <input
              className="mt-1.5 min-h-11 w-full rounded border border-white/15 bg-ink-2 px-3 text-sm text-paper focus:border-gold focus:outline-none"
              value={form.brand ?? ''}
              onChange={(e) => setForm({ ...form, brand: e.target.value })}
              placeholder="Ex: Farm, Zara, Animale, Boutique SH..."
            />
          </label>

          {/* Tecido / Material (para Vestidos, Camisas, Calças, Bermudas, Blazers, Blusas) */}
          {form.category !== 'calcados' && form.category !== 'acessorios' && (
            <label className="block text-xs uppercase tracking-[0.18em]">
              Tecido / Composição
              <input
                className="mt-1.5 min-h-11 w-full rounded border border-white/15 bg-ink-2 px-3 text-sm text-paper focus:border-gold focus:outline-none"
                value={form.material ?? ''}
                onChange={(e) => setForm({ ...form, material: e.target.value })}
                placeholder="Ex: Seda, Linho Puro, Algodão, Alfaiataria..."
              />
            </label>
          )}

          {/* Sexo (para Camisas, Calças, Bermudas) */}
          {(form.category === 'camisas' || form.category === 'calcas' || form.category === 'bermudas') && (
            <label className="block text-xs uppercase tracking-[0.18em]">
              Sexo / Linha
              <select
                className="mt-1.5 min-h-11 w-full rounded border border-white/15 bg-ink-2 px-3 text-sm text-paper focus:border-gold focus:outline-none"
                value={form.gender ?? ''}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
              >
                <option value="">Selecione o sexo</option>
                <option value="Feminino">Feminino</option>
                <option value="Masculino">Masculino</option>
                <option value="Unissex">Unissex</option>
              </select>
            </label>
          )}

          {/* Modelo (para Blusas, Calçados, Acessórios) */}
          {(form.category === 'blusas' || form.category === 'calcados' || form.category === 'acessorios') && (
            <label className="block text-xs uppercase tracking-[0.18em]">
              {form.category === 'acessorios' ? 'Tipo de Acessório' : 'Modelo / Corte'}
              {form.category === 'acessorios' ? (
                <select
                  className="mt-1.5 min-h-11 w-full rounded border border-white/15 bg-ink-2 px-3 text-sm text-paper focus:border-gold focus:outline-none"
                  value={form.model_type ?? ''}
                  onChange={(e) => setForm({ ...form, model_type: e.target.value })}
                >
                  <option value="">Selecione o tipo</option>
                  <option value="Bolsas">Bolsas</option>
                  <option value="Relógios">Relógios</option>
                  <option value="Pulseiras">Pulseiras</option>
                  <option value="Outros">Outros</option>
                </select>
              ) : (
                <input
                  className="mt-1.5 min-h-11 w-full rounded border border-white/15 bg-ink-2 px-3 text-sm text-paper focus:border-gold focus:outline-none"
                  value={form.model_type ?? ''}
                  onChange={(e) => setForm({ ...form, model_type: e.target.value })}
                  placeholder={
                    form.category === 'calcados'
                      ? 'Ex: Rasteira, Salto Fino, Scarpin, Tênis...'
                      : 'Ex: Regata, Manga Curta, Cropped, Gola Alta...'
                  }
                />
              )}
            </label>
          )}
        </div>
      </div>

      <ChipField
        label="Tamanhos"
        value={sizeInput}
        onValue={setSizeInput}
        items={form.sizes}
        onAdd={() => {
          addChip('sizes', sizeInput)
          setSizeInput('')
        }}
        onRemove={(item) => setForm({ ...form, sizes: form.sizes.filter((s: string) => s !== item) })}
      />
      {/* SEÇÃO: CORES DA PEÇA & FOTOS EXCLUSIVAS POR COR (NOVO TIPO DE PEÇA MULTICOLOR) */}
      <section className="rounded border border-gold/40 bg-ink-2 p-5 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-white/10 pb-3">
          <div>
            <h3 className="text-sm uppercase tracking-[0.22em] text-gold font-bold flex items-center gap-2">
              <span className="flex h-3 w-3 rounded-full bg-gold shadow-sm" />
              Cores da Peça & Fotos por Cor (Variações)
            </h3>
            <p className="text-xs text-mute mt-1">
              Defina as cores disponíveis para a peça e anexe uma fotografia para cada uma. Na loja virtual, os clientes verão os círculos com as cores e a foto mudará automaticamente ao selecionar!
            </p>
          </div>
        </div>

        {/* Input oculto para upload de foto específica de uma cor */}
        <input
          ref={colorFileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => void onUploadColorFile(e.target.files)}
        />

        {/* Adicionar Nova Cor com Seletor de Tom Visual */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2.5 rounded border border-white/15 bg-ink px-3 py-1.5 min-h-11">
              <label htmlFor="colorPickerInput" className="cursor-pointer" title="Clique para escolher a tonalidade exata">
                <span
                  className="block h-7 w-7 rounded-full border border-white/30 shadow-inner hover:scale-110 transition"
                  style={{ backgroundColor: newColorHex }}
                />
              </label>
              <input
                id="colorPickerInput"
                type="color"
                value={newColorHex}
                onChange={(e) => setNewColorHex(e.target.value)}
                className="sr-only"
              />
              <input
                type="text"
                value={newColorName}
                onChange={(e) => {
                  const val = e.target.value
                  setNewColorName(val)
                  const matchedHex = getColorHex(val)
                  if (matchedHex.startsWith('#')) {
                    setNewColorHex(matchedHex)
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddColor(newColorName, newColorHex)
                  }
                }}
                placeholder="Nome da cor (Ex: Preto, Off White, Marsala...)"
                className="w-56 sm:w-72 bg-transparent text-sm text-paper focus:outline-none"
              />
            </div>

            <button
              type="button"
              onClick={() => handleAddColor(newColorName, newColorHex)}
              disabled={!newColorName.trim()}
              className="min-h-11 rounded bg-gold px-5 text-xs uppercase tracking-wider font-semibold text-ink hover:bg-gold-light transition disabled:opacity-40 cursor-pointer"
            >
              + Adicionar Cor
            </button>
          </div>

          {/* Sugestões Rápidas de Cores de Moda */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs pt-1">
            <span className="text-[11px] text-mute uppercase tracking-wider">Cores comuns:</span>
            {POPULAR_COLORS.map((popName) => {
              const popHex = getColorHex(popName)
              const alreadyAdded = form.colors.some(
                (c) => getColorName(c).toLowerCase() === popName.toLowerCase(),
              )
              if (alreadyAdded) return null
              return (
                <button
                  key={popName}
                  type="button"
                  onClick={() => handleAddColor(popName, popHex)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-ink px-2.5 py-1 text-[11px] text-paper/90 hover:border-gold hover:text-gold transition cursor-pointer"
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full border border-white/30"
                    style={{ backgroundColor: popHex }}
                  />
                  <span>{popName}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Lista de Cores Cadastradas e suas Fotos */}
        {form.colors.length === 0 ? (
          <div className="rounded border border-dashed border-white/15 bg-ink p-4 text-center">
            <p className="text-xs text-mute">
              Nenhuma cor cadastrada ainda. Adicione as cores acima para que os círculos de seleção apareçam na compra e para poder vincular fotos exclusivas para cada cor.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {form.colors.map((colorEntry) => {
              const colorName = getColorName(colorEntry)
              const hex = getColorHex(colorEntry)
              const isLight = isColorLight(hex)

              // Foto associada a esta cor
              const assignedImage = isNew
                ? pendingNewImages.find(
                    (img) => img.color && getColorName(img.color).toLowerCase() === colorName.toLowerCase(),
                  )
                : product?.images.find(
                    (img) => img.color && getColorName(img.color).toLowerCase() === colorName.toLowerCase(),
                  )

              return (
                <div
                  key={colorEntry}
                  className="rounded border border-white/15 bg-ink p-3.5 space-y-3 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2.5">
                    <div className="flex items-center gap-2.5">
                      <label className="cursor-pointer relative" title="Alterar o tom visual desta cor">
                        <span
                          className={`flex h-7 w-7 items-center justify-center rounded-full shadow-inner ${
                            isLight ? 'border border-black/40' : 'border border-white/30'
                          }`}
                          style={{ backgroundColor: hex }}
                        />
                        <input
                          type="color"
                          value={hex.startsWith('#') ? hex : '#c9a24a'}
                          onChange={(e) => handleUpdateColorHex(colorEntry, e.target.value)}
                          className="sr-only"
                        />
                      </label>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-paper">
                          {colorName}
                        </p>
                        <p className="text-[10px] text-mute font-mono">{hex}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveColor(colorEntry)}
                      className="text-[11px] text-mute hover:text-red-400 transition"
                      title="Excluir esta cor da peça"
                    >
                      Remover
                    </button>
                  </div>

                  {/* Bloco da Foto da Cor */}
                  <div>
                    {assignedImage ? (
                      <div className="flex items-center gap-3 rounded border border-gold/30 bg-gold/5 p-2">
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded border border-gold/50 bg-ink">
                          <img
                            src={
                              isNew
                                ? (assignedImage as PendingImage).preview
                                : (assignedImage as ProductImageRow).public_url
                            }
                            alt={colorName}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <span className="inline-block rounded bg-gold px-1.5 py-0.5 text-[9px] font-bold text-ink uppercase tracking-wider">
                            Foto vinculada à cor
                          </span>
                          <div className="flex flex-wrap gap-2 pt-1 text-[11px]">
                            <button
                              type="button"
                              onClick={() => {
                                if (isNew) {
                                  startCropPending(assignedImage as PendingImage)
                                } else {
                                  startCropExisting(assignedImage as ProductImageRow)
                                }
                              }}
                              className="text-gold hover:underline font-medium inline-flex items-center gap-1"
                            >
                              <IconCrop className="w-3 h-3" />
                              Cortar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleTriggerUploadForColor(colorName)}
                              className="text-paper/80 hover:text-gold hover:underline"
                            >
                              Substituir
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleAssignColorToImage(assignedImage, null)}
                              className="text-mute hover:text-red-400 hover:underline"
                            >
                              Desvincular
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2 rounded border border-dashed border-white/20 bg-ink-2 p-2.5 text-center">
                        <p className="text-[11px] text-mute">Nenhuma foto específica para {colorName}</p>
                        <button
                          type="button"
                          onClick={() => handleTriggerUploadForColor(colorName)}
                          className="inline-flex items-center justify-center gap-1.5 rounded border border-gold/50 bg-gold/10 px-3 py-1.5 text-xs text-gold hover:bg-gold hover:text-ink transition font-medium cursor-pointer"
                        >
                          <IconFolder className="w-3.5 h-3.5" />
                          + Adicionar Foto para {colorName}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      <label className="flex items-center gap-3 text-sm">
        <input
          type="checkbox"
          checked={form.track_stock}
          onChange={(e) => setForm({ ...form, track_stock: e.target.checked })}
        />
        Controlar estoque
      </label>
      {form.track_stock && (
        <label className="block text-xs uppercase tracking-[0.2em]">
          Estoque
          <input
            type="number"
            min={0}
            className="mt-2 min-h-11 w-full border border-white/15 bg-ink-2 px-3 text-sm"
            value={form.stock ?? 0}
            onChange={(e) => setForm({ ...form, stock: Math.max(0, Number(e.target.value)) })}
          />
        </label>
      )}

      <div className="grid gap-3 text-sm">
        <Check label="Disponível" checked={form.available} onChange={(v) => setForm({ ...form, available: v })} />
        <Check label="Publicado" checked={form.published} onChange={(v) => setForm({ ...form, published: v })} />
        <Check label="Lançamento" checked={form.is_launch} onChange={(v) => setForm({ ...form, is_launch: v })} />
        <Check label="Destaque" checked={form.is_featured} onChange={(v) => setForm({ ...form, is_featured: v })} />
        <Check label="Promoção" checked={form.is_promo} onChange={(v) => setForm({ ...form, is_promo: v })} />
        <Check label="Arquivado" checked={form.archived} onChange={(v) => setForm({ ...form, archived: v })} />
      </div>

      {form.is_promo && (
        <label className="block text-xs uppercase tracking-[0.2em]">
          Preço promocional (R$)
          <input
            className="mt-2 min-h-11 w-full border border-white/15 bg-ink-2 px-3 text-sm"
            value={promo}
            onChange={(e) => setPromo(e.target.value)}
            placeholder="99,90"
          />
        </label>
      )}

      {/* SEÇÃO DE FOTOGRAFIAS DO PRODUTO */}
      <section className="border border-white/10 bg-ink-2 p-5 rounded-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="font-display text-2xl text-paper">Fotografias do Produto</h2>
            <p className="text-xs text-mute mt-0.5">
              {totalImagesCount} de {MAX_IMAGES_PER_PRODUCT} imagens cadastradas.
            </p>
          </div>

          {/* Abas de Escolha: Local vs Link */}
          <div className="flex rounded border border-white/15 bg-ink p-1">
            <button
              type="button"
              onClick={() => setImageTab('local')}
              className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs rounded transition font-medium ${
                imageTab === 'local'
                  ? 'bg-gold text-ink font-semibold'
                  : 'text-mute hover:text-paper'
              }`}
            >
              <IconFolder className="w-3.5 h-3.5" />
              Armazenamento Local
            </button>
            <button
              type="button"
              onClick={() => setImageTab('link')}
              className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs rounded transition font-medium ${
                imageTab === 'link'
                  ? 'bg-gold text-ink font-semibold'
                  : 'text-mute hover:text-paper'
              }`}
            >
              <IconLink className="w-3.5 h-3.5" />
              Link / URL da Web
            </button>
          </div>
        </div>

        {/* ABA 1: Armazenamento Local (Computador ou Celular) */}
        {imageTab === 'local' && (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => void onUpload(e.target.files)}
            />
            {/* Input oculto para corte guiado direto de 1 arquivo */}
            <input
              ref={cropFileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onSelectFileToCrop}
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-white/20 hover:border-gold/60 bg-ink p-6 text-center cursor-pointer transition rounded group"
            >
              <div className="flex flex-col items-center justify-center gap-2">
                <IconFolder className="w-9 h-9 text-gold group-hover:scale-110 transition" />
                <p className="text-sm font-semibold text-paper group-hover:text-gold transition">
                  Clique aqui para escolher fotos do armazenamento local
                </p>
                <p className="text-xs text-mute max-w-md">
                  Selecione fotos do seu computador ou celular. As fotos são otimizadas e salvas diretamente no Supabase.
                </p>
                <span className="mt-1 inline-block rounded border border-gold/40 bg-gold/10 px-3 py-1 text-xs text-gold font-medium group-hover:bg-gold group-hover:text-ink transition">
                  Selecionar múltiplos arquivos do dispositivo
                </span>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => cropFileInputRef.current?.click()}
                className="inline-flex items-center gap-2 rounded border border-gold/50 bg-gold/10 px-4 py-2 text-xs font-semibold text-gold hover:bg-gold hover:text-ink transition shadow-sm"
              >
                <IconCrop className="w-4 h-4" />
                Escolher e Enquadrar Foto (Corte 3:4 Moda ou 1:1)
              </button>
            </div>

            {uploadingProgress && (
              <div className="mt-3 flex items-center gap-2 rounded border border-gold/30 bg-gold/5 p-3 text-xs text-gold animate-pulse">
                <span className="h-2 w-2 rounded-full bg-gold"></span>
                {uploadingProgress}
              </div>
            )}
          </div>
        )}

        {/* ABA 2: Link / URL da Internet */}
        {imageTab === 'link' && (
          <div className="space-y-3">
            <p className="text-xs text-mute">
              Cole o link direto de uma foto da internet ou compartilhe do Google Drive, Imgur, Pinterest ou Dropbox.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="url"
                value={imageUrlInput}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="Exemplo: https://drive.google.com/file/d/... ou https://..."
                className="min-h-11 flex-1 border border-white/15 bg-ink px-3 text-sm text-paper focus:border-gold focus:outline-none"
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={!imageUrlInput.trim() || pending}
                  onClick={onAddImageUrl}
                >
                  {pending ? 'Adicionando…' : '+ Adicionar'}
                </Button>
                <button
                  type="button"
                  disabled={!imageUrlInput.trim() || pending}
                  onClick={startCropLink}
                  className="inline-flex items-center gap-1.5 rounded border border-gold/50 bg-gold/10 px-3 py-2 text-xs font-semibold text-gold hover:bg-gold hover:text-ink transition disabled:opacity-40 disabled:pointer-events-none"
                >
                  <IconCrop className="w-4 h-4" />
                  Cortar & Adicionar
                </button>
              </div>
            </div>

            {/* Painel de Pré-visualização Instantânea do Link */}
            {imageUrlInput.trim() && (
              <div className="flex items-center gap-4 rounded border border-gold/30 bg-ink p-3">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded border border-white/20 bg-ink-2 flex items-center justify-center">
                  <img
                    src={normalizedUrl}
                    alt="Prévia do link"
                    className="h-full w-full object-cover"
                    onLoad={() => setUrlPreviewStatus('success')}
                    onError={() => setUrlPreviewStatus('error')}
                  />
                </div>
                <div className="text-xs space-y-1">
                  {isGoogleDriveLink && (
                    <p className="flex items-center gap-1.5 text-gold font-medium">
                      <IconCheck className="w-3.5 h-3.5 shrink-0 text-gold" />
                      Link do Google Drive detectado e ajustado para exibição direta!
                    </p>
                  )}
                  {urlPreviewStatus === 'loading' && (
                    <p className="text-mute">Verificando imagem no link…</p>
                  )}
                  {urlPreviewStatus === 'success' && (
                    <p className="flex items-center gap-1.5 text-gold font-medium">
                      <IconCheck className="w-3.5 h-3.5 shrink-0 text-gold" />
                      Imagem carregada e pronta para inclusão no produto.
                    </p>
                  )}
                  {urlPreviewStatus === 'error' && (
                    <p className="flex items-start gap-1.5 text-gold/90">
                      <IconInfo className="w-3.5 h-3.5 shrink-0 text-gold mt-0.5" />
                      A pré-visualização não carregou (pode exigir permissão pública), mas você pode adicioná-la mesmo assim.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Galeria de Fotos Existentes (Produto Salvo) */}
        {!isNew && product && product.images.length > 0 && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <p className="text-xs uppercase tracking-widest text-mute mb-3">Fotos cadastradas na nuvem:</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {product.images.map((img) => (
                <figure key={img.id} className="relative border border-white/15 bg-ink p-2 rounded flex flex-col justify-between">
                  <div className="relative aspect-square w-full overflow-hidden rounded bg-ink-2">
                    <img
                      src={img.public_url}
                      alt=""
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = 'https://placehold.co/400x400/151515/c9a24a?text=Foto+Indisponivel'
                      }}
                    />
                    {img.is_primary && (
                      <span className="absolute top-1 left-1 inline-flex items-center gap-1 rounded bg-gold px-1.5 py-0.5 text-[10px] font-bold text-ink">
                        <IconStar className="w-2.5 h-2.5" />
                        Principal
                      </span>
                    )}
                    {img.color && (
                      <span className="absolute top-1 right-1 inline-flex items-center gap-1 rounded bg-black/85 border border-gold/50 px-1.5 py-0.5 text-[9px] font-semibold text-gold shadow-sm backdrop-blur-xs">
                        <span
                          className="h-2 w-2 rounded-full border border-white/40"
                          style={{ backgroundColor: getColorHex(img.color) }}
                        />
                        {getColorName(img.color)}
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex flex-col gap-1.5 text-xs">
                    <button
                      type="button"
                      className="py-1 text-center font-medium text-gold hover:underline inline-flex items-center justify-center gap-1.5"
                      onClick={() => startCropExisting(img)}
                    >
                      <IconCrop className="w-3.5 h-3.5" />
                      Cortar / Enquadrar
                    </button>
                    {!img.is_primary && (
                      <button
                        type="button"
                        className="py-1 text-center font-medium text-paper/80 hover:text-gold hover:underline"
                        onClick={() =>
                          void setPrimaryImage(id!, img.id).then(async () => setProduct(await fetchAdminProduct(id!)))
                        }
                      >
                        Definir principal
                      </button>
                    )}
                    <button
                      type="button"
                      className="py-1 text-center text-mute hover:text-red-400 transition"
                      onClick={() =>
                        void deleteProductImage(img.id, img.path).then(async () =>
                          setProduct(await fetchAdminProduct(id!)),
                        )
                      }
                    >
                      Remover foto
                    </button>
                    {form.colors.length > 0 && (
                      <div className="pt-1 border-t border-white/10">
                        <label className="text-[10px] text-mute uppercase tracking-wider block text-left">
                          Vincular à Cor:
                          <select
                            value={img.color ? getColorName(img.color) : ''}
                            onChange={(e) => void handleAssignColorToImage(img, e.target.value)}
                            className="mt-1 w-full rounded border border-white/15 bg-ink-2 px-1.5 py-1 text-[11px] text-paper focus:border-gold focus:outline-none"
                          >
                            <option value="">Foto Geral (sem cor)</option>
                            {form.colors.map((c) => {
                              const cName = getColorName(c)
                              return (
                                <option key={c} value={cName}>
                                  Cor: {cName}
                                </option>
                              )
                            })}
                          </select>
                        </label>
                      </div>
                    )}
                  </div>
                </figure>
              ))}
            </div>
          </div>
        )}

        {/* Galeria de Fotos Pendentes (Novo Produto sendo criado) */}
        {isNew && pendingNewImages.length > 0 && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <p className="text-xs uppercase tracking-widest text-mute mb-3">Fotos que serão salvas com o produto:</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {pendingNewImages.map((img) => (
                <figure key={img.id} className="relative border border-white/15 bg-ink p-2 rounded flex flex-col justify-between">
                  <div className="relative aspect-square w-full overflow-hidden rounded bg-ink-2">
                    <img src={img.preview} alt="" className="h-full w-full object-cover" />
                    {img.is_primary && (
                      <span className="absolute top-1 left-1 inline-flex items-center gap-1 rounded bg-gold px-1.5 py-0.5 text-[10px] font-bold text-ink">
                        <IconStar className="w-2.5 h-2.5" />
                        Principal
                      </span>
                    )}
                    {img.color && (
                      <span className="absolute top-1 right-1 inline-flex items-center gap-1 rounded bg-black/85 border border-gold/50 px-1.5 py-0.5 text-[9px] font-semibold text-gold shadow-sm backdrop-blur-xs">
                        <span
                          className="h-2 w-2 rounded-full border border-white/40"
                          style={{ backgroundColor: getColorHex(img.color) }}
                        />
                        {getColorName(img.color)}
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex flex-col gap-1.5 text-xs">
                    <button
                      type="button"
                      className="py-1 text-center font-medium text-gold hover:underline inline-flex items-center justify-center gap-1.5"
                      onClick={() => startCropPending(img)}
                    >
                      <IconCrop className="w-3.5 h-3.5" />
                      Cortar / Enquadrar
                    </button>
                    {!img.is_primary && (
                      <button
                        type="button"
                        className="py-1 text-center font-medium text-paper/80 hover:text-gold hover:underline"
                        onClick={() => handleSetPrimaryPending(img.id)}
                      >
                        Definir principal
                      </button>
                    )}
                    <button
                      type="button"
                      className="py-1 text-center text-mute hover:text-red-400 transition"
                      onClick={() => handleRemovePending(img.id)}
                    >
                      Remover
                    </button>
                    {form.colors.length > 0 && (
                      <div className="pt-1 border-t border-white/10">
                        <label className="text-[10px] text-mute uppercase tracking-wider block text-left">
                          Vincular à Cor:
                          <select
                            value={img.color ? getColorName(img.color) : ''}
                            onChange={(e) => void handleAssignColorToImage(img, e.target.value)}
                            className="mt-1 w-full rounded border border-white/15 bg-ink-2 px-1.5 py-1 text-[11px] text-paper focus:border-gold focus:outline-none"
                          >
                            <option value="">Foto Geral (sem cor)</option>
                            {form.colors.map((c) => {
                              const cName = getColorName(c)
                              return (
                                <option key={c} value={cName}>
                                  Cor: {cName}
                                </option>
                              )
                            })}
                          </select>
                        </label>
                      </div>
                    )}
                  </div>
                </figure>
              ))}
            </div>
          </div>
        )}
      </section>

      {error && <p className="text-sm text-gold">{error}</p>}
      {success && <p className="text-sm text-green-400 font-medium">{success}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? 'Salvando…' : 'Salvar Alterações'}
      </Button>

      <ImageCropModal
        isOpen={cropModalOpen}
        imageUrl={cropImageUrl}
        fileName={cropFileName}
        onClose={() => setCropModalOpen(false)}
        onConfirm={(cropped) => void onConfirmCrop(cropped)}
      />
    </form>
  )
}

function Check({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <label className="flex min-h-11 items-center gap-3">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  )
}

function ChipField({
  label,
  value,
  onValue,
  items,
  onAdd,
  onRemove,
}: {
  label: string
  value: string
  onValue: (v: string) => void
  items: string[]
  onAdd: () => void
  onRemove: (item: string) => void
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.2em]">{label}</p>
      <div className="mt-2 flex gap-2">
        <input
          className="min-h-11 flex-1 border border-white/15 bg-ink-2 px-3 text-sm focus:border-gold focus:outline-none"
          value={value}
          onChange={(e) => onValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              onAdd()
            }
          }}
          placeholder="Digite e pressione Enter"
        />
        <Button type="button" variant="outline" onClick={onAdd}>
          Adicionar
        </Button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((item) => (
          <button
            key={item}
            type="button"
            className="min-h-11 border border-gold px-3 text-xs text-gold"
            onClick={() => onRemove(item)}
          >
            {item} ×
          </button>
        ))}
      </div>
    </div>
  )
}
