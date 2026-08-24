export type Role = 'user' | 'admin'

export interface UserSession {
  id: string
  email: string
  username: string
  role: Role
}

/** Forma compatible con el user de Supabase Auth que usa el renderer. */
export interface AuthUser {
  id: string
  email: string
}

export interface AppConfigState {
  dataPath: string | null
  dbReady: boolean
  version: string
  hasAdminCode: boolean
}

export type DbFilter =
  | { type: 'eq'; column: string; value: unknown }
  | { type: 'neq'; column: string; value: unknown }
  | { type: 'in'; column: string; value: unknown[] }
  | { type: 'is'; column: string; value: null }
  | { type: 'ilike'; column: string; value: string }
  | { type: 'lt'; column: string; value: unknown }
  | { type: 'lte'; column: string; value: unknown }
  | { type: 'gt'; column: string; value: unknown }
  | { type: 'gte'; column: string; value: unknown }
  | { type: 'not_is'; column: string; value: null }
  | { type: 'not_eq'; column: string; value: unknown }

export type DbOrder = { column: string; ascending: boolean }

export type DbAction = 'select' | 'insert' | 'update' | 'delete' | 'upsert'

export interface DbRequest {
  table: string
  action: DbAction
  select?: string
  filters?: DbFilter[]
  order?: DbOrder[]
  data?: Record<string, unknown> | Record<string, unknown>[]
  onConflict?: string
  limit?: number
  offset?: number
  /** Tras insert/update/upsert/delete, devolver filas (Prefer: return=representation). */
  returning?: boolean
}

export interface DbResponse {
  data: unknown
  error: { message: string } | null
}

export interface DocumentoItem {
  name: string
  size: number
  updatedAt: string
}
