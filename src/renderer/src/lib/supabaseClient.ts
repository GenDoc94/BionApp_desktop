/**
 * Cliente compatible con el subset de supabase-js que usa BionApp,
 * respaldado por SQLite vía IPC (Electron main).
 */
import type { DbAction, DbFilter, DbOrder, DbRequest } from '@shared/types'

type ThenResult = { data: unknown; error: { message: string; status?: number } | null }

class QueryBuilder implements PromiseLike<ThenResult> {
  private table: string
  private action: DbAction = 'select'
  private selectClause = '*'
  private filters: DbFilter[] = []
  private orderClauses: DbOrder[] = []
  private payload: Record<string, unknown> | Record<string, unknown>[] | undefined
  private onConflict: string | undefined

  constructor(table: string) {
    this.table = table
  }

  select(columns = '*'): this {
    this.action = 'select'
    this.selectClause = columns
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

  order(column: string, opts?: { ascending?: boolean }): this {
    this.orderClauses.push({ column, ascending: opts?.ascending !== false })
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
      onConflict: this.onConflict
    }
  }

  then<TResult1 = ThenResult, TResult2 = never>(
    onfulfilled?: ((value: ThenResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return window.api.dbRequest(this.buildRequest()).then(
      (res) => {
        const result: ThenResult = {
          data: res.data,
          error: res.error
        }
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
