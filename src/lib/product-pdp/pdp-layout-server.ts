import { getErrorHttpStatus } from '@/lib/api-client';
import { getCachedPdpVisual } from '@/lib/product-pdp/pdp-server-cache';
import type { PdpVisualPayload } from '@/lib/services/products-slug/product-transformer';
import type { LanguageCode } from '@/lib/language';
import { normalizePdpSlug } from '@/lib/product-pdp/pdp-slug';

const PDP_VISUAL_SERVER_TIMEOUT_MS = 600;

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T | null> {
  let timer: ReturnType<typeof setTimeout> | null = null;
  try {
    return await Promise.race<T | null>([
      promise,
      new Promise<null>((resolve) => {
        timer = setTimeout(() => resolve(null), timeoutMs);
      }),
    ]);
  } catch (error: unknown) {
    if (getErrorHttpStatus(error) === 404) {
      return null;
    }
    throw error;
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}

/** SSR visual payload for layout first paint (bounded wait). */
export async function fetchPdpLayoutVisual(
  slugParam: string,
  serverLanguage: LanguageCode,
): Promise<PdpVisualPayload | null> {
  const baseSlug = normalizePdpSlug(slugParam);
  if (!baseSlug) {
    return null;
  }

  return withTimeout(getCachedPdpVisual(baseSlug, serverLanguage), PDP_VISUAL_SERVER_TIMEOUT_MS);
}
