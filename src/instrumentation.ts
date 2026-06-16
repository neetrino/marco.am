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

  scheduleStorefrontListingWarmup();
}

function scheduleStorefrontListingWarmup(): void {
  if (process.env.HOME_CACHE_WARMUP === 'false' && process.env.CACHE_WARM_ON_START !== '1') {
    return;
  }

  const delayMs = Number(process.env.HOME_CACHE_WARMUP_DELAY_MS ?? '2000');
  const safeDelay = Number.isFinite(delayMs) && delayMs >= 0 ? delayMs : 2000;

  globalThis.setTimeout(() => {
    void import('./lib/cache/trigger-storefront-listing-warmup').then((mod) =>
      mod.triggerStorefrontListingWarmupRequest(),
    );
  }, safeDelay);
}
