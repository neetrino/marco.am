import { notFound } from 'next/navigation';

import type { LanguageCode } from '@/lib/language';
import { getCachedPdpDetail } from '@/lib/product-pdp/pdp-server-cache';

type ProductPdpLayoutGateProps = {
  readonly baseSlug: string;
  readonly serverLanguage: LanguageCode;
};

function isNotFoundError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    (error as { status: unknown }).status === 404
  );
}

/**
 * Early 404 reusing the shared PDP detail fetch — deduped with the SSR seed (one DB query per
 * load) and wrapped in `<Suspense>` so it never blocks gallery paint.
 */
export async function ProductPdpLayoutGate({ baseSlug, serverLanguage }: ProductPdpLayoutGateProps) {
  try {
    await getCachedPdpDetail(baseSlug, serverLanguage);
  } catch (error) {
    if (isNotFoundError(error)) {
      notFound();
    }
    throw error;
  }

  return null;
}
