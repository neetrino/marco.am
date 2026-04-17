import { cookies } from 'next/headers';
import { Suspense } from 'react';
import {
  LANGUAGE_PREFERENCE_KEY,
  parseLanguageFromServer,
  type LanguageCode,
} from '../../lib/language';
import { t } from '../../lib/i18n';
import { PriceFilter } from '../../components/PriceFilter';
import { BrandFilter } from '../../components/BrandFilter';
import { CategoryFilter } from '../../components/CategoryFilter';
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

/** Same horizontal rhythm as navbar: `.marco-header-container` (see `globals.css`) */
const PRODUCTS_PAGE_SHELL = 'marco-header-container';

interface Product {
  id: string;
  slug: string;
  title: string;
  price: number;
  compareAtPrice: number | null;
  image: string | null;
  inStock: boolean;
  brand: {
    id: string;
    name: string;
  } | null;
  labels?: Array<{
    id: string;
    type: 'text' | 'percentage';
    value: string;
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    color: string | null;
  }>;
}

interface ProductsResponse {
  data: Product[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Fetch products (PRODUCTION SAFE)
 */
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
  language: LanguageCode = 'en'
): Promise<ProductsResponse> {
  try {
    const params: Record<string, string> = {
      page: page.toString(),
      limit: limit.toString(),
      lang: language,
    };

    if (search?.trim()) params.search = search.trim();
    if (category?.trim()) params.category = category.trim();
    if (minPrice?.trim()) params.minPrice = minPrice.trim();
    if (maxPrice?.trim()) params.maxPrice = maxPrice.trim();
    if (colors?.trim()) params.colors = colors.trim();
    if (sizes?.trim()) params.sizes = sizes.trim();
    if (brand?.trim()) params.brand = brand.trim();
    if (filter?.trim()) params.filter = filter.trim();

    const queryString = new URLSearchParams(params).toString();

    // Fallback chain: NEXT_PUBLIC_APP_URL -> VERCEL_URL -> localhost (for local dev)
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

    const targetUrl = `${baseUrl}/api/v1/products?${queryString}`;
    const res = await fetch(targetUrl, {
      cache: "no-store"
    });

    if (!res.ok) throw new Error(`API failed: ${res.status}`);

    const response = await res.json();
    if (!response.data || !Array.isArray(response.data)) {
      return {
        data: [],
        meta: { total: 0, page: 1, limit: 12, totalPages: 0 }
      };
    }

    return response;

  } catch (e) {
    console.error("❌ PRODUCT ERROR", e);
    return {
      data: [],
      meta: { total: 0, page: 1, limit: 12, totalPages: 0 }
    };
  }
}

/**
 * PAGE
 */
export default async function ProductsPage({ searchParams }: any) {
  const cookieStore = await cookies();
  const language: LanguageCode =
    parseLanguageFromServer(cookieStore.get(LANGUAGE_PREFERENCE_KEY)?.value) ?? 'en';

  const params = searchParams ? await searchParams : {};
  const page = parseInt(params?.page || "1", 10);
  const limitParam = params?.limit?.toString().trim();
  const parsedLimit = limitParam && !Number.isNaN(parseInt(limitParam, 10))
    ? parseInt(limitParam, 10)
    : null;
  const perPage = parsedLimit ? Math.min(parsedLimit, 200) : 12;

  const productsData = await getProducts(
    page,
    params?.search,
    params?.category,
    params?.minPrice,
    params?.maxPrice,
    params?.colors,
    params?.sizes,
    params?.brand,
    perPage,
    params?.filter,
    language
  );

  // ------------------------------------
  // 🔧 FIX: normalize products 
  // add missing inStock, missing image fields 
  // ------------------------------------
  const normalizedProducts = productsData.data.map((p: any) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    price: p.price,
    compareAtPrice: p.compareAtPrice ?? p.originalPrice ?? null,
    image: p.image ?? null,
    inStock: p.inStock ?? true,      // ⭐ FIXED
    brand: p.brand ?? null,
    defaultVariantId: p.defaultVariantId ?? null,
    colors: p.colors ?? [],          // ⭐ Add colors array
    labels: p.labels ?? []            // ⭐ Add labels array (includes "Out of Stock" label)
  }));

  // FILTERS
  const brands = params?.brand;
  const selectedBrands = brands ? brands.split(',').map((b: string) => b.trim()) : [];
  const categoryParam = params?.category?.toString().trim();
  const selectedCategorySlugs = categoryParam
    ? categoryParam.split(',').map((s: string) => s.trim()).filter(Boolean)
    : [];

  // PAGINATION: 12 per page by default, preserve limit in URLs
  const buildPaginationUrl = (num: number) => {
    const q = new URLSearchParams();
    q.set("page", num.toString());
    const currentLimit = params?.limit ? String(params.limit) : "12";
    q.set("limit", currentLimit);
    Object.entries(params).forEach(([k, v]) => {
      if (k !== "page" && k !== "limit" && v && typeof v === "string") q.set(k, v);
    });
    return `/products?${q.toString()}`;
  };

  /** Page numbers (and ellipsis) to show in pagination */
  const getPaginationPages = (): (number | "ellipsis")[] => {
    const total = productsData.meta.totalPages;
    const current = page;
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    const set = new Set<number>([1, total, current - 1, current, current + 1]);
    const sorted = Array.from(set).filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
    const out: (number | "ellipsis")[] = [];
    for (let i = 0; i < sorted.length; i++) {
      if (i > 0 && sorted[i]! - sorted[i - 1]! > 1) out.push("ellipsis");
      out.push(sorted[i]!);
    }
    return out;
  };

  const paginationSlotItems: PaginationSlotItem[] = getPaginationPages().map((item) =>
    item === 'ellipsis'
      ? { kind: 'ellipsis' }
      : { kind: 'page', page: item, href: buildPaginationUrl(item) }
  );

  return (
    <div className="w-full max-w-full overflow-x-hidden pb-24 md:pb-32 lg:pb-40">
      <ProductsHeader total={productsData.meta.total} />

      <div className={`${PRODUCTS_PAGE_SHELL} flex flex-col lg:flex-row gap-8`}>
        <ProductsFiltersProvider
          category={params?.category}
          search={params?.search}
          minPrice={params?.minPrice}
          maxPrice={params?.maxPrice}
        >
        <aside className="hidden shrink-0 bg-white lg:flex lg:w-[20rem]">
          <div className="sticky top-4 flex min-h-0 min-w-0 flex-1 flex-col px-5 pb-4 pt-6 lg:px-6">
            <div className="mb-6 flex flex-col gap-1">
              <h2
                className={`${productsFiltersSectionFont.className} text-base font-semibold leading-6 tracking-[-0.31px] text-[#0f172b]`}
              >
                {t(language, 'products.filters.panelTitle')}
              </h2>
              <p className="text-sm font-normal leading-5 tracking-[-0.15px] text-[#62748e]">
                {t(language, 'products.filters.panelSubtitle')}
              </p>
            </div>
            <Suspense fallback={<div>{t(language, 'common.messages.loadingFilters')}</div>}>
              <PriceFilter currentMinPrice={params?.minPrice} currentMaxPrice={params?.maxPrice} category={params?.category} search={params?.search} />
              <CategoryFilter
                category={params?.category}
                search={params?.search}
                minPrice={params?.minPrice}
                maxPrice={params?.maxPrice}
                selectedSlugs={selectedCategorySlugs}
              />
              <BrandFilter category={params?.category} search={params?.search} minPrice={params?.minPrice} maxPrice={params?.maxPrice} selectedBrands={selectedBrands} />
            </Suspense>
          </div>
          <div
            className="hidden w-px shrink-0 self-stretch bg-[#e2e8f0] lg:block"
            aria-hidden
          />
        </aside>

        <div className="flex-1 min-w-0 w-full lg:w-auto py-4 overflow-x-hidden">

          {normalizedProducts.length > 0 ? (
            <>
              <ProductsGrid products={normalizedProducts} sortBy={params?.sort || "default"} />

              {productsData.meta.totalPages > 1 && (
                <ProductsPagination
                  page={page}
                  totalPages={productsData.meta.totalPages}
                  hrefFirst={buildPaginationUrl(1)}
                  hrefBack={buildPaginationUrl(Math.max(1, page - 1))}
                  hrefNext={buildPaginationUrl(
                    Math.min(productsData.meta.totalPages, page + 1)
                  )}
                  hrefLast={buildPaginationUrl(productsData.meta.totalPages)}
                  slotItems={paginationSlotItems}
                />
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">{t(language, 'common.messages.noProductsFound')}</p>
            </div>
          )}

        </div>

      {/* Mobile Filters Drawer */}
      <MobileFiltersDrawer openEventName={MOBILE_FILTERS_EVENT}>
        <div className="space-y-0 px-4 pb-4 pt-2">
          <div className="mb-6 flex flex-col gap-1">
            <h2
              className={`${productsFiltersSectionFont.className} text-base font-semibold leading-6 tracking-[-0.31px] text-[#0f172b]`}
            >
              {t(language, 'products.filters.panelTitle')}
            </h2>
            <p className="text-sm font-normal leading-5 tracking-[-0.15px] text-[#62748e]">
              {t(language, 'products.filters.panelSubtitle')}
            </p>
          </div>
          <Suspense fallback={<div>{t(language, 'common.messages.loadingFilters')}</div>}>
            <PriceFilter currentMinPrice={params?.minPrice} currentMaxPrice={params?.maxPrice} category={params?.category} search={params?.search} />
            <CategoryFilter
              category={params?.category}
              search={params?.search}
              minPrice={params?.minPrice}
              maxPrice={params?.maxPrice}
              selectedSlugs={selectedCategorySlugs}
            />
            <BrandFilter category={params?.category} search={params?.search} minPrice={params?.minPrice} maxPrice={params?.maxPrice} selectedBrands={selectedBrands} />
          </Suspense>
        </div>
      </MobileFiltersDrawer>
        </ProductsFiltersProvider>
      </div>
    </div>
  );
}


