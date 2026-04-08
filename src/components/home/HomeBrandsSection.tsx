'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { getStoredLanguage } from '@/lib/language';
import { useTranslation } from '@/lib/i18n-client';
import { logger } from '@/lib/utils/logger';

const MAX_BRANDS = 8;

interface BrandOption {
  id: string;
  name: string;
  count: number;
}

interface FiltersResponse {
  brands: BrandOption[];
}

export function HomeBrandsSection() {
  const { t } = useTranslation();
  const [brands, setBrands] = useState<BrandOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const lang = getStoredLanguage();
        const res = await apiClient.get<FiltersResponse>('/api/v1/products/filters', {
          params: { lang },
        });
        setBrands((res.brands || []).slice(0, MAX_BRANDS));
      } catch (err) {
        logger.error('[HomeBrandsSection] failed', { err });
        setBrands([]);
      } finally {
        setLoading(false);
      }
    };
    load();
    const onLang = () => load();
    window.addEventListener('language-updated', onLang);
    return () => window.removeEventListener('language-updated', onLang);
  }, []);

  if (!loading && brands.length === 0) {
    return null;
  }

  return (
    <section className="bg-[#f8f8f8] py-10 md:py-14">
      <h2 className="text-center text-xl font-black uppercase tracking-wide text-[#101010] md:text-2xl">
        {t('home.brands_title')}
      </h2>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-4 md:gap-6">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-16 w-36 animate-pulse rounded-2xl bg-gray-200 md:h-20 md:w-44"
                />
              ))
            : brands.map((b) => (
                <Link
                  key={b.id}
                  href={`/products?brand=${encodeURIComponent(b.id)}`}
                  className="flex h-16 min-w-[140px] items-center justify-center rounded-2xl border border-gray-200/80 bg-white px-6 text-sm font-semibold text-[#333] shadow-sm transition-shadow hover:shadow-md md:h-20 md:min-w-[168px] md:text-base"
                >
                  {b.name}
                </Link>
              ))}
        </div>

      <div className="mt-10 flex justify-center">
        <Link
          href="/products"
          className="inline-flex min-w-[200px] items-center justify-center rounded-full bg-[#101010] px-10 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          {t('common.search.seeAll')}
        </Link>
      </div>
    </section>
  );
}
