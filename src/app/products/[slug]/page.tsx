import { cookies } from 'next/headers';

import { ProductPageClient } from './ProductPageClient';
import {
  LANGUAGE_PREFERENCE_KEY,
  parseLanguageFromServer,
  type LanguageCode,
} from '@/lib/language';
import { productsService } from '@/lib/services/products.service';

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ProductPage({ params }: PageProps) {
  const { slug: slugParam } = await params;
  const cookieStore = await cookies();
  const serverLanguage: LanguageCode =
    parseLanguageFromServer(cookieStore.get(LANGUAGE_PREFERENCE_KEY)?.value) ?? 'en';

  const slugParts = slugParam.includes(':') ? slugParam.split(':') : [slugParam];
  const baseSlug = slugParts[0] ?? slugParam;

  let initialVisual = null;
  try {
    initialVisual = await productsService.findBySlugVisual(baseSlug, serverLanguage);
  } catch {
    // Client will refetch (e.g. cache miss or slug only valid on full PDP).
  }

  return (
    <ProductPageClient
      slugParam={slugParam}
      serverLanguage={serverLanguage}
      initialVisual={initialVisual}
    />
  );
}
