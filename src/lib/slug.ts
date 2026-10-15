export function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

export function uniqueSlug(name: string): string {
  const base = slugify(name) || 'produto'
  const suffix = crypto.randomUUID().slice(0, 8)
  return `${base}-${suffix}`
}
