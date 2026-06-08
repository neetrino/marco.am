/**
 * Unique HTTPS origins for hero/product CDN preconnect hints.
 */
export function collectImageOrigins(urls: readonly string[]): string[] {
  const origins = new Set<string>();
  for (const raw of urls) {
    if (!raw.startsWith('http://') && !raw.startsWith('https://')) {
      continue;
    }
    try {
      origins.add(new URL(raw).origin);
    } catch {
      // Skip malformed URLs.
    }
  }
  return [...origins];
}
