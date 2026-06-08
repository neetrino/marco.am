/**
 * When true, pass `unoptimized` to `next/image` so the browser loads `src` directly.
 * Known storefront hosts (marco.am) use the optimizer in production for WebP/AVIF + sizing.
 */
import { isStorefrontImageOptimizerHost } from '@/lib/constants/storefront-image-hosts';

export function shouldBypassNextImageOptimizer(src: string): boolean {
  if (src.startsWith('/assets/hero/')) {
    return true;
  }
  if (src.startsWith('http://') || src.startsWith('https://')) {
    try {
      const hostname = new URL(src).hostname;
      if (isStorefrontImageOptimizerHost(hostname)) {
        return false;
      }
    } catch {
      return true;
    }
    return true;
  }
  return false;
}
