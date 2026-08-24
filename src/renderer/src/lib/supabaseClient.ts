/**
 * Cliente compatible con el subset de supabase-js que usa BionApp,
 * respaldado por SQLite vía IPC (Electron main).
 *
 * Métodos cubiertos (los que aparecen en el renderer):
 * from, select, insert, update, upsert, delete,
 * eq, neq, in, is, ilike, lt/lte/gt/gte, not, match,
 * order, limit, range, single, maybeSingle,
 * auth.*, functions.invoke('create-user')
 */
import type { DbAction, DbFilter, DbOrder, DbRequest } from '@shared/types'

type ThenResult = { data: unknown; error: { message: string; status?: number } | null }

const WRITE_ACTIONS = new Set<DbAction>(['insert', 'update', 'upsert', 'delete'])

class QueryBuilder implements PromiseLike<ThenResult> {
  private table: string
  private action: DbAction = 'select'
  private selectClause = '*'
  private filters: DbFilter[] = []
  private orderClauses: DbOrder[] = []
  private payload: Record<string, unknown> | Record<string, unknown>[] | undefined
  private onConflict: string | undefined
  private rowMode: 'many' | 'single' | 'maybeSingle' = 'many'
  private limitN: number | undefined
  private offsetN: number | undefined
  private returning = false

  constructor(table: string) {
    this.table = table
  }

  select(columns = '*'): this {
    this.selectClause = columns
    // Tras un write, .select() pide representación (no cambia la acción a SELECT).
    if (WRITE_ACTIONS.has(this.action)) {
      this.returning = true
      return this
    }
    this.action = 'select'
    return this
  }

  insert(data: Record<string, unknown> | Record<string, unknown>[]): this {
    this.action = 'insert'
    this.payload = data
    return this
  }

  update(data: Record<string, unknown>): this {
    this.action = 'update'
    this.payload = data
    return this
  }

  upsert(
    data: Record<string, unknown> | Record<string, unknown>[],
    opts?: { onConflict?: string }
  ): this {
    this.action = 'upsert'
    this.payload = data
    this.onConflict = opts?.onConflict
    return this
  }

  delete(): this {
    this.action = 'delete'
    return this
  }

  eq(column: string, value: unknown): this {
    this.filters.push({ type: 'eq', column, value })
    return this
  }

  neq(column: string, value: unknown): this {
    this.filters.push({ type: 'neq', column, value })
    return this
  }

  in(column: string, value: unknown[]): this {
    this.filters.push({ type: 'in', column, value })
    return this
  }

  is(column: string, value: null): this {
    this.filters.push({ type: 'is', column, value })
    return this
  }

  ilike(column: string, pattern: string): this {
    this.filters.push({ type: 'ilike', column, value: String(pattern) })
    return this
  }

  lt(column: string, value: unknown): this {
    this.filters.push({ type: 'lt', column, value })
    return this
  }

  lte(column: string, value: unknown): this {
    this.filters.push({ type: 'lte', column, value })
    return this
  }

  gt(column: string, value: unknown): this {
    this.filters.push({ type: 'gt', column, value })
    return this
  }

  gte(column: string, value: unknown): this {
    this.filters.push({ type: 'gte', column, value })
    return this
  }

  /** Equivale a varios `.eq()` (supabase `.match({ col: val })`). */
  match(values: Record<string, unknown>): this {
    for (const [column, value] of Object.entries(values)) {
      this.filters.push({ type: 'eq', column, value })
    }
    return this
  }

  /** Subconjunto de supabase `.not(column, operator, value)`. */
  not(column: string, operator: string, value: unknown): this {
    if (operator === 'is' && value === null) {
      this.filters.push({ type: 'not_is', column, value: null })
      return this
    }
    if (operator === 'eq') {
      this.filters.push({ type: 'not_eq', column, value })
      return this
    }
    throw new Error(`Operador .not no soportado: ${operator}`)
  }

  order(column: string, opts?: { ascending?: boolean }): this {
    this.orderClauses.push({ column, ascending: opts?.ascending !== false })
    return this
  }

  single(): this {
    this.rowMode = 'single'
    return this
  }

  maybeSingle(): this {
    this.rowMode = 'maybeSingle'
    return this
  }

  limit(n: number): this {
    this.limitN = n
    return this
  }

  range(from: number, to: number): this {
    this.offsetN = from
    this.limitN = to - from + 1
    return this
  }

  private buildRequest(): DbRequest {
    return {
      table: this.table,
      action: this.action,
      select: this.selectClause,
      filters: this.filters,
      order: this.orderClauses,
      data: this.payload,
      onConflict: this.onConflict,
      limit: this.limitN,
      offset: this.offsetN,
      returning: this.returning || WRITE_ACTIONS.has(this.action)
    }
  }

  private projectColumns(row: Record<string, unknown>): Record<string, unknown> {
    const raw = this.selectClause?.trim()
    if (!raw || raw === '*') return row
    // Ignorar embeds en proyección post-write; solo columnas simples
    const cols = raw
      .split(',')
      .map((c) => c.trim())
      .filter((c) => c && c !== '*' && !c.includes('('))
    if (!cols.length) return row
    const out: Record<string, unknown> = {}
    for (const c of cols) {
      if (c in row) out[c] = row[c]
    }
    return out
  }

  private shapeResult(res: { data: unknown; error: { message: string } | null }): ThenResult {
    if (res.error) return { data: res.data, error: res.error }

    let data = res.data
    if (WRITE_ACTIONS.has(this.action) && this.returning && this.selectClause !== '*') {
      if (Array.isArray(data)) {
        data = data.map((r) =>
          r && typeof r === 'object' ? this.projectColumns(r as Record<string, unknown>) : r
        )
      } else if (data && typeof data === 'object') {
        data = this.projectColumns(data as Record<string, unknown>)
      }
    }

    if (this.rowMode === 'many') return { data, error: null }

    const rows = Array.isArray(data) ? data : data == null ? [] : [data]
    if (this.rowMode === 'maybeSingle') {
      if (rows.length === 0) return { data: null, error: null }
      if (rows.length === 1) return { data: rows[0], error: null }
      return {
        data: null,
        error: { message: 'JSON object requested, multiple (or no) rows returned' }
      }
    }
    if (rows.length === 1) return { data: rows[0], error: null }
    return {
      data: null,
      error: { message: 'JSON object requested, multiple (or no) rows returned' }
    }
  }

  then<TResult1 = ThenResult, TResult2 = never>(
    onfulfilled?: ((value: ThenResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return window.api.dbRequest(this.buildRequest()).then(
      (res) => {
        const result = this.shapeResult(res)
        return onfulfilled ? onfulfilled(result) : (result as unknown as TResult1)
      },
      onrejected ?? undefined
    )
  }
}

const authListeners = new Set<(event: string, session: { user: unknown } | null) => void>()

if (typeof window !== 'undefined' && window.api?.onAuthState) {
  window.api.onAuthState((user) => {
    const session = user ? { user } : null
    for (const cb of authListeners) cb('AUTH', session)
  })
}

export const supabase = {
  from(table: string) {
    return new QueryBuilder(table)
  },

  auth: {
    async signInWithPassword({ email, password }: { email: string; password: string }) {
      return window.api.login(email, password)
    },
    async signOut() {
      return window.api.logout()
    },
    async getSession() {
      return window.api.getSession()
    },
    async getUser() {
      return window.api.getUser()
    },
    onAuthStateChange(cb: (event: string, session: { user: unknown } | null) => void) {
      authListeners.add(cb)
      void window.api.getSession().then((res: { data?: { session?: { user: unknown } | null } }) => {
        cb('INITIAL', res?.data?.session ?? null)
      })
      return {
        data: {
          subscription: {
            unsubscribe() {
              authListeners.delete(cb)
            }
          }
        }
      }
    }
  },

  functions: {
    async invoke(name: string, opts?: { method?: string; body?: unknown }) {
      if (name !== 'create-user') {
        return { data: null, error: { message: `Función no disponible en escritorio: ${name}` } }
      }
      const method = (opts?.method ?? 'POST').toUpperCase()
      const res = await window.api.createUserFn(method, opts?.body)
      if (res.error) {
        return {
          data: null,
          error: {
            message: res.error.message,
            context: { json: async () => ({ error: res.error.message }) }
          }
        }
      }
      return { data: res.data, error: null }
    }
  }
}
