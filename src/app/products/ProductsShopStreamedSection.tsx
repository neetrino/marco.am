import { cookies } from 'next/headers';
import {
  LANGUAGE_PREFERENCE_KEY,
  parseLanguageFromServer,
  type LanguageCode,
} from '../../lib/language';
import { t } from '../../lib/i18n';
import { PriceFilter } from '../../components/PriceFilter';
import { BrandFilter } from '../../components/BrandFilter';
import { CategoryFilter } from '../../components/CategoryFilter';
import { ColorFilter } from '../../components/ColorFilter';
import { ProductsHeader } from '../../components/ProductsHeader';
import { ProductsGrid } from '../../components/ProductsGrid';
import { MobileFiltersDrawer } from '../../components/MobileFiltersDrawer';
import { ProductsFiltersProvider } from '../../components/ProductsFiltersProvider';
import { productsFiltersSectionFont } from '../../lib/products-filters-typography';
import {
  ProductsPagination,
  type PaginationSlotItem,
} from '../../components/products/ProductsPagination';
import { MOBILE_FILTERS_EVENT } from '../../lib/events';
import { productsService } from '../../lib/services/products.service';
import type { ProductLabel } from '../../components/ProductLabels';

/** PLP row after `transformProducts` (typed as unknown[] in service). */
type ShopGridProduct = {
  id: string;
  slug: string;
  title: string;
  price: number;
  compareAtPrice: number | null;
  image: string | null;
  inStock: boolean;
  brand: { id: string; name: string } | null;
  defaultVariantId: string | null;
  colors: Array<{ value: string; imageUrl?: string | null; colors?: string[] | null }>;
  labels: ProductLabel[];
};

function normalizeShopGridProduct(p: unknown): ShopGridProduct {
  const row = p as {
    id: string;
    slug: string;
    title: string;
    price: number;
    compareAtPrice?: number | null;
    originalPrice?: number | null;
    image?: string | null;
    inStock?: boolean;
    brand?: { id: string; name: string } | null;
    defaultVariantId?: string | null;
    colors?: ShopGridProduct['colors'];
    labels?: ProductLabel[];
  };
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    price: row.price,
    compareAtPrice: row.compareAtPrice ?? row.originalPrice ?? null,
    image: row.image ?? null,
    inStock: row.inStock ?? true,
    brand: row.brand ?? null,
    defaultVariantId: row.defaultVariantId ?? null,
    colors: row.colors ?? [],
    labels: row.labels ?? [],
  };
}

export type ProductsPageSearchParams = Record<string, string | string[] | undefined>;

function firstParam(v: string | string[] | undefined): string | undefined {
  if (v === undefined) {
    return undefined;
  }
  return Array.isArray(v) ? v[0] : v;
}

function parseUrlPriceBounds(minPrice?: string, maxPrice?: string) {
  const parsedMin = minPrice ? Number(minPrice) : undefined;
  const parsedMax = maxPrice ? Number(maxPrice) : undefined;
  const validMin =
    parsedMin !== undefined && Number.isFinite(parsedMin) && parsedMin >= 0 ? parsedMin : undefined;
  const validMax =
    parsedMax !== undefined && Number.isFinite(parsedMax) && parsedMax >= 0 ? parsedMax : undefined;
  return { min: validMin, max: validMax };
}

async function getProducts(
  page: number = 1,
  search?: string,
  category?: string,
  minPrice?: string,
  maxPrice?: string,
  colors?: string,
  sizes?: string,
  brand?: string,
  limit: number = 12,
  filter?: string,
  language: LanguageCode = 'en',
  sort?: string,
) {
  try {
    const { min: validMinPrice, max: validMaxPrice } = parseUrlPriceBounds(minPrice, maxPrice);

    return await productsService.findAll({
      page,
      limit,
      lang: language,
      search: search?.trim() || undefined,
      category: category?.trim() || undefined,
      minPrice: validMinPrice,
      maxPrice: validMaxPrice,
      colors: colors?.trim() || undefined,
      sizes: sizes?.trim() || undefined,
      brand: brand?.trim() || undefined,
      filter: filter?.trim() || undefined,
      sort: sort?.trim() || undefined,
      /** Faster PLP: skip heavy productAttributes join (filters load client-side). */
      listingOmitProductAttributes: true,
    });
  } catch (e) {
    console.error('❌ PRODUCT ERROR', e);
    return {
      data: [],
      meta: { total: 0, page: 1, limit: 12, totalPages: 0 },
    };
  }
}

interface ProductsShopStreamedSectionProps {
  readonly searchParams: Promise<ProductsPageSearchParams>;
}

export async function ProductsShopStreamedSection({ searchParams }: ProductsShopStreamedSectionProps) {
  const [cookieStore, raw] = await Promise.all([cookies(), searchParams]);
  const language: LanguageCode =
    parseLanguageFromServer(cookieStore.get(LANGUAGE_PREFERENCE_KEY)?.value) ?? 'en';
  const params = {
    page: firstParam(raw.page),
    limit: firstParam(raw.limit),
    search: firstParam(raw.search),
    category: firstParam(raw.category),
    minPrice: firstParam(raw.minPrice),
    maxPrice: firstParam(raw.maxPrice),
    colors: firstParam(raw.colors),
    sizes: firstParam(raw.sizes),
    brand: firstParam(raw.brand),
    filter: firstParam(raw.filter),
    sort: firstParam(raw.sort),
  };

  const page = parseInt(params.page || '1', 10);
  const limitParam = params.limit?.trim();
  const parsedLimit = limitParam && !Number.isNaN(parseInt(limitParam, 10))
    ? parseInt(limitParam, 10)
    : null;
  const perPage = parsedLimit ? Math.min(parsedLimit, 200) : 12;

  const productsData = await getProducts(
    page,
    params.search,
    params.category,
    params.minPrice,
    params.maxPrice,
    params.colors,
    params.sizes,
    params.brand,
    perPage,
    params.filter,
    language,
    params.sort,
  );

  const normalizedProducts = productsData.data.map(normalizeShopGridProduct);

  const buildPaginationUrl = (num: number) => {
    const q = new URLSearchParams();
    for (const key of Object.keys(raw)) {
      if (key === 'page') {
        continue;
      }
      const v = firstParam(raw[key]);
      if (v) {
        q.set(key, v);
      }
    }
    q.set('page', String(num));
    if (!q.has('limit')) {
      q.set('limit', params.limit ?? '12');
    }
    return `/products?${q.toString()}`;
  };

  const getPaginationPages = (): (number | 'ellipsis')[] => {
    const total = productsData.meta.totalPages;
    const current = page;
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    const set = new Set<number>([1, total, current - 1, current, current + 1]);
    const sorted = Array.from(set).filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
    const out: (number | 'ellipsis')[] = [];
    for (let i = 0; i < sorted.length; i++) {
      if (i > 0 && sorted[i]! - sorted[i - 1]! > 1) {
        out.push('ellipsis');
      }
      out.push(sorted[i]!);
    }
    return out;
  };

  const paginationSlotItems: PaginationSlotItem[] = getPaginationPages().map((item) =>
    item === 'ellipsis' ? { kind: 'ellipsis' } : { kind: 'page', page: item, href: buildPaginationUrl(item) },
  );

  return (
    <div className="w-full max-w-full pb-4 md:pb-32 lg:pb-40">
      <ProductsHeader total={productsData.meta.total} />

      <div className="marco-header-container flex flex-col min-[744px]:flex-row min-[744px]:gap-5 xl:gap-8">
        <ProductsFiltersProvider
          category={params.category}
          search={params.search}
          minPrice={params.minPrice}
          maxPrice={params.maxPrice}
        >
          <aside className="hidden w-[16rem] shrink-0 bg-white dark:bg-[var(--app-bg)] min-[744px]:sticky min-[744px]:top-4 min-[744px]:z-10 min-[744px]:self-start min-[744px]:block xl:w-[20rem]">
            <div className="border-r border-solid border-[#e2e8f0] dark:border-white/20 pb-4 pt-4 min-[744px]:pl-0 min-[744px]:pr-3 xl:pb-6 xl:pt-6 xl:pr-6">
              <div className="mb-4 flex flex-col gap-1 lg:mb-5 xl:mb-6">
                <h2
                  className={`${productsFiltersSectionFont.className} text-sm font-semibold leading-5 tracking-[-0.31px] text-[#0f172b] dark:text-white lg:text-base lg:leading-6`}
                >
                  {t(language, 'products.filters.panelTitle')}
                </h2>
                <p className="text-xs font-normal leading-snug tracking-[-0.15px] text-[#62748e] dark:text-white/72 lg:text-sm lg:leading-5">
                  {t(language, 'products.filters.panelSubtitle')}
                </p>
              </div>
              <PriceFilter
                currentMinPrice={params.minPrice}
                currentMaxPrice={params.maxPrice}
                category={params.category}
                search={params.search}
              />
              <CategoryFilter
                category={params.category}
                search={params.search}
                minPrice={params.minPrice}
                maxPrice={params.maxPrice}
              />
              <BrandFilter
                category={params.category}
                search={params.search}
                minPrice={params.minPrice}
                maxPrice={params.maxPrice}
              />
              <ColorFilter
                category={params.category}
                search={params.search}
                minPrice={params.minPrice}
                maxPrice={params.maxPrice}
              />
            </div>
          </aside>

          <div className="min-w-0 flex-1 w-full overflow-x-hidden pt-4 pb-2 min-[744px]:w-auto min-[744px]:py-4">
            {normalizedProducts.length > 0 ? (
              <>
                <ProductsGrid products={normalizedProducts} sortBy={params.sort || 'default'} />

                {productsData.meta.totalPages > 1 && (
                  <ProductsPagination
                    page={page}
                    totalPages={productsData.meta.totalPages}
                    hrefFirst={buildPaginationUrl(1)}
                    hrefBack={buildPaginationUrl(Math.max(1, page - 1))}
                    hrefNext={buildPaginationUrl(Math.min(productsData.meta.totalPages, page + 1))}
                    hrefLast={buildPaginationUrl(productsData.meta.totalPages)}
                    slotItems={paginationSlotItems}
                  />
                )}
              </>
            ) : (
              <div className="py-12 text-center">
                <p className="text-lg text-gray-500 dark:text-white/72">
                  {t(language, 'common.messages.noProductsFound')}
                </p>
              </div>
            )}
          </div>

          <MobileFiltersDrawer openEventName={MOBILE_FILTERS_EVENT}>
            <div className="space-y-0 px-4 pb-4 pt-0">
              <div className="mb-5">
                <p className="text-sm font-normal leading-5 tracking-[-0.15px] text-[#62748e] dark:text-white/72">
                  {t(language, 'products.filters.panelSubtitle')}
                </p>
              </div>
              <PriceFilter
                currentMinPrice={params.minPrice}
                currentMaxPrice={params.maxPrice}
                category={params.category}
                search={params.search}
              />
              <div className="h-6 shrink-0" aria-hidden />
              <CategoryFilter
                category={params.category}
                search={params.search}
                minPrice={params.minPrice}
                maxPrice={params.maxPrice}
              />
              <div className="h-6 shrink-0" aria-hidden />
              <BrandFilter
                category={params.category}
                search={params.search}
                minPrice={params.minPrice}
                maxPrice={params.maxPrice}
              />
              <div className="h-6 shrink-0" aria-hidden />
              <ColorFilter
                category={params.category}
                search={params.search}
                minPrice={params.minPrice}
                maxPrice={params.maxPrice}
              />
            </div>
          </MobileFiltersDrawer>
        </ProductsFiltersProvider>
      </div>
    </div>
  );
}
