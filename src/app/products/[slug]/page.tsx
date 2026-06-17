import { Suspense } from 'react';
import { cookies } from 'next/headers';

import {
  LANGUAGE_PREFERENCE_KEY,
  parseLanguageFromServer,
  type LanguageCode,
} from '@/lib/language';
import { normalizePdpSlug } from '@/lib/product-pdp/pdp-slug';

import { ProductPdpSSRSeed } from './ProductPdpSSRSeed';

type PageProps = {
  params: Promise<{ slug: string }>;
};

/** Page slot — SSR cache seed only; UI lives in layout `ProductSlugLayoutClient`. */
export default async function ProductPage({ params }: PageProps) {
  const { slug: slugParam } = await params;
  const cookieStore = await cookies();
  const serverLanguage: LanguageCode =
    parseLanguageFromServer(cookieStore.get(LANGUAGE_PREFERENCE_KEY)?.value) ?? 'en';
  const baseSlug = normalizePdpSlug(slugParam);

  return (
    <Suspense fallback={null}>
      <ProductPdpSSRSeed baseSlug={baseSlug} serverLanguage={serverLanguage} />
    </Suspense>
  );
}
