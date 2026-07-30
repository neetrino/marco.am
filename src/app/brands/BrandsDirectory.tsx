'use client';

import { useEffect, useState } from 'react';

import { StaticPageLoadingSkeleton } from '@/components/navigation/StaticPageLoadingSkeleton';
import { apiClient } from '@/lib/api-client';
import { useTranslation } from '@/lib/i18n-client';
import type { HomeBrandPartnerPublicItem } from '@/lib/types/home-brand-partners-public';

import { BrandsDirectoryGridClient } from './BrandsDirectoryGridClient';

type BrandPartnersResponse = {
  sectionTitle: string;
  brands: HomeBrandPartnerPublicItem[];
};

type Props = {
  /** SSR seed for first paint; refreshed from API on mount so admin edits appear without a hard reload. */
  readonly initialBrands?: HomeBrandPartnerPublicItem[];
};

/**
 * Brands directory: shows SSR seed instantly, then always syncs from the public API.
 */
export function BrandsDirectory({ initialBrands }: Props) {
  const { t, lang } = useTranslation();
  const [brands, setBrands] = useState<HomeBrandPartnerPublicItem[] | null>(
    initialBrands && initialBrands.length > 0 ? initialBrands : null,
  );

  useEffect(() => {
    let active = true;

    apiClient
      .get<BrandPartnersResponse>('/api/v1/home/brand-partners', { params: { locale: lang } })
      .then((res) => {
        if (active) {
          setBrands(res.brands ?? []);
        }
      })
      .catch(() => {
        // Keep SSR placeholder when the background refresh fails.
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
