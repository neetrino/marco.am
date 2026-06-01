import { Suspense } from 'react';
import { cookies } from 'next/headers';

import {
  LANGUAGE_PREFERENCE_KEY,
  parseLanguageFromServer,
  type LanguageCode,
} from '@/lib/language';
import { getCachedPdpVisual } from '@/lib/product-pdp/pdp-server-cache';

import { ProductPageClient } from './ProductPageClient';
import { ProductPdpDetailStream } from './ProductPdpDetailStream';

type PageProps = {
  params: Promise<{ slug: string }>;
};

function baseSlugFromParam(slugParam: string): string {
  const slugParts = slugParam.includes(':') ? slugParam.split(':') : [slugParam];
  return slugParts[0] ?? slugParam;
}

/**
 * PDP — visual SSR for instant gallery; detail streams in a second chunk; related loads client-side.
 */
export default async function ProductPage({ params }: PageProps) {
  const { slug: slugParam } = await params;
  const cookieStore = await cookies();
  const serverLanguage: LanguageCode =
    parseLanguageFromServer(cookieStore.get(LANGUAGE_PREFERENCE_KEY)?.value) ?? 'en';

  const baseSlug = baseSlugFromParam(slugParam);

  let initialVisual = null;
  try {
    initialVisual = await getCachedPdpVisual(baseSlug, serverLanguage);
  } catch {
    initialVisual = null;
  }

  return (
    <>
      <ProductPageClient
        slugParam={slugParam}
        serverLanguage={serverLanguage}
        initialVisual={initialVisual}
        initialProduct={null}
      />
      <Suspense fallback={null}>
        <ProductPdpDetailStream baseSlug={baseSlug} serverLanguage={serverLanguage} />
      </Suspense>
    </>
  );
}
