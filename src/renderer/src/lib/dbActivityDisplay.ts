export function formatDbLastWrite(
  iso: string | null | undefined,
  locale: string
): string | null {
  const raw = String(iso ?? '').trim()
  if (!raw) return null
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return null
  const tag = locale.toLowerCase().startsWith('en') ? 'en-GB' : 'es-ES'
  return date.toLocaleString(tag, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
