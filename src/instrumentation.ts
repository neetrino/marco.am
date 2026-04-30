/**
 * Next.js instrumentation — runs once per server cold start.
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== 'nodejs') {
    return;
  }
  if (process.env.CACHE_WARM_ON_START !== '1') {
    return;
  }
  try {
    const { warmPublicShopCaches } = await import('@/lib/cache/cache-warm-boot');
    await warmPublicShopCaches();
  } catch {
    // Warm is best-effort; never block or crash boot
  }
}
