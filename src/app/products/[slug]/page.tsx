import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';

import {
  LANGUAGE_PREFERENCE_KEY,
  parseLanguageFromServer,
  type LanguageCode,
} from '@/lib/language';
import { getErrorHttpStatus } from '@/lib/api-client';
import { getCachedPdpExists, getCachedPdpVisual } from '@/lib/product-pdp/pdp-server-cache';

import { ProductPageClient } from './ProductPageClient';
import { ProductPdpDetailStream } from './ProductPdpDetailStream';

type PageProps = {
  params: Promise<{ slug: string }>;
};

const PDP_VISUAL_SERVER_TIMEOUT_MS = 600;

function baseSlugFromParam(slugParam: string): string {
  const slugParts = slugParam.includes(':') ? slugParam.split(':') : [slugParam];
  return slugParts[0] ?? slugParam;
}

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
      notFound();
    }
    throw error;
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}

/**
 * PDP — visual first paint; heavy detail streams in a second chunk.
 * Related products are intentionally deferred to client/background to avoid
 * blocking the critical route render path.
 */
export default async function ProductPage({ params }: PageProps) {
  const { slug: slugParam } = await params;
  const cookieStore = await cookies();
  const requestHeaders = await headers();
  const serverLanguage: LanguageCode =
    parseLanguageFromServer(cookieStore.get(LANGUAGE_PREFERENCE_KEY)?.value) ?? 'en';
  const isRscNavigationRequest = requestHeaders.get('rsc') === '1';

  const baseSlug = baseSlugFromParam(slugParam);
  const exists = await getCachedPdpExists(baseSlug);
  if (!exists) {
    notFound();
  }

  let initialVisual = null;

  if (!isRscNavigationRequest) {
    initialVisual = await withTimeout(
      getCachedPdpVisual(baseSlug, serverLanguage),
      PDP_VISUAL_SERVER_TIMEOUT_MS,
    );
  }

  return (
    <>
      <ProductPageClient
        slugParam={slugParam}
        serverLanguage={serverLanguage}
        initialVisual={initialVisual}
        initialProduct={null}
        initialRelatedProducts={null}
      />
      {!isRscNavigationRequest ? (
        <Suspense fallback={null}>
          <ProductPdpDetailStream baseSlug={baseSlug} serverLanguage={serverLanguage} />
        </Suspense>
      ) : null}
    </>
  );
}
