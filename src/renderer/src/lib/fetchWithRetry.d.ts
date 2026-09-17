/** Errores de red transitorios (proxy, VPN, Wi‑Fi) al usar fetch / Supabase */
export declare function isRetryableFetchError(err: unknown): boolean;
export declare function withNetworkRetry<T>(fn: () => Promise<T>, options?: {
    attempts?: number;
    baseDelayMs?: number;
}): Promise<T>;
