/**
 * When true, pass `unoptimized` to `next/image` so the browser loads `src` directly.
 * - Absolute URLs (R2, CDN): avoids `/_next/image` 400 when remote allowlist / fetch differs by environment.
 * - `/assets/hero/*`: avoids optimizer 404 for static hero rasters on some deployments.
 */
export function shouldBypassNextImageOptimizer(src: string): boolean {
  if (src.startsWith('http://') || src.startsWith('https://')) {
    return true;
  }
  return src.startsWith('/assets/hero/');
}
