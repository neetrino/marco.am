'use client';

import { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useTranslation } from '@/lib/i18n-client';
import type { Brand } from '../types';

const FIELD_CLASS =
  'admin-field w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-marco-yellow focus:outline-none focus:ring-2 focus:ring-marco-yellow/30';

interface CatalogBrandSectionProps {
  brands: Brand[];
  brandIds: string[];
  onBrandIdsChange: (ids: string[]) => void;
}

export function CatalogBrandSection({
  brands,
  brandIds,
  onBrandIdsChange,
}: CatalogBrandSectionProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredBrands = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return brands;
    }
    return brands.filter((brand) => brand.name.toLowerCase().includes(query));
  }, [brands, searchQuery]);

  const selectedBrands = brandIds
    .map((id) => brands.find((brand) => brand.id === id))
    .filter((brand): brand is Brand => Boolean(brand));

  const toggleBrand = (brandId: string, checked: boolean) => {
    onBrandIdsChange(
      checked ? [...brandIds, brandId] : brandIds.filter((id) => id !== brandId),
    );
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      <div className="border-b border-slate-200/70 px-4 py-4 sm:px-5 sm:py-5">
        <h3 className="text-sm font-semibold text-marco-black">{t('admin.products.add.brands')}</h3>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">
          {t('admin.products.add.catalogBrandsHint')}
        </p>
      </div>

      <div className="space-y-4 px-4 py-4 sm:px-5 sm:py-5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder={t('admin.products.add.catalogSearchBrands')}
            className={`${FIELD_CLASS} !pl-10`}
          />
        </div>

        {selectedBrands.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {selectedBrands.map((brand) => (
              <span
                key={brand.id}
                className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700"
              >
                <span className="truncate">{brand.name}</span>
                <button
                  type="button"
                  onClick={() => toggleBrand(brand.id, false)}
                  className="shrink-0 text-slate-400 transition-colors hover:text-red-600"
                  aria-label={t('admin.products.add.removeBrandChip')}
                >
                  <X className="h-3 w-3" aria-hidden />
                </button>
              </span>
            ))}
          </div>
        ) : null}

        <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-200/80 bg-slate-50/50 p-2">
          {filteredBrands.length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-slate-500">
              {t('admin.products.add.catalogNoBrandsFound')}
            </p>
          ) : (
            <ul className="space-y-0.5">
              {filteredBrands.map((brand) => (
                <li key={brand.id}>
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 transition-colors hover:bg-white">
                    <input
                      type="checkbox"
                      checked={brandIds.includes(brand.id)}
                      onChange={(event) => toggleBrand(brand.id, event.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-marco-black focus:ring-marco-yellow/40"
                    />
                    <span className="text-sm text-marco-black">{brand.name}</span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
