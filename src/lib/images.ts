import { isSupabaseConfigured, PRODUCT_IMAGES_BUCKET, supabase } from './supabase'

export function normalizeImageUrl(inputUrl: string): string {
  if (!inputUrl) return ''
  let url = inputUrl.trim()

  // Google Drive
  // Format: https://drive.google.com/file/d/{id}/view... or https://drive.google.com/open?id={id}
  const driveMatch = url.match(/drive\.google\.com\/(?:file\/d\/|open\?id=)([a-zA-Z0-9_-]+)/)
  if (driveMatch) {
    return `https://lh3.googleusercontent.com/d/${driveMatch[1]}`
  }

  // Dropbox
  if (url.includes('dropbox.com') && url.includes('dl=0')) {
    return url.replace('dl=0', 'raw=1')
  }

  // Imgur
  const imgurMatch = url.match(/imgur\.com\/([a-zA-Z0-9]+)$/)
  if (imgurMatch) {
    return `https://i.imgur.com/${imgurMatch[1]}.jpg`
  }

  // Add https:// if protocol is missing
  if (url.startsWith('//')) {
    url = 'https:' + url
  } else if (!/^https?:\/\//i.test(url) && !url.startsWith('data:') && !url.startsWith('blob:')) {
    url = 'https://' + url
  }

  return url
}

export function isAllowedImageUrl(url: string): boolean {
  if (!url) return false
  if (url.startsWith('data:image/') || url.startsWith('blob:')) return true
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:'
  } catch {
    return false
  }
}

export function validateImageFile(file: File): string | null {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif', 'image/heic']
  if (!file.type.startsWith('image/') && !allowed.includes(file.type)) {
    return 'Por favor, selecione um arquivo de imagem válido (JPG, PNG, WEBP).'
  }
  // Up to 25 MB before client-side optimization
  if (file.size > 25 * 1024 * 1024) {
    return 'O arquivo é muito grande. Escolha uma imagem de até 25 MB.'
  }
  return null
}

export async function optimizeImageFile(file: File, maxDim = 1600, quality = 0.85): Promise<File> {
  // If already under 1.5MB and modern web format, no need to re-encode
  if (file.size <= 1.5 * 1024 * 1024 && ['image/jpeg', 'image/webp'].includes(file.type)) {
    return file
  }
  if (typeof window === 'undefined') return file

  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        let width = img.width
        let height = img.height
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width)
            width = maxDim
          } else {
            width = Math.round((width * maxDim) / height)
            height = maxDim
          }
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(file)
          return
        }
        ctx.drawImage(img, 0, 0, width, height)
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file)
              return
            }
            const cleanName = file.name.replace(/\.[^.]+$/, '') + '.webp'
            const optimized = new File([blob], cleanName, {
              type: 'image/webp',
              lastModified: Date.now(),
            })
            resolve(optimized)
          },
          'image/webp',
          quality,
        )
      }
      img.onerror = () => resolve(file)
      img.src = e.target?.result as string
    }
    reader.onerror = () => resolve(file)
    reader.readAsDataURL(file)
  })
}

export function publicImageUrl(path: string): string {
  if (!path) return ''
  if (
    path.startsWith('data:image/') ||
    path.startsWith('blob:') ||
    path.startsWith('http://') ||
    path.startsWith('https://')
  ) {
    return normalizeImageUrl(path)
  }
  if (!isSupabaseConfigured || !supabase) {
    return path
  }
  const { data } = supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(path)
  return data.publicUrl
}

export async function uploadProductImage(productId: string, file: File): Promise<string> {
  const error = validateImageFile(file)
  if (error) throw new Error(error)
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase não conectado.')
  }
  const readyFile = await optimizeImageFile(file)
  const ext = readyFile.type.split('/')[1] === 'jpeg' ? 'jpg' : readyFile.type.split('/')[1] || 'webp'
  const path = `${productId}/${crypto.randomUUID()}.${ext}`
  const { error: uploadError } = await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .upload(path, readyFile, {
      cacheControl: '3600',
      upsert: false,
      contentType: readyFile.type,
    })
  if (uploadError) throw new Error('Não foi possível enviar a imagem para o Supabase: ' + uploadError.message)
  return path
}

export async function removeStoragePath(path: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) return
  const { error } = await supabase.storage.from(PRODUCT_IMAGES_BUCKET).remove([path])
  if (error) console.warn('Aviso: Não foi possível remover arquivo antigo do bucket:', path)
}
