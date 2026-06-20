'use client';

import { Suspense, useCallback, useEffect, useState, useMemo, useRef } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { apiClient, getApiOrErrorMessage } from '../../../lib/api-client';
import { useTranslation } from '../../../lib/i18n-client';
import { getStoredCurrency, initializeCurrencyRates, type CurrencyCode } from '../../../lib/currency';
import { getStoredLanguage } from '../../../lib/language';
import { AdminPageLayout } from '../components/AdminPageLayout';
import { ProductFilters, type ProductPublishedFilter, type ProductStockFilter } from './components/ProductFilters';
import { BulkSelectionControls } from './components/BulkSelectionControls';
import { ProductsTable } from './components/ProductsTable';
import { useProductHandlers } from './hooks/useProductHandlers';
import type { Product, ProductsResponse, Category } from './types';
import { logger } from "@/lib/utils/logger";
import {
  fetchAdminCategoriesLite,
  readAdminCategoriesCache,
  warmAdminCategoriesCache,
} from '@/lib/admin/admin-reference-data-cache';
import {
  buildAdminProductsListCacheKey,
  buildProductsDefaultListCacheKey,
} from '@/lib/admin/admin-cache-keys';
import { beginAdminDataFetch } from '@/lib/admin/admin-fetch-helpers';
import { dedupedAdminRequest } from '@/lib/admin/admin-request-dedup';
import {
  ADMIN_SESSION_CACHE_TTL_MS,
  readAdminSessionCache,
  writeAdminSessionCache,
} from '@/lib/admin/admin-session-cache';
import { ProductEditorSheet } from './add/components/ProductEditorSheet';

type AdminProductsCachePayload = {
  data: Product[];
  meta: ProductsResponse['meta'] | null;
};

export default function ProductsPage() {
  return (
    <Suspense fallback={null}>
      <ProductsPageContent />
    </Suspense>
  );
}

function ProductsPageContent() {
  const { t, lang } = useTranslation();
  const activeLocale = lang ?? getStoredLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const editParam = searchParams.get('edit');
  const createParam = searchParams.get('create');
  const sheetOpen = Boolean(editParam || createParam);
  const sheetProductId = editParam ?? null;
  const defaultProductsCacheKey = buildProductsDefaultListCacheKey(activeLocale);
  const defaultProductsCache = readAdminSessionCache<AdminProductsCachePayload>(
    defaultProductsCacheKey,
    ADMIN_SESSION_CACHE_TTL_MS,
  );
  const cachedCategories = readAdminCategoriesCache<Category>(activeLocale, {
    includeCounts: false,
  });
  const hadProductsCacheRef = useRef(defaultProductsCache !== null);
  const hadCategoriesCacheRef = useRef(cachedCategories !== null);
  const [products, setProducts] = useState<Product[]>(defaultProductsCache?.data ?? []);
  const [loading, setLoading] = useState(defaultProductsCache === null);
  const [search, setSearch] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [categories, setCategories] = useState<Category[]>(cachedCategories ?? []);
  const [categoriesLoading, setCategoriesLoading] = useState(cachedCategories === null);
  const [stockFilter, setStockFilter] = useState<ProductStockFilter>('all');
  const [publishedFilter, setPublishedFilter] = useState<ProductPublishedFilter>('all');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<ProductsResponse['meta'] | null>(defaultProductsCache?.meta ?? null);
  const [sortBy, setSortBy] = useState<string>('createdAt-desc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [_togglingAllFeatured, setTogglingAllFeatured] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [updatingPublishedIds, setUpdatingPublishedIds] = useState<Set<string>>(new Set());
  const [updatingFeaturedIds, setUpdatingFeaturedIds] = useState<Set<string>>(new Set());
  const [currency, setCurrency] = useState<CurrencyCode>('USD');

  // Initialize currency rates and listen for currency changes
  useEffect(() => {
    warmAdminCategoriesCache(activeLocale);
  }, [activeLocale]);

  useEffect(() => {
    const updateCurrency = () => {
      const newCurrency = getStoredCurrency();
      logger.devLog('💱 [ADMIN PRODUCTS] Currency updated to:', newCurrency);
      setCurrency(newCurrency);
    };
    
    // Initialize currency rates
    initializeCurrencyRates().catch(console.error);
    
    // Load currency on mount
    updateCurrency();
    
    // Listen for currency changes
    if (typeof window !== 'undefined') {
      window.addEventListener('currency-updated', updateCurrency);
      const handleCurrencyRatesUpdate = () => {
        logger.devLog('💱 [ADMIN PRODUCTS] Currency rates updated, refreshing currency...');
        updateCurrency();
      };
      window.addEventListener('currency-rates-updated', handleCurrencyRatesUpdate);
      
      return () => {
        window.removeEventListener('currency-updated', updateCurrency);
        window.removeEventListener('currency-rates-updated', handleCurrencyRatesUpdate);
      };
    }
  }, []);

  // Fetch categories for active locale
  useEffect(() => {
    void fetchCategories();
  }, [activeLocale]);

  const fetchCategories = async () => {
    try {
      beginAdminDataFetch(hadCategoriesCacheRef.current, setCategoriesLoading);
      const response = await fetchAdminCategoriesLite<Category>(activeLocale);
      setCategories(response.data || []);
      hadCategoriesCacheRef.current = true;
    } catch (err: unknown) {
      console.error('❌ [ADMIN] Error fetching categories:', err);
      if (!hadCategoriesCacheRef.current) {
        setCategories([]);
      }
    } finally {
      setCategoriesLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
     
  }, [page, search, selectedCategories, stockFilter, publishedFilter, sortBy, activeLocale]);

  const fetchProducts = async (options?: { force?: boolean }) => {
    const publishedParam =
      publishedFilter === 'published' ? 'true' : publishedFilter === 'unpublished' ? 'false' : '';

    const cacheKey = buildAdminProductsListCacheKey({
      page,
      lang: activeLocale,
      search,
      category: selectedCategories.size > 0 ? Array.from(selectedCategories).join(',') : '',
      published: publishedParam,
      sort: sortBy,
      stockFilter,
    });
    const cached = readAdminSessionCache<AdminProductsCachePayload>(cacheKey, ADMIN_SESSION_CACHE_TTL_MS);
    if (!options?.force && cached !== null) {
      setProducts(cached.data ?? []);
      setMeta(cached.meta ?? null);
      setLoading(false);
      hadProductsCacheRef.current = true;
      return;
    }

    try {
      beginAdminDataFetch(cached !== null, setLoading);
      const params: Record<string, string> = {
        page: page.toString(),
        limit: '20',
        lang: activeLocale,
      };
      
      if (search.trim()) {
        params.search = search.trim();
      }

      if (selectedCategories.size > 0) {
        params.category = Array.from(selectedCategories).join(',');
      }

      if (publishedFilter === 'published') {
        params.published = 'true';
      } else if (publishedFilter === 'unpublished') {
        params.published = 'false';
      }

      if (sortBy && sortBy.startsWith('createdAt')) {
        params.sort = sortBy;
      }

      const response = await dedupedAdminRequest(cacheKey, () =>
        apiClient.get<ProductsResponse>('/api/v1/supersudo/products', {
          params,
        }),
      );
      
      let filteredProducts = response.data || [];

      // Stock filter (client-side)
      if (stockFilter !== 'all') {
        filteredProducts = filteredProducts.filter(product => {
          const getTotalStock = (p: Product) => {
            if (p.colorStocks && p.colorStocks.length > 0) {
              return p.colorStocks.reduce((sum, cs) => sum + (cs.stock || 0), 0);
            }
            return p.stock ?? 0;
          };
          const totalStock = getTotalStock(product);
          if (stockFilter === 'inStock') {
            return totalStock > 0;
          } else if (stockFilter === 'outOfStock') {
            return totalStock === 0;
          }
          return true;
        });
      }

      setProducts(filteredProducts);
      setMeta(response.meta || null);
      writeAdminSessionCache(cacheKey, { data: filteredProducts, meta: response.meta || null });
      hadProductsCacheRef.current = true;
    } catch (err: unknown) {
      console.error('❌ [ADMIN] Error fetching products:', err);
      if (!hadProductsCacheRef.current) {
        setProducts([]);
      }
      alert(t('admin.products.errorLoading').replace('{message}', getApiOrErrorMessage(err, t('admin.common.unknownErrorFallback'))));
    } finally {
      setLoading(false);
    }
  };

  // Client-side sorting for Product / Price / Stock columns
  const sortedProducts = useMemo(() => {
    if (!Array.isArray(products)) return [];

    if (!sortBy || sortBy.startsWith('createdAt')) {
      return products;
    }

    const [field, directionRaw] = sortBy.split('-');
    const direction = directionRaw === 'asc' ? 1 : -1;

    logger.devLog('📊 [ADMIN] Applying client-side sort:', { field, direction: directionRaw });

    const cloned = [...products];

    if (field === 'price') {
      cloned.sort((a, b) => {
        const aPrice = a.price ?? 0;
        const bPrice = b.price ?? 0;
        if (aPrice === bPrice) return 0;
        return aPrice > bPrice ? direction : -direction;
      });
    } else if (field === 'title') {
      cloned.sort((a, b) => {
        const aTitle = (a.title || '').toLowerCase();
        const bTitle = (b.title || '').toLowerCase();
        if (aTitle === bTitle) return 0;
        return aTitle > bTitle ? direction : -direction;
      });
    } else if (field === 'stock') {
      cloned.sort((a, b) => {
        const getTotalStock = (product: Product) => {
          if (product.colorStocks && product.colorStocks.length > 0) {
            return product.colorStocks.reduce((sum, cs) => sum + (cs.stock || 0), 0);
          }
          return product.stock ?? 0;
        };
        const aStock = getTotalStock(a);
        const bStock = getTotalStock(b);
        if (aStock === bStock) return 0;
        return aStock > bStock ? direction : -direction;
      });
    }

    return cloned;
  }, [products, sortBy]);

  const categoryTitleById = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((category) => {
      map.set(category.id, category.title);
    });
    return map;
  }, [categories]);

  const handleHeaderSort = (field: 'price' | 'createdAt' | 'title' | 'stock') => {
    setPage(1);

    setSortBy((current) => {
      let next = current;

      if (field === 'price') {
        if (current === 'price-asc') {
          next = 'price-desc';
        } else {
          next = 'price-asc';
        }
      }

      if (field === 'createdAt') {
        if (current === 'createdAt-asc') {
          next = 'createdAt-desc';
        } else {
          next = 'createdAt-asc';
        }
      }

      if (field === 'title') {
        if (current === 'title-asc') {
          next = 'title-desc';
        } else {
          next = 'title-asc';
        }
      }

      if (field === 'stock') {
        if (current === 'stock-asc') {
          next = 'stock-desc';
        } else {
          next = 'stock-asc';
        }
      }

      logger.devLog('📊 [ADMIN] Sort changed from', current, 'to', next, 'by header click');
      return next;
    });
  };

  const handlers = useProductHandlers({
    products,
    setProducts,
    fetchProducts,
    selectedIds,
    setSelectedIds,
    setPage,
    setBulkDeleting,
    setTogglingAllFeatured,
    setDeletingIds,
    setUpdatingPublishedIds,
    setUpdatingFeaturedIds,
  });

  const handleClearFilters = () => {
    setSearch('');
    setSelectedCategories(new Set());
    setStockFilter('all');
    setPublishedFilter('all');
    setPage(1);
  };

  const hasActiveFilters =
    search.length > 0 ||
    selectedCategories.size > 0 ||
    stockFilter !== 'all' ||
    publishedFilter !== 'all';

  const closeProductEditor = useCallback(() => {
    router.replace('/supersudo/products', { scroll: false });
  }, [router]);

  const openCreateProduct = useCallback(() => {
    router.replace('/supersudo/products?create=1', { scroll: false });
  }, [router]);

  const openEditProduct = useCallback(
    (productId: string) => {
      router.replace(`/supersudo/products?edit=${productId}`, { scroll: false });
    },
    [router],
  );

  const handleProductSaved = () => {
    closeProductEditor();
    void fetchProducts({ force: true });
  };

  const editingListProduct = useMemo(
    () => (sheetProductId ? products.find((product) => product.id === sheetProductId) ?? null : null),
    [sheetProductId, products],
  );

  const currentPath = pathname || '/supersudo/products';

  return (
    <AdminPageLayout
      currentPath={currentPath}
      router={router}
      t={t}
      title={t('admin.products.title')}
      headerActions={
        <div className="flex flex-wrap items-center justify-end gap-2">
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={handleClearFilters}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-900"
            >
              {t('admin.products.clearAll')}
            </button>
          ) : null}
          <button
            type="button"
            onClick={openCreateProduct}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-marco-yellow px-4 text-sm font-semibold text-marco-black transition-all hover:-translate-y-0.5 hover:brightness-95"
          >
            <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {t('admin.products.addNewProduct')}
          </button>
        </div>
      }
    >
      <ProductFilters
        search={search}
        setSearch={setSearch}
        selectedCategories={selectedCategories}
        setSelectedCategories={setSelectedCategories}
        categories={categories}
        categoriesLoading={categoriesLoading}
        stockFilter={stockFilter}
        setStockFilter={setStockFilter}
        publishedFilter={publishedFilter}
        setPublishedFilter={setPublishedFilter}
        onClearFilters={handleClearFilters}
        setPage={setPage}
      />

      {selectedIds.size > 0 ? (
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-stretch sm:gap-4">
          <BulkSelectionControls
            selectedCount={selectedIds.size}
            onBulkDelete={handlers.handleBulkDelete}
            bulkDeleting={bulkDeleting}
            wrapperClassName="flex min-h-[72px] min-w-0 flex-1 flex-col"
          />
        </div>
      ) : null}

      <ProductsTable
        loading={loading}
        sortedProducts={sortedProducts}
        products={products}
        selectedIds={selectedIds}
        toggleSelect={handlers.toggleSelect}
        toggleSelectAll={handlers.toggleSelectAll}
        sortBy={sortBy}
        handleHeaderSort={handleHeaderSort}
        currency={currency}
        handleDeleteProduct={handlers.handleDeleteProduct}
        handleTogglePublished={handlers.handleTogglePublished}
        handleToggleFeatured={handlers.handleToggleFeatured}
        deletingIds={deletingIds}
        updatingPublishedIds={updatingPublishedIds}
        updatingFeaturedIds={updatingFeaturedIds}
        meta={meta}
        totalCount={loading ? null : (meta?.total ?? 0)}
        page={page}
        setPage={setPage}
        categoryTitleById={categoryTitleById}
        onEditProduct={openEditProduct}
      />

      <ProductEditorSheet
        open={sheetOpen}
        productId={sheetProductId}
        listProduct={editingListProduct}
        onClose={closeProductEditor}
        onSaved={handleProductSaved}
      />
    </AdminPageLayout>
  );
}
