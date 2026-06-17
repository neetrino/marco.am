'use client';

import { useRouter, usePathname } from 'next/navigation';
import { pushShopProductsListingUrl } from '../../lib/push-shop-products-listing-url';
import type { FormEvent } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { setStoredCurrency, type CurrencyCode, formatPrice } from '../../lib/currency';
import { getStoredLanguage } from '../../lib/language';
import { useInstantSearch } from '../hooks/useInstantSearch';
import { useAuth } from '../../lib/auth/AuthContext';
import { apiClient } from '../../lib/api-client';
import { useCartSummary } from '../../lib/cart/cart-summary-context';
import { useHeaderStorageCounts } from './useHeaderStorageCounts';
import { useHeaderCurrency } from './useHeaderCurrency';
import { useTranslation } from '../../lib/i18n-client';
import { subscribeShopCategoryTreeUpdated } from '../../lib/shop-category-tree-sync';
import { isLightMarketingRoute } from '../../lib/light-marketing-routes';
import type { Category, CategoriesResponse } from './category-nav-types';
import { prepareRootCategoriesForNav } from './categoryNavList';
import { prefetchMegaMenuCategories } from './megaMenuQueries';
import { queryKeys } from '../../lib/query-keys';

const PRODUCTS_PATH_PREFIX = '/products';

export function useHeaderData() {
  const router = useRouter();
  const pathname = usePathname() ?? '';
  const { isLoggedIn, logout, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const [compareCount, setCompareCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const { cartCount, cartTotal, cartTotalCurrency, fetchCart } = useCartSummary();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLocaleCurrencyMenu, setShowLocaleCurrencyMenu] = useState(false);
  const [showProductsMenu, setShowProductsMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>('AMD');
  const [categoryLanguage, setCategoryLanguage] = useState(() => getStoredLanguage());
  const [categories, setCategories] = useState<Category[]>([]);
  const [, setSelectedCategory] = useState<Category | null>(null);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const categoriesLoadedRef = useRef(false);
  const currentYear = new Date().getFullYear();
  const isProfileRoute = pathname === '/profile';
  const shouldRunBackgroundSync = !isProfileRoute;
  const shouldEagerLoadCategories = pathname.startsWith(PRODUCTS_PATH_PREFIX);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const productsMenuRef = useRef<HTMLDivElement>(null);
  const inlineSearchRef = useRef<HTMLDivElement>(null);
  const headerSearchInputRef = useRef<HTMLInputElement>(null);

  const {
    query: searchQuery,
    setQuery: setSearchQuery,
    results: searchResults,
    loading: searchLoading,
    error: searchError,
    isOpen: searchDropdownOpen,
    setIsOpen: setSearchDropdownOpen,
    selectedIndex: searchSelectedIndex,
    handleKeyDown: searchHandleKeyDown,
    clearSearch,
  } = useInstantSearch({
    debounceMs: 200,
    minQueryLength: 1,
    maxResults: 6,
    lang: getStoredLanguage(),
  });

  const refreshCartOnAuth = useCallback(() => {
    void fetchCart();
  }, [fetchCart]);

  useHeaderStorageCounts(setWishlistCount, setCompareCount, refreshCartOnAuth, {
    enabled: shouldRunBackgroundSync,
  });

  useHeaderCurrency(setSelectedCurrency, { enabled: shouldRunBackgroundSync });

  const fetchCategories = useCallback(async () => {
    await queryClient.fetchQuery({
      queryKey: queryKeys.categoriesTree(categoryLanguage),
      queryFn: async () => {
        const response = await apiClient.get<CategoriesResponse>('/api/v1/categories/tree', {
          params: { lang: categoryLanguage },
        });
        return response.data ?? [];
      },
      staleTime: 300_000,
    });
  }, [categoryLanguage, queryClient]);

  const categoriesQuery = useQuery({
    queryKey: queryKeys.categoriesTree(categoryLanguage),
    queryFn: async () => {
      const response = await apiClient.get<CategoriesResponse>('/api/v1/categories/tree', {
        params: { lang: categoryLanguage },
      });
      return response.data ?? [];
    },
    staleTime: 300_000,
    enabled: shouldEagerLoadCategories || mobileMenuOpen,
  });

  useEffect(() => {
    if (!categoriesQuery.data) {
      return;
    }
    setCategories(categoriesQuery.data);
    categoriesLoadedRef.current = categoriesQuery.data.length > 0;
  }, [categoriesQuery.data]);

  useEffect(() => {
    setLoadingCategories(categoriesQuery.isFetching);
  }, [categoriesQuery.isFetching]);

  useEffect(() => {
    if (shouldEagerLoadCategories) {
      void fetchCategories();
    }
  }, [shouldEagerLoadCategories, fetchCategories]);

  useEffect(() => {
    if (isProfileRoute || isLightMarketingRoute(pathname)) {
      return;
    }

    const runPrefetch = () => prefetchMegaMenuCategories(queryClient, categoryLanguage);
    if (typeof requestIdleCallback !== 'undefined') {
      const idleId = requestIdleCallback(runPrefetch, { timeout: 2_000 });
      return () => cancelIdleCallback(idleId);
    }

    const timeoutId = window.setTimeout(runPrefetch, 500);
    return () => window.clearTimeout(timeoutId);
  }, [categoryLanguage, isProfileRoute, pathname, queryClient]);

  useEffect(() => {
    if (!mobileMenuOpen || categoriesLoadedRef.current) {
      return;
    }
    void fetchCategories();
  }, [mobileMenuOpen, fetchCategories]);

  useEffect(() => {
    return subscribeShopCategoryTreeUpdated(() => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.categoriesTreeRoot(),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.megaMenuRootsRoot(),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.megaMenuBranchRoot(),
      });
    });
  }, [queryClient]);

  useEffect(() => {
    const onLanguage = () => {
      const nextLang = getStoredLanguage();
      setCategoryLanguage(nextLang);
      prefetchMegaMenuCategories(queryClient, nextLang);
      if (categoriesLoadedRef.current || shouldEagerLoadCategories || showProductsMenu) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.categoriesTreeRoot(),
        });
      }
    };
    window.addEventListener('language-updated', onLanguage);
    return () => window.removeEventListener('language-updated', onLanguage);
  }, [queryClient, shouldEagerLoadCategories, showProductsMenu]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (productsMenuRef.current && !productsMenuRef.current.contains(event.target as Node)) {
        const el = event.target as HTMLElement | null;
        const insideMega =
          el?.closest?.('[data-marco-categories-dropdown]') ||
          el?.closest?.('[data-marco-categories-bridge]');
        if (!insideMega) {
          setShowProductsMenu(false);
        }
      }
      if (inlineSearchRef.current && !inlineSearchRef.current.contains(event.target as Node)) {
        setSearchDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [setSearchDropdownOpen]);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    if (mobileMenuOpen) {
      const previousOverflow = document.body.style.overflow;
      const previousPointerEvents = document.body.style.pointerEvents;
      document.body.style.overflow = 'hidden';
      /** Block taps reaching page content under the mobile drawer (images, links). */
      document.body.style.pointerEvents = 'none';
      return () => {
        document.body.style.overflow = previousOverflow;
        document.body.style.pointerEvents = previousPointerEvents;
      };
    }
  }, [mobileMenuOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') {
        return;
      }
      if (mobileMenuOpen) {
        setMobileMenuOpen(false);
        return;
      }
      if (showProductsMenu) {
        setShowProductsMenu(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [mobileMenuOpen, showProductsMenu]);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    const selected = searchSelectedIndex >= 0 && searchResults[searchSelectedIndex];
    if (selected) {
      router.push(`/products/${selected.slug}`);
      clearSearch();
      return;
    }
    const params = new URLSearchParams();
    if (query) {
      params.set('search', query);
    }
    clearSearch();
    const queryString = params.toString();
    pushShopProductsListingUrl(router, queryString ? `/products?${queryString}` : '/products');
  };

  const handleCurrencyChange = (currency: CurrencyCode) => {
    setStoredCurrency(currency);
    setSelectedCurrency(currency);
    window.dispatchEvent(new Event('currency-updated'));
  };

  const getRootCategories = (cats: Category[]): Category[] =>
    prepareRootCategoriesForNav(cats, getStoredLanguage());

  return {
    router,
    t,
    isLoggedIn,
    logout,
    isAdmin,
    compareCount,
    wishlistCount,
    cartCount,
    cartTotal,
    cartTotalCurrency,
    showUserMenu,
    setShowUserMenu,
    showLocaleCurrencyMenu,
    setShowLocaleCurrencyMenu,
    showProductsMenu,
    setShowProductsMenu,
    mobileMenuOpen,
    setMobileMenuOpen,
    selectedCurrency,
    categories,
    setSelectedCategory,
    loadingCategories,
    currentYear,
    userMenuRef,
    productsMenuRef,
    inlineSearchRef,
    headerSearchInputRef,
    searchQuery,
    setSearchQuery,
    searchResults,
    searchLoading,
    searchError,
    searchDropdownOpen,
    setSearchDropdownOpen,
    searchSelectedIndex,
    searchHandleKeyDown,
    clearSearch,
    fetchCart,
    handleSearch,
    handleCurrencyChange,
    getRootCategories,
    formatPrice,
    prefetchMegaMenu: () => prefetchMegaMenuCategories(queryClient, categoryLanguage),
  };
}
