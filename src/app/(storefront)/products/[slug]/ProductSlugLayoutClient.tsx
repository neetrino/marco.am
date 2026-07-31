'use client';

import type { LanguageCode } from '@/lib/language';

import { ProductPageClient } from './ProductPageClient';

type ProductSlugLayoutClientProps = {
  slugParam: string;
  serverLanguage: LanguageCode;
};

/**
 * Persistent PDP UI — survives page-slot streaming so PLP → PDP never remounts the gallery.
 */
export function ProductSlugLayoutClient({
  slugParam,
  serverLanguage,
}: ProductSlugLayoutClientProps) {
  return <ProductPageClient slugParam={slugParam} serverLanguage={serverLanguage} />;
}
