/**
 * Next.js instrumentation — runs once per server cold start.
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === 'edge') {
    return;
  }

  const { reportJwtSecretConfiguration } = await import('./lib/config/jwt-secret-guard');
  reportJwtSecretConfiguration();

  if (process.env.NODE_ENV !== 'development') {
    return;
  }
  if (process.env.HOME_CACHE_WARMUP === 'false') {
    return;
  }

  const delayMs = Number(process.env.HOME_CACHE_WARMUP_DELAY_MS ?? '4000');
  if (!Number.isFinite(delayMs) || delayMs < 0) {
    return;
  }

  setTimeout(() => {
    void import('./lib/cache/warm-home-listing-cache')
      .then(({ warmHomeListingCache }) => warmHomeListingCache())
      .catch(() => {
        // Dev-only best-effort; DB may still be waking.
      });
  }, delayMs);
}
