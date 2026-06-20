'use client';

import { useEffect, useRef, useState } from 'react';

import { StaticPageLoadingSkeleton } from '@/components/navigation/StaticPageLoadingSkeleton';
import { apiClient } from '@/lib/api-client';
import { useTranslation } from '@/lib/i18n-client';
import type { HomeBrandPartnerPublicItem } from '@/lib/types/home-brand-partners-public';

import { BrandsDirectoryGridClient } from './BrandsDirectoryGridClient';

/** The server always pre-renders brand data for the default locale. */
const DEFAULT_BRANDS_LANG = 'hy';

type BrandPartnersResponse = {
  sectionTitle: string;
  brands: HomeBrandPartnerPublicItem[];
};

type Props = {
  /** SSR-embedded brand list for the default locale (hy). Renders immediately without a client fetch. */
  readonly initialBrands?: HomeBrandPartnerPublicItem[];
};

/**
 * Brands directory: renders the SSR-embedded brand list instantly on first paint.
 * Refetches from the API only when the user switches to a non-default language.
 */
export function BrandsDirectory({ initialBrands }: Props) {
  const { t, lang } = useTranslation();
  const [brands, setBrands] = useState<HomeBrandPartnerPublicItem[] | null>(
    initialBrands && initialBrands.length > 0 ? initialBrands : null,
  );
  // Track which lang the current `brands` state covers so we only refetch on real changes.
  const loadedLangRef = useRef<string>(initialBrands && initialBrands.length > 0 ? DEFAULT_BRANDS_LANG : '');

  useEffect(() => {
    if (lang === loadedLangRef.current) return;

    let active = true;
    // Keep existing logos visible during background language refresh —
    // logo URLs are identical across locales; only aria-labels / names update.
    apiClient
      .get<BrandPartnersResponse>('/api/v1/home/brand-partners', { params: { locale: lang } })
      .then((res) => {
        if (active) {
          setBrands(res.brands ?? []);
          loadedLangRef.current = lang;
        }
      })
      .catch(() => {
        if (active) {
          // Keep current brands on network error; mark lang as loaded to stop retrying.
          loadedLangRef.current = lang;
        }
      });
    return () => {
      active = false;
    };
  }, [lang]);

  return (
    <div className="w-full pb-16 pt-10">
      <div className="marco-header-container">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#383838] dark:text-white md:text-4xl">
            {t('common.navigation.brands')}
          </h1>
        </div>
        {brands === null ? (
          <StaticPageLoadingSkeleton variant="grid" />
        ) : brands.length === 0 ? (
          <p className="text-center text-slate-600 dark:text-slate-400">
            {t('common.brandsPage.empty')}
          </p>
        ) : (
          <BrandsDirectoryGridClient brands={brands} />
        )}
      </div>
    </div>
  );
}
