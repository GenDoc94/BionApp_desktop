type ThenResult = {
    data: unknown;
    error: {
        message: string;
        status?: number;
    } | null;
};
declare class QueryBuilder implements PromiseLike<ThenResult> {
    private table;
    private action;
    private selectClause;
    private filters;
    private orderClauses;
    private payload;
    private onConflict;
    private rowMode;
    private limitN;
    private offsetN;
    private returning;
    constructor(table: string);
    select(columns?: string): this;
    insert(data: Record<string, unknown> | Record<string, unknown>[]): this;
    update(data: Record<string, unknown>): this;
    upsert(data: Record<string, unknown> | Record<string, unknown>[], opts?: {
        onConflict?: string;
    }): this;
    delete(): this;
    eq(column: string, value: unknown): this;
    neq(column: string, value: unknown): this;
    in(column: string, value: unknown[]): this;
    is(column: string, value: null): this;
    ilike(column: string, pattern: string): this;
    lt(column: string, value: unknown): this;
    lte(column: string, value: unknown): this;
    gt(column: string, value: unknown): this;
    gte(column: string, value: unknown): this;
    /** Equivale a varios `.eq()` (supabase `.match({ col: val })`). */
    match(values: Record<string, unknown>): this;
    /** Subconjunto de supabase `.not(column, operator, value)`. */
    not(column: string, operator: string, value: unknown): this;
    order(column: string, opts?: {
        ascending?: boolean;
    }): this;
    single(): this;
    maybeSingle(): this;
    limit(n: number): this;
    range(from: number, to: number): this;
    private buildRequest;
    private projectColumns;
    private shapeResult;
    then<TResult1 = ThenResult, TResult2 = never>(onfulfilled?: ((value: ThenResult) => TResult1 | PromiseLike<TResult1>) | null, onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null): Promise<TResult1 | TResult2>;
}
export declare const supabase: {
    from(table: string): QueryBuilder;
    auth: {
        signInWithPassword({ email, password }: {
            email: string;
            password: string;
        }): Promise<any>;
        signOut(): Promise<any>;
        getSession(): Promise<any>;
        getUser(): Promise<any>;
        onAuthStateChange(cb: (event: string, session: {
            user: unknown;
        } | null) => void): {
            data: {
                subscription: {
                    unsubscribe(): void;
                };
            };
        };
    };
    functions: {
        invoke(name: string, opts?: {
            method?: string;
            body?: unknown;
        }): Promise<{
            data: null;
            error: {
                message: string;
                context?: undefined;
            };
        } | {
            data: null;
            error: {
                message: any;
                context: {
                    json: () => Promise<{
                        error: any;
                    }>;
                };
            };
        } | {
            data: any;
            error: null;
        }>;
    };
};
export {};
