/** Errores de red transitorios (proxy, VPN, Wi‑Fi) al usar fetch / Supabase */
export function isRetryableFetchError(err: unknown): boolean {
  if (!err) return false;
  const msg = String(
    (err as { message?: string })?.message ??
      (err as { details?: string })?.details ??
      err
  ).toLowerCase();
  return (
    msg.includes("failed to fetch") ||
    msg.includes("network") ||
    msg.includes("proxy") ||
    msg.includes("err_proxy") ||
    msg.includes("timeout") ||
    msg.includes("aborted")
  );
}

export async function withNetworkRetry<T>(
  fn: () => Promise<T>,
  options?: { attempts?: number; baseDelayMs?: number }
): Promise<T> {
  const attempts = options?.attempts ?? 3;
  const baseDelayMs = options?.baseDelayMs ?? 400;
  let lastError: unknown;

  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const canRetry = i < attempts - 1 && isRetryableFetchError(err);
      if (!canRetry) break;
      await new Promise((r) => setTimeout(r, baseDelayMs * (i + 1)));
    }
  }

  throw lastError;
}
