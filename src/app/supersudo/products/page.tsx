'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../../../lib/auth/AuthContext';
import { apiClient, getApiOrErrorMessage } from '../../../lib/api-client';
import { useTranslation } from '../../../lib/i18n-client';
import { getStoredCurrency, initializeCurrencyRates, type CurrencyCode } from '../../../lib/currency';
import { AdminPageLayout } from '../components/AdminPageLayout';
import { ProductFilters } from './components/ProductFilters';
import { BulkSelectionControls } from './components/BulkSelectionControls';
import { ProductsTable } from './components/ProductsTable';
import { useProductHandlers } from './hooks/useProductHandlers';
import type { Product, ProductsResponse, Category } from './types';
import { logger } from "@/lib/utils/logger";

export default function ProductsPage() {
  const { t } = useTranslation();
  const { isLoggedIn, isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesExpanded, setCategoriesExpanded] = useState(false);
  const [skuSearch, setSkuSearch] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'inStock' | 'outOfStock'>('all');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<ProductsResponse['meta'] | null>(null);
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('createdAt-desc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [_togglingAllFeatured, setTogglingAllFeatured] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [updatingPublishedIds, setUpdatingPublishedIds] = useState<Set<string>>(new Set());
  const [updatingFeaturedIds, setUpdatingFeaturedIds] = useState<Set<string>>(new Set());
  const [currency, setCurrency] = useState<CurrencyCode>('USD');

  useEffect(() => {
    if (!isLoading) {
      if (!isLoggedIn || !isAdmin) {
        router.push('/supersudo');
        return;
      }
    }
  }, [isLoggedIn, isAdmin, isLoading, router]);

  // Initialize currency rates and listen for currency changes
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

  // Fetch categories on mount
  useEffect(() => {
    if (isLoggedIn && isAdmin) {
      fetchCategories();
    }
  }, [isLoggedIn, isAdmin]);

  // Close category dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (categoriesExpanded && !target.closest('[data-category-dropdown]')) {
        setCategoriesExpanded(false);
      }
    };

    if (categoriesExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [categoriesExpanded]);

  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);
      logger.devLog('📂 [ADMIN] Fetching categories...');
      const response = await apiClient.get<{ data: Category[] }>('/api/v1/supersudo/categories');
      setCategories(response.data || []);
      logger.devLog('✅ [ADMIN] Categories loaded:', response.data?.length || 0);
    } catch (err: unknown) {
      console.error('❌ [ADMIN] Error fetching categories:', err);
      setCategories([]);
    } finally {
      setCategoriesLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn && isAdmin) {
      fetchProducts();
    }
     
  }, [isLoggedIn, isAdmin, page, search, selectedCategories, skuSearch, stockFilter, sortBy, minPrice, maxPrice]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {
        page: page.toString(),
        limit: '20',
      };
      
      if (search.trim()) {
        params.search = search.trim();
      }

      if (selectedCategories.size > 0) {
        params.category = Array.from(selectedCategories).join(',');
      }

      if (skuSearch.trim()) {
        params.sku = skuSearch.trim();
      }

      if (minPrice.trim()) {
        params.minPrice = minPrice.trim();
      }

      if (maxPrice.trim()) {
        params.maxPrice = maxPrice.trim();
      }

      if (sortBy && sortBy.startsWith('createdAt')) {
        params.sort = sortBy;
      }

      const response = await apiClient.get<ProductsResponse>('/api/v1/supersudo/products', {
        params,
      });
      
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
    } catch (err: unknown) {
      console.error('❌ [ADMIN] Error fetching products:', err);
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
    setSkuSearch('');
    setStockFilter('all');
    setPage(1);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('admin.common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn || !isAdmin) {
    return null;
  }

  const currentPath = pathname || '/supersudo/products';

  return (
    <AdminPageLayout
      currentPath={currentPath}
      router={router}
      t={t}
      title={t('admin.products.title')}
      backLabel={t('admin.products.backToAdmin')}
      onBack={() => router.push('/supersudo')}
      headerActions={
        <div className="flex flex-wrap items-center justify-end gap-2">
          {(search || selectedCategories.size > 0 || skuSearch || stockFilter !== 'all') ? (
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
            onClick={() => router.push('/supersudo/products/add')}
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
        skuSearch={skuSearch}
        setSkuSearch={setSkuSearch}
        selectedCategories={selectedCategories}
        setSelectedCategories={setSelectedCategories}
        categories={categories}
        categoriesLoading={categoriesLoading}
        categoriesExpanded={categoriesExpanded}
        setCategoriesExpanded={setCategoriesExpanded}
        stockFilter={stockFilter}
        setStockFilter={setStockFilter}
        minPrice={minPrice}
        setMinPrice={setMinPrice}
        maxPrice={maxPrice}
        setMaxPrice={setMaxPrice}
        handleSearch={handlers.handleSearch}
        handleClearFilters={handleClearFilters}
        setPage={setPage}
      />

      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-stretch sm:gap-4">
        <div className="flex min-h-[72px] shrink-0 items-center rounded-2xl border border-slate-200/80 bg-white/95 px-4 py-3 shadow-sm shadow-slate-200/60 sm:max-w-[min(100%,20rem)]">
          <p className="text-sm font-medium text-slate-700">
            <span>{t('admin.products.title')}</span>
            <span className="ml-1.5 font-normal tabular-nums text-slate-500">
              ({loading ? '…' : (meta?.total ?? 0)})
            </span>
          </p>
        </div>
        <BulkSelectionControls
          selectedCount={selectedIds.size}
          onBulkDelete={handlers.handleBulkDelete}
          bulkDeleting={bulkDeleting}
          wrapperClassName="flex min-h-[72px] min-w-0 flex-1 flex-col"
        />
      </div>

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
        page={page}
        setPage={setPage}
      />
    </AdminPageLayout>
  );
}
