export type FiltroRow = {
  NumFiltro: number
  FechaColoc: string | null
  FechaRetir: string | null
}

export function todayIsoDate(now = new Date()): string {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, "0")
  const d = String(now.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

export function parseIsoDate(value: unknown): string | null {
  const raw = String(value ?? "").trim()
  if (!raw) return null
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`
  const dmy = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (dmy) {
    const d = Number(dmy[1])
    const m = Number(dmy[2])
    const y = Number(dmy[3])
    if (m < 1 || m > 12 || d < 1 || d > 31) return null
    return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`
  }
  return null
}

export function formatIsoDateDisplay(value: unknown): string {
  const iso = parseIsoDate(value)
  if (!iso) return "—"
  const [y, m, d] = iso.split("-")
  return `${d}/${m}/${y}`
}

function utcDay(iso: string): number | null {
  const parsed = parseIsoDate(iso)
  if (!parsed) return null
  const [y, m, d] = parsed.split("-").map(Number)
  return Date.UTC(y, m - 1, d)
}

export function daysBetweenIso(from: unknown, to: unknown): number | null {
  const a = utcDay(String(from ?? ""))
  const b = utcDay(String(to ?? ""))
  if (a == null || b == null) return null
  return Math.round((b - a) / 86_400_000)
}

export const FILTRO_INTERVAL_MONTHS = 3

/** Suma meses civiles; si el día no existe en el mes destino, usa el último día de ese mes. */
export function addMonthsIso(value: unknown, months: number): string | null {
  const iso = parseIsoDate(value)
  if (!iso) return null
  const [y, m, d] = iso.split("-").map(Number)
  const monthIndex = m - 1 + months
  const year = y + Math.floor(monthIndex / 12)
  const month = ((monthIndex % 12) + 12) % 12
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
  const day = Math.min(d, lastDay)
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
}

export function nextFiltroDueDate(fechaColoc: unknown): string | null {
  return addMonthsIso(fechaColoc, FILTRO_INTERVAL_MONTHS)
}

export function sortFiltros(rows: FiltroRow[]): FiltroRow[] {
  return [...rows].sort((a, b) => a.NumFiltro - b.NumFiltro)
}

export function nextNumFiltro(rows: FiltroRow[]): number {
  return rows.reduce((max, row) => Math.max(max, Number(row.NumFiltro) || 0), 0) + 1
}

export function openFiltro(rows: FiltroRow[]): FiltroRow | null {
  const open = sortFiltros(rows).filter((row) => !parseIsoDate(row.FechaRetir))
  return open.at(-1) ?? null
}

export type FiltroChangePlan =
  | { ok: true; close: FiltroRow | null; insert: FiltroRow }
  | { ok: false; error: "invalidDate" | "beforeCurrent" }

export function planFilterChange(rows: FiltroRow[], colocRaw: unknown): FiltroChangePlan {
  const coloc = parseIsoDate(colocRaw)
  if (!coloc) return { ok: false, error: "invalidDate" }
  const current = openFiltro(rows)
  if (current?.FechaColoc) {
    const delta = daysBetweenIso(current.FechaColoc, coloc)
    if (delta != null && delta < 0) return { ok: false, error: "beforeCurrent" }
  }
  const close =
    current == null
      ? null
      : {
          ...current,
          FechaRetir: coloc,
        }
  return {
    ok: true,
    close,
    insert: {
      NumFiltro: nextNumFiltro(rows),
      FechaColoc: coloc,
      FechaRetir: null,
    },
  }
}

export type FiltroStats = {
  total: number
  changes: number
  avgDays: number | null
  currentDays: number | null
}

export function filtroStats(rows: FiltroRow[], today = todayIsoDate()): FiltroStats {
  const sorted = sortFiltros(rows)
  const completedDays = sorted
    .map((row) =>
      parseIsoDate(row.FechaColoc) && parseIsoDate(row.FechaRetir)
        ? daysBetweenIso(row.FechaColoc, row.FechaRetir)
        : null
    )
    .filter((n): n is number => n != null && n >= 0)
  const avgDays =
    completedDays.length === 0
      ? null
      : completedDays.reduce((sum, n) => sum + n, 0) / completedDays.length
  const current = openFiltro(sorted)
  const currentDays =
    current?.FechaColoc && !parseIsoDate(current.FechaRetir)
      ? daysBetweenIso(current.FechaColoc, today)
      : null
  return {
    total: sorted.length,
    changes: completedDays.length,
    avgDays,
    currentDays,
  }
}

export function toFiltroRow(row: Record<string, unknown>): FiltroRow | null {
  const num = Number(row.NumFiltro)
  if (!Number.isFinite(num)) return null
  return {
    NumFiltro: num,
    FechaColoc: parseIsoDate(row.FechaColoc),
    FechaRetir: parseIsoDate(row.FechaRetir),
  }
}
