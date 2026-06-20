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

/**
 * Static-shell brands directory: paints instantly, then fetches the (Redis-cached)
 * public brand payload in the active language and renders the windowed grid.
 */
export function BrandsDirectory() {
  const { t, lang } = useTranslation();
  const [brands, setBrands] = useState<HomeBrandPartnerPublicItem[] | null>(null);

  useEffect(() => {
    let active = true;
    setBrands(null);
    apiClient
      .get<BrandPartnersResponse>('/api/v1/home/brand-partners', { params: { locale: lang } })
      .then((res) => {
        if (active) {
          setBrands(res.brands ?? []);
        }
      })
      .catch(() => {
        if (active) {
          setBrands([]);
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
