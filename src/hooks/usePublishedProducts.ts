import { useEffect, useState } from 'react'
import { fetchPublishedProducts } from '../lib/products'
import type { Product } from '../types/product'

export function usePublishedProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    fetchPublishedProducts()
      .then((data) => {
        if (active) setProducts(data)
      })
      .catch(() => {
        if (active) setError('Não foi possível carregar o catálogo.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  return { products, loading, error }
}
