import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const DEFAULT_URL = 'https://lkdlrevjezauvvugxkpr.supabase.co'
const DEFAULT_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxrZGxyZXZqZXphdXZ2dWd4a3ByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIwMjA4MzUsImV4cCI6MjEwNzU5NjgzNX0.UuenJGJotlfcWhfe5LANH90_SlhJzTYAE0dpNDJmqAg'

const envUrl = import.meta.env.VITE_SUPABASE_URL?.trim()
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

const url = (envUrl && envUrl.startsWith('https://') && !envUrl.includes('SEU-PROJETO')) ? envUrl : DEFAULT_URL
const anonKey = (envKey && envKey.length > 20 && !envKey.includes('SUBSTITUA')) ? envKey : DEFAULT_KEY

export const isSupabaseConfigured =
  url.startsWith('https://') && anonKey.length > 20

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'sh-boutique-auth',
      },
    })
  : null

export const PRODUCT_IMAGES_BUCKET = 'product-images'

export function requireSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error('Supabase não configurado.')
  }
  return supabase
}
