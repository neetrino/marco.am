const WARMUP_ROUTE_PATH = '/api/v1/internal/warm-storefront-listing';

function resolveWarmupBaseUrl(): string {
  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) {
    return `https://${vercelUrl}`;
  }

  const port = process.env.PORT ?? '3000';
  return `http://127.0.0.1:${port}`;
}

/**
 * Loopback HTTP trigger so instrumentation never imports the Redis/ioredis dependency chain.
 */
export async function triggerStorefrontListingWarmupRequest(): Promise<void> {
  const secret = process.env.WARMUP_INTERNAL_SECRET?.trim();
  const headers: HeadersInit | undefined = secret ? { 'x-warmup-secret': secret } : undefined;

  try {
    await fetch(`${resolveWarmupBaseUrl()}${WARMUP_ROUTE_PATH}`, {
      method: 'POST',
      headers,
    });
  } catch {
    // Best-effort: server may still be accepting connections when instrumentation fires.
  }
}
