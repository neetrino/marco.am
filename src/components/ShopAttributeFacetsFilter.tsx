'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { pushShopProductsListingUrl } from '@/lib/push-shop-products-listing-url';
import { useTranslation } from '@/lib/i18n-client';
import {
  normalizeTechnicalFilterToken,
  type TechnicalSpecFacet,
} from '@/lib/services/products-technical-filters';
import { useProductsFilters } from './ProductsFiltersProvider';
import {
  PRODUCTS_FILTER_SECTION_SHELL_LAST_CLASS,
  productsFiltersSectionFont,
} from '@/lib/products-filters-typography';
import { ProductsFilterCheckboxVisual } from './ProductsFilterCheckbox';
import { ProductsFilterScrollArea } from './ProductsFilterScrollArea';

const SPEC_QUERY_PREFIX = 'spec.';

const ATTRIBUTE_GROUP_INNER_DIVIDER_CLASS =
  'border-t border-solid border-[#e2e8f0] pt-6 mt-6 dark:border-white/20';

function readSelectedTokens(searchParams: URLSearchParams, attributeKey: string): string[] {
  const raw = searchParams.get(`${SPEC_QUERY_PREFIX}${attributeKey}`);
  if (!raw) {
    return [];
  }
  return raw
    .split(',')
    .map((s) => normalizeTechnicalFilterToken(s))
    .filter(Boolean);
}

export function ShopAttributeFacetsFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filtersContext = useProductsFilters();
  const { t } = useTranslation();
  const [facets, setFacets] = useState<TechnicalSpecFacet[]>([]);
  const [loading, setLoading] = useState(true);
  const [optimisticByKey, setOptimisticByKey] = useState<Record<string, string[] | null> | null>(
    null,
  );

  useEffect(() => {
    if (filtersContext?.data != null) {
      setFacets(filtersContext.data.attributeFacets ?? []);
      setLoading(false);
      return;
    }
    if (filtersContext === null) {
      setLoading(true);
    } else {
      setLoading(filtersContext.loading);
    }
  }, [filtersContext?.data, filtersContext?.loading, filtersContext === null]);

  useEffect(() => {
    setOptimisticByKey(null);
  }, [searchParams]);

  const selectedForFacet = (facetKey: string): string[] => {
    const optimistic = optimisticByKey?.[facetKey];
    if (optimistic != null) {
      return optimistic;
    }
    return readSelectedTokens(searchParams, facetKey);
  };

  const handleToggleValue = (facetKey: string, valueToken: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const paramName = `${SPEC_QUERY_PREFIX}${facetKey}`;
    const normalizedValue = normalizeTechnicalFilterToken(valueToken);
    const fromUrl = readSelectedTokens(params, facetKey);
    const idx = fromUrl.indexOf(normalizedValue);
    const next = idx >= 0 ? fromUrl.filter((_, i) => i !== idx) : [...fromUrl, normalizedValue];

    setOptimisticByKey((prev) => ({
      ...(prev ?? {}),
      [facetKey]: next,
    }));

    if (next.length > 0) {
      params.set(paramName, next.join(','));
    } else {
      params.delete(paramName);
    }
    params.delete('page');
    const qs = params.toString();
    pushShopProductsListingUrl(router, qs ? `/products?${qs}` : '/products');
  };

  const handleClearFacet = (facetKey: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(`${SPEC_QUERY_PREFIX}${facetKey}`);
    params.delete('page');
    setOptimisticByKey((prev) => ({
      ...(prev ?? {}),
      [facetKey]: [],
    }));
    const qs = params.toString();
    pushShopProductsListingUrl(router, qs ? `/products?${qs}` : '/products');
  };

  if (loading) {
    return (
      <section className={PRODUCTS_FILTER_SECTION_SHELL_LAST_CLASS}>
        <h3
          className={`${productsFiltersSectionFont.className} mb-2 text-base font-semibold leading-6 tracking-[-0.31px] text-black dark:text-white`}
        >
          {t('products.filters.attributeFacets.sectionTitle')}
        </h3>
        <p className="text-sm text-[#62748e] dark:text-white/72">{t('products.filters.attributeFacets.loading')}</p>
      </section>
    );
  }

  if (facets.length === 0) {
    return null;
  }

  return (
    <section className={PRODUCTS_FILTER_SECTION_SHELL_LAST_CLASS}>
      <h3
        className={`${productsFiltersSectionFont.className} mb-6 text-base font-semibold leading-6 tracking-[-0.31px] text-black dark:text-white lg:mb-7`}
      >
        {t('products.filters.attributeFacets.sectionTitle')}
      </h3>

      <div className="flex flex-col">
        {facets.map((facet, index) => {
          const selected = selectedForFacet(facet.key);
          const hasSelection = selected.length > 0;

          return (
            <div
              key={facet.key}
              className={index > 0 ? ATTRIBUTE_GROUP_INNER_DIVIDER_CLASS : undefined}
            >
              <div className="mb-4 flex min-h-6 items-center justify-between gap-2">
                <h4
                  className={`${productsFiltersSectionFont.className} min-w-0 text-base font-semibold leading-6 tracking-[-0.31px] text-black dark:text-white`}
                >
                  {facet.label}
                </h4>
                {hasSelection ? (
                  <button
                    type="button"
                    onClick={() => handleClearFacet(facet.key)}
                    className="shrink-0 whitespace-nowrap rounded-sm text-sm font-semibold leading-5 tracking-[-0.15px] text-marco-yellow transition-[filter,opacity] hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marco-black/25 dark:focus-visible:ring-white/30"
                    aria-label={t('products.filters.attributeFacets.clearAria').replace(
                      /\{name\}/g,
                      facet.label,
                    )}
                  >
                    {t('products.filters.attributeFacets.clear')}
                  </button>
                ) : null}
              </div>

              <ProductsFilterScrollArea className="max-h-[18rem] pr-[10px]">
                <div className="flex flex-col gap-3">
                  {facet.values.map((option) => {
                    const isSelected = selected.includes(option.value);

                    return (
                      <button
                        key={`${facet.key}-${option.value}`}
                        type="button"
                        onClick={() => handleToggleValue(facet.key, option.value)}
                        className="flex w-full min-w-0 items-center gap-3 pr-3 text-left transition-[opacity,color] duration-200 ease-out hover:opacity-90"
                      >
                        <ProductsFilterCheckboxVisual checked={isSelected} />
                        <span
                          className={`min-w-0 flex-1 truncate text-base leading-6 tracking-[0.16px] transition-colors duration-200 ease-out ${
                            isSelected
                              ? 'text-[#314158] dark:text-[#b8c2cf]'
                              : 'text-[#5d7285] dark:text-[#8f9fb2]'
                          }`}
                        >
                          {option.label}
                        </span>
                        <span className="shrink-0 text-base leading-6 tracking-[-0.31px] text-[#90a1b9] dark:text-white/68">
                          ({option.count})
                        </span>
                      </button>
                    );
                  })}
                </div>
              </ProductsFilterScrollArea>
            </div>
          );
        })}
      </div>
    </section>
  );
}
