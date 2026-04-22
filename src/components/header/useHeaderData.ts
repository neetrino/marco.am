'use client';

import { useRouter } from 'next/navigation';
import type { FormEvent } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { setStoredCurrency, type CurrencyCode, formatPrice } from '../../lib/currency';
import { getStoredLanguage } from '../../lib/language';
import { useInstantSearch } from '../hooks/useInstantSearch';
import { useAuth } from '../../lib/auth/AuthContext';
import { apiClient } from '../../lib/api-client';
import { CART_KEY } from '../../lib/storageCounts';
import { useHeaderStorageCounts } from './useHeaderStorageCounts';
import { useHeaderCurrency } from './useHeaderCurrency';
import { useTranslation } from '../../lib/i18n-client';
import type { Category, CategoriesResponse } from './category-nav-types';

export function useHeaderData() {
  const router = useRouter();
  const { isLoggedIn, logout, isAdmin } = useAuth();
  const { t } = useTranslation();

  const [compareCount, setCompareCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const [cartTotal, setCartTotal] = useState(0);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLocaleCurrencyMenu, setShowLocaleCurrencyMenu] = useState(false);
  const [showProductsMenu, setShowProductsMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>('AMD');
  const [categories, setCategories] = useState<Category[]>([]);
  const [, setSelectedCategory] = useState<Category | null>(null);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const currentYear = new Date().getFullYear();

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

  const fetchCart = useCallback(async () => {
    if (!isLoggedIn) {
      if (typeof window === 'undefined') {
        setCartCount(0);
        setCartTotal(0);
        return;
      }

      try {
        const stored = localStorage.getItem(CART_KEY);
        const guestCart: Array<{
          productId: string;
          productSlug?: string;
          variantId: string;
          quantity: number;
          price?: number;
        }> = stored ? JSON.parse(stored) : [];

        if (guestCart.length === 0) {
          setCartCount(0);
          setCartTotal(0);
          return;
        }

        const itemsCount = guestCart.reduce((sum, item) => sum + item.quantity, 0);
        const total = guestCart.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0);
        setCartCount(itemsCount);
        setCartTotal(total);
      } catch (error) {
        console.error('Error loading guest cart:', error);
        setCartCount(0);
        setCartTotal(0);
      }
      return;
    }

    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setCartCount(0);
        setCartTotal(0);
        return;
      }
    }

    try {
      const response = await apiClient.get<{
        cart: {
          itemsCount: number;
          totals: { total: number };
        };
      }>('/api/v1/cart');

      setCartCount(response.cart?.itemsCount || 0);
      setCartTotal(response.cart?.totals?.total || 0);
    } catch (error: unknown) {
      const err = error as { status?: number; statusCode?: number };
      if (err?.status !== 401 && err?.statusCode !== 401) {
        console.error('Error fetching cart:', error);
      }
      setCartCount(0);
      setCartTotal(0);
    }
  }, [isLoggedIn]);

  const refreshCartOnAuth = useCallback(() => {
    fetchCart();
  }, [fetchCart]);

  useHeaderStorageCounts(setWishlistCount, setCompareCount, refreshCartOnAuth);

  useEffect(() => {
    const handleCartUpdate = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      if (detail?.optimisticAdd) {
        setCartCount((c) => c + (detail.optimisticAdd.quantity ?? 1));
        setCartTotal((tot) => tot + (detail.optimisticAdd.price ?? 0) * (detail.optimisticAdd.quantity ?? 1));
        return;
      }
      if (detail?.itemsCount !== undefined && detail?.total !== undefined) {
        setCartCount(detail.itemsCount);
        setCartTotal(detail.total);
        return;
      }
      fetchCart();
    };

    window.addEventListener('cart-updated', handleCartUpdate);

    return () => {
      window.removeEventListener('cart-updated', handleCartUpdate);
    };
  }, [fetchCart]);

  useEffect(() => {
    fetchCart();
  }, [isLoggedIn, fetchCart]);

  useHeaderCurrency(setSelectedCurrency);

  const fetchCategories = useCallback(async () => {
    try {
      setLoadingCategories(true);
      await new Promise((resolve) => setTimeout(resolve, 200));

      const response = await apiClient.get<CategoriesResponse>('/api/v1/categories/tree', {
        params: { lang: getStoredLanguage() },
      });
      setCategories(response.data || []);
    } catch (err: unknown) {
      console.error('Error fetching categories:', err);
      setCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    const onLanguage = () => {
      fetchCategories();
    };
    window.addEventListener('language-updated', onLanguage);
    return () => window.removeEventListener('language-updated', onLanguage);
  }, [fetchCategories]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (productsMenuRef.current && !productsMenuRef.current.contains(event.target as Node)) {
        setShowProductsMenu(false);
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
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [mobileMenuOpen]);

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
    router.push(queryString ? `/products?${queryString}` : '/products');
  };

  const handleCurrencyChange = (currency: CurrencyCode) => {
    setStoredCurrency(currency);
    setSelectedCurrency(currency);
    window.dispatchEvent(new Event('currency-updated'));
  };

  const getRootCategories = (cats: Category[]): Category[] => cats;

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
  };
}
