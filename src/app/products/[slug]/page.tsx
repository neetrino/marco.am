import { Suspense } from 'react';
import { cookies } from 'next/headers';

import {
  LANGUAGE_PREFERENCE_KEY,
  parseLanguageFromServer,
  type LanguageCode,
} from '@/lib/language';
import { normalizePdpSlug } from '@/lib/product-pdp/pdp-slug';

import { ProductPdpDetailStream } from './ProductPdpDetailStream';
import { ProductSlugLayoutClient } from './ProductSlugLayoutClient';

type PageProps = {
  params: Promise<{ slug: string }>;
};

/**
 * PDP page slot — paints the interactive shell from the client seed (instant, taking over the
 * `loading.tsx` fallback) and streams heavy detail into React Query.
 */
export default async function ProductPage({ params }: PageProps) {
  const { slug: slugParam } = await params;
  const cookieStore = await cookies();
  const serverLanguage: LanguageCode =
    parseLanguageFromServer(cookieStore.get(LANGUAGE_PREFERENCE_KEY)?.value) ?? 'en';
  const baseSlug = normalizePdpSlug(slugParam);

  return (
    <>
      <ProductSlugLayoutClient
        slugParam={slugParam}
        serverLanguage={serverLanguage}
        initialVisual={null}
      />
      <Suspense fallback={null}>
        <ProductPdpDetailStream baseSlug={baseSlug} serverLanguage={serverLanguage} />
      </Suspense>
    </>
  );
}
