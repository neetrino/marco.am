'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useRef, Suspense } from 'react';
import type { FormEvent, ReactNode, CSSProperties } from 'react';
import { getStoredCurrency, setStoredCurrency, type CurrencyCode, CURRENCIES, formatPrice, initializeCurrencyRates, clearCurrencyRatesCache } from '../lib/currency';
import { useTranslation } from '../lib/i18n-client';
import { getStoredLanguage } from '../lib/language';
import { useInstantSearch } from './hooks/useInstantSearch';
import { SearchDropdown } from './SearchDropdown';
import { useAuth } from '../lib/auth/AuthContext';
import { apiClient } from '../lib/api-client';
import { CART_KEY, getCompareCount, getWishlistCount } from '../lib/storageCounts';
import { LanguageSwitcherHeader } from './LanguageSwitcherHeader';
import { CompareIcon } from './icons/CompareIcon';
import { CartIcon } from './icons/CartIcon';
import { HEADER_NAV_LINKS } from './Header/headerConfig';
import { HeaderTopNav } from './Header/HeaderTopNav';
import { HeaderActionBar } from './Header/HeaderActionBar';
import { CartButton } from './Header/CartButton';

interface Category {
  id: string;
  slug: string;
  title: string;
  fullPath: string;
  children: Category[];
}

interface CategoriesResponse {
  data: Category[];
}

// Icon Components
const ChevronDownIcon = () => (
  <svg width="10" height="10" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Arrow icon for categories with subcategories (▶)
const ArrowRightIcon = () => (
  <svg width="8" height="8" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg" className="ml-auto">
    <path d="M3 2L5 4L3 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/**
 * Profile icon for logged out state (outline style)
 */
const ProfileIconOutline = () => (
  <svg width="19" height="19" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="10" cy="7" r="3.2" stroke="currentColor" strokeWidth="1.8" fill="none" />
    <path d="M5 17C5 14.5 7.5 12.5 10 12.5C12.5 12.5 15 14.5 15 17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

/**
 * Profile icon for logged in state (filled style with background)
 */
const ProfileIconFilled = () => (
  <div className="relative w-[19px] h-[19px] flex items-center justify-center">
    {/* Background circle */}
    <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full opacity-90 group-hover:opacity-100 transition-opacity duration-200 shadow-md"></div>
    {/* Filled icon */}
    <svg 
      width="19" 
      height="19" 
      viewBox="0 0 20 20" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className="relative z-10"
    >
      <circle cx="10" cy="7" r="3.2" fill="white" />
      <path d="M5 17C5 14.5 7.5 12.5 10 12.5C12.5 12.5 15 14.5 15 17" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  </div>
);

const WishlistIcon = () => (
  <svg width="19" height="19" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 17L8.55 15.7C4.4 12.2 2 10.1 2 7.5C2 5.4 3.4 4 5.5 4C6.8 4 8.1 4.6 9 5.5C9.9 4.6 11.2 4 12.5 4C14.6 4 16 5.4 16 7.5C16 10.1 13.6 12.2 9.45 15.7L10 17Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

const SearchIcon = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="10" cy="10" r="6.5" stroke="currentColor" strokeWidth="1.8" fill="none" />
    <path d="M15.5 15.5L19 19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

interface BadgeIconProps {
  icon: ReactNode;
  badge?: number;
  className?: string;
  iconClassName?: string;
}

const BadgeIcon = ({ icon, badge = 0, className = '', iconClassName = '' }: BadgeIconProps) => (
  <div className={`relative ${className}`}>
    <div className={iconClassName}>
      {icon}
    </div>
    {badge > 0 && (
      <span className="
      absolute 
      -top-5 
      -right-5 
      bg-gradient-to-br from-red-500 to-red-600 
      text-white text-[10px] font-bold 
      rounded-full min-w-[20px] h-5 px-1.5 
      flex items-center justify-center 
      leading-none shadow-lg border-2 border-white 
      animate-pulse
    ">
        {badge > 99 ? '99+' : badge}
      </span>
    )}
  </div>
);

/**
 * Component that syncs search params with state
 * Must be wrapped in Suspense because it uses useSearchParams()
 */
function HeaderSearchSync({
  setSearchQuery,
  setSelectedCategory,
  categories,
}: {
  setSearchQuery: (_query: string) => void;
  setSelectedCategory: (_category: Category | null) => void;
  categories: Category[];
}) {
  const searchParams = useSearchParams();

  useEffect(() => {
    const searchParam = searchParams.get('search');
    const categoryParam = searchParams.get('category');
    setSearchQuery(searchParam || '');
    
    // Set selected category from URL
    if (categoryParam && categories.length > 0) {
      const flattenCategories = (cats: Category[]): Category[] => {
        const result: Category[] = [];
        cats.forEach((cat) => {
          result.push(cat);
          if (cat.children && cat.children.length > 0) {
            result.push(...flattenCategories(cat.children));
          }
        });
        return result;
      };
      const allCategories = flattenCategories(categories);
      const foundCategory = allCategories.find((cat) => cat.slug === categoryParam);
      setSelectedCategory(foundCategory || null);
    } else {
      setSelectedCategory(null);
    }
  }, [searchParams, categories, setSearchQuery, setSelectedCategory]);

  return null;
}

/**
 * Category Menu Item Component with nested submenu support
 * Displays subcategories in a multi-column layout without scroll
 */
function CategoryMenuItem({ 
  category, 
  onClose 
}: { 
  category: Category; 
  onClose: () => void;
}) {
  const [showSubmenu, setShowSubmenu] = useState(false);
  const [submenuStyle, setSubmenuStyle] = useState<CSSProperties>({});
  const submenuTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const submenuRef = useRef<HTMLDivElement>(null);
  const menuItemRef = useRef<HTMLDivElement>(null);
  const hasChildren = category.children && category.children.length > 0;

  const handleMouseEnter = () => {
    if (hasChildren) {
      if (submenuTimeoutRef.current) {
        clearTimeout(submenuTimeoutRef.current);
        submenuTimeoutRef.current = null;
      }
      setShowSubmenu(true);
    }
  };

  const handleMouseLeave = () => {
    if (hasChildren) {
      submenuTimeoutRef.current = setTimeout(() => {
        setShowSubmenu(false);
      }, 150);
    }
  };

  useEffect(() => {
    return () => {
      if (submenuTimeoutRef.current) {
        clearTimeout(submenuTimeoutRef.current);
      }
    };
  }, []);

  // Calculate submenu position relative to Products dropdown
  useEffect(() => {
    if (showSubmenu && submenuRef.current && menuItemRef.current) {
      const menuItem = menuItemRef.current;
      
      // Find Products dropdown container (parent with w-64 class)
      const productsDropdown = menuItem.closest('.w-64');
      if (productsDropdown) {
        const dropdownRect = productsDropdown.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        
        // Position submenu to the right of Products dropdown, aligned higher than dropdown
        const leftPosition = dropdownRect.width; // Right edge of Products dropdown
        const topPosition = -12; // Move up a bit from top of dropdown
        const maxWidth = Math.min(600, viewportWidth - dropdownRect.right - 20);
        
        setSubmenuStyle({
          left: `${leftPosition}px`,
          top: `${topPosition}px`,
          maxWidth: `${maxWidth}px`
        });
      }
    }
  }, [showSubmenu]);

  // Organize subcategories into columns (4 columns max)
  // Distributes items evenly across columns
  const organizeIntoColumns = (items: Category[], columnsCount: number = 4) => {
    if (items.length === 0) return [];
    
    // Calculate optimal number of columns based on items count
    const optimalColumns = Math.min(columnsCount, Math.ceil(items.length / 8));
    const itemsPerColumn = Math.ceil(items.length / optimalColumns);
    const columns: Category[][] = [];
    
    for (let i = 0; i < optimalColumns; i++) {
      const start = i * itemsPerColumn;
      const end = start + itemsPerColumn;
      const column = items.slice(start, end);
      if (column.length > 0) {
        columns.push(column);
      }
    }
    
    return columns;
  };

  const subcategoryColumns = hasChildren 
    ? organizeIntoColumns(category.children, 4)
    : [];

  return (
    <div 
      ref={menuItemRef}
      className="relative group"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Link
        href={`/products?category=${category.slug}`}
        className="flex items-center justify-between px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-all duration-150"
        onClick={onClose}
      >
        <span>{category.title}</span>
        {hasChildren && (
          <ArrowRightIcon />
        )}
      </Link>
      {hasChildren && showSubmenu && (
        <div 
          ref={submenuRef}
          className="absolute top-0 z-[60]"
          style={submenuStyle}
          onMouseEnter={() => {
            if (submenuTimeoutRef.current) {
              clearTimeout(submenuTimeoutRef.current);
              submenuTimeoutRef.current = null;
            }
            setShowSubmenu(true);
          }}
          onMouseLeave={() => {
            submenuTimeoutRef.current = setTimeout(() => {
              setShowSubmenu(false);
            }, 150);
          }}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl border border-gray-200/80 p-6 min-w-[500px]"
          >
            <div 
              className="grid gap-6"
              style={{ gridTemplateColumns: `repeat(${subcategoryColumns.length}, minmax(150px, 1fr))` }}
            >
              {subcategoryColumns.map((column, columnIndex) => (
                <div key={columnIndex} className="flex flex-col">
                  <div className="mb-4 pb-2 border-b border-gray-200">
                    <Link
                      href={`/products?category=${category.slug}`}
                      className="text-sm font-bold text-gray-900 hover:text-gray-700 uppercase tracking-wide"
                      onClick={onClose}
                    >
                      {category.title}
                    </Link>
                  </div>
                  <div className="space-y-2.5">
                    {column.map((subCategory) => (
                      <Link
                        key={subCategory.id}
                        href={`/products?category=${subCategory.slug}`}
                        className="block text-sm text-gray-700 hover:text-gray-900 transition-colors duration-150 py-1"
                        onClick={onClose}
                      >
                        {subCategory.title}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function Header() {
  const router = useRouter();
  const { isLoggedIn, logout, isAdmin } = useAuth();
  const { t } = useTranslation();
  const [compareCount, setCompareCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const [cartTotal, setCartTotal] = useState(0);
  const [showCurrency, setShowCurrency] = useState(false);
  const [showMobileCurrency, setShowMobileCurrency] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showProductsMenu, setShowProductsMenu] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>('AMD');
  const [categories, setCategories] = useState<Category[]>([]);
  const [, setSelectedCategory] = useState<Category | null>(null);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const currentYear = new Date().getFullYear();

  const currencyRef = useRef<HTMLDivElement>(null);
  const mobileCurrencyRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const productsMenuRef = useRef<HTMLDivElement>(null);
  const productsMenuTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchModalRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

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

  const fetchCart = async () => {
    if (!isLoggedIn) {
      if (typeof window === 'undefined') {
        setCartCount(0);
        setCartTotal(0);
        return;
      }

      try {
        const stored = localStorage.getItem(CART_KEY);
        const guestCart: Array<{ productId: string; productSlug?: string; variantId: string; quantity: number; price?: number }> = stored ? JSON.parse(stored) : [];

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
          totals: {
            total: number;
          };
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
  };

  // Load wishlist and compare counts from localStorage
  useEffect(() => {
    const updateCounts = () => {
      setWishlistCount(getWishlistCount());
      setCompareCount(getCompareCount());
    };

    // Initial load
    updateCounts();

    // Listen for updates
    const handleWishlistUpdate = () => {
      setWishlistCount(getWishlistCount());
    };

    const handleCompareUpdate = () => {
      setCompareCount(getCompareCount());
    };

    const handleAuthUpdate = () => {
      // Refresh counts when auth state changes
      updateCounts();
      fetchCart();
    };

    const handleCartUpdate = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      if (detail?.optimisticAdd) {
        setCartCount((c) => c + (detail.optimisticAdd.quantity ?? 1));
        setCartTotal((t) => t + (detail.optimisticAdd.price ?? 0) * (detail.optimisticAdd.quantity ?? 1));
        return;
      }
      if (detail?.itemsCount !== undefined && detail?.total !== undefined) {
        setCartCount(detail.itemsCount);
        setCartTotal(detail.total);
        return;
      }
      fetchCart();
    };

    window.addEventListener('wishlist-updated', handleWishlistUpdate);
    window.addEventListener('compare-updated', handleCompareUpdate);
    window.addEventListener('auth-updated', handleAuthUpdate);
    window.addEventListener('cart-updated', handleCartUpdate);

    return () => {
      window.removeEventListener('wishlist-updated', handleWishlistUpdate);
      window.removeEventListener('compare-updated', handleCompareUpdate);
      window.removeEventListener('auth-updated', handleAuthUpdate);
      window.removeEventListener('cart-updated', handleCartUpdate);
    };
  }, [isLoggedIn]);

  // Fetch cart when logged in state changes
  useEffect(() => {
    fetchCart();
  }, [isLoggedIn]);

  // Load currency from localStorage
  useEffect(() => {
    setSelectedCurrency(getStoredCurrency());

    const handleCurrencyUpdate = () => {
      setSelectedCurrency(getStoredCurrency());
    };

    window.addEventListener('currency-updated', handleCurrencyUpdate);

    return () => {
      window.removeEventListener('currency-updated', handleCurrencyUpdate);
    };
  }, []);

  // Initialize and update currency rates
  useEffect(() => {
    // Load currency rates on mount
    initializeCurrencyRates().catch(console.error);

    // Listen for currency rates updates (when admin changes rates)
    const handleCurrencyRatesUpdate = () => {
      clearCurrencyRatesCache();
      // Force reload to get fresh rates from API
      initializeCurrencyRates(true).catch(console.error);
      // Force re-render by dispatching currency-updated event
      window.dispatchEvent(new Event('currency-updated'));
    };

    window.addEventListener('currency-rates-updated', handleCurrencyRatesUpdate);

    return () => {
      window.removeEventListener('currency-rates-updated', handleCurrencyRatesUpdate);
    };
  }, []);

  // Sync search input with URL params - handled by HeaderSearchSync component wrapped in Suspense

  // Fetch categories (language is always 'en')
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      // Small delay to avoid simultaneous requests
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Language is always 'en'
      const response = await apiClient.get<CategoriesResponse>('/api/v1/categories/tree', {
        params: { lang: 'en' },
      });
      setCategories(response.data || []);
    } catch (err: any) {
      console.error('Error fetching categories:', err);
      setCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  };

  // Get only root categories (parent categories) for main dropdown
  // API already returns root categories in tree structure, so we just return them as-is
  const getRootCategories = (cats: Category[]): Category[] => {
    return cats; // API already returns only root categories
  };

  const selectedCurrencyInfo = CURRENCIES[selectedCurrency];

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (currencyRef.current && !currencyRef.current.contains(event.target as Node)) {
        setShowCurrency(false);
      }
      if (mobileCurrencyRef.current && !mobileCurrencyRef.current.contains(event.target as Node)) {
        setShowMobileCurrency(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (productsMenuRef.current && !productsMenuRef.current.contains(event.target as Node)) {
        setShowProductsMenu(false);
      }
      if (searchModalRef.current && !searchModalRef.current.contains(event.target as Node)) {
        setShowSearchModal(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    if (mobileMenuOpen) {
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = previousOverflow;
      };
    }
  }, [mobileMenuOpen]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (productsMenuTimeoutRef.current) {
        clearTimeout(productsMenuTimeoutRef.current);
      }
    };
  }, []);

  // Focus search input when modal opens; show dropdown if query present
  useEffect(() => {
    if (showSearchModal && searchInputRef.current) {
      searchInputRef.current.focus();
      setSearchDropdownOpen(searchQuery.trim().length >= 1);
    } else {
      setSearchDropdownOpen(false);
    }
  }, [showSearchModal, searchQuery]);

  // Close search modal on ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') {
        return;
      }

      if (showSearchModal) {
        setShowSearchModal(false);
      }

      if (mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showSearchModal, mobileMenuOpen]);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    const selected = searchSelectedIndex >= 0 && searchResults[searchSelectedIndex];
    setShowSearchModal(false);
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

  /**
   * Updates currency selection and notifies the app with a visible log entry.
   */
  const handleCurrencyChange = (currency: CurrencyCode) => {
    console.info('[Header][LangCurrency] Currency changed', {
      from: selectedCurrency,
      to: currency,
    });
    setStoredCurrency(currency);
    setSelectedCurrency(currency);
    setShowCurrency(false);
    // Trigger currency update event to refresh prices
    window.dispatchEvent(new Event('currency-updated'));
  };

  const phoneDisplay = t('contact.phone');
  const locationDropdown = (
    <Link
      href="/contact#addresses"
      className="text-gray-700 font-medium hover:text-gray-900 transition-colors text-sm"
    >
      {t('common.navigation.addresses')}
    </Link>
  );

  const categoryDropdown = (
    <div
      className="relative"
      ref={productsMenuRef}
      onMouseEnter={() => {
        if (productsMenuTimeoutRef.current) {
          clearTimeout(productsMenuTimeoutRef.current);
          productsMenuTimeoutRef.current = null;
        }
        setShowProductsMenu(true);
      }}
      onMouseLeave={() => {
        productsMenuTimeoutRef.current = setTimeout(() => setShowProductsMenu(false), 150);
      }}
    >
      <Link
        href="/products"
        className="h-11 px-5 rounded-full bg-gray-800 text-white text-sm font-medium flex items-center gap-2 hover:bg-gray-900 transition-colors shrink-0"
      >
        {t('common.navigation.categories')}
        <ChevronDownIcon />
      </Link>
      {showProductsMenu && (
        <>
          <div className="absolute top-full left-0 w-full h-2" />
          <div className="absolute top-full left-0 pt-2 w-64 z-50">
            <div className="bg-white rounded-xl shadow-2xl border border-gray-200/80 overflow-visible">
              {loadingCategories ? (
                <div className="px-4 py-2 text-sm text-gray-500">{t('common.messages.loading')}</div>
              ) : (
                getRootCategories(categories).map((category) => (
                  <CategoryMenuItem
                    key={category.id}
                    category={category}
                    onClose={() => setShowProductsMenu(false)}
                  />
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );

  const currencySwitcher = (
    <div className="relative" ref={currencyRef}>
      <button
        type="button"
        onClick={() => setShowCurrency(!showCurrency)}
        className="h-10 px-4 rounded-full bg-gray-100 text-gray-800 text-sm font-medium flex items-center gap-2 hover:bg-gray-200 transition-colors"
        aria-expanded={showCurrency}
        aria-haspopup="listbox"
      >
        <span className="leading-none">{selectedCurrencyInfo.symbol}</span>
        <span className="leading-none">{selectedCurrency}</span>
        <ChevronDownIcon />
      </button>
      {showCurrency && (
        <div
          className="absolute top-full right-0 mt-2 w-40 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden"
          role="listbox"
        >
          {Object.values(CURRENCIES).map((currency) => (
            <button
              key={currency.code}
              type="button"
              role="option"
              aria-selected={selectedCurrency === currency.code}
              onClick={() => handleCurrencyChange(currency.code)}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${selectedCurrency === currency.code ? 'bg-gray-50 text-gray-900 font-semibold' : 'text-gray-700 hover:bg-gray-50'}`}
            >
              <span className="mr-2">{currency.code}</span>
              <span className="text-gray-500">{currency.symbol}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const themeButton = (
    <button
      type="button"
      className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition-colors shrink-0"
      aria-label="Toggle theme"
    >
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
      </svg>
    </button>
  );

  const accountButton = (
    <div className="relative" ref={userMenuRef}>
      {isLoggedIn ? (
        <>
          <button
            type="button"
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors shrink-0"
            aria-expanded={showUserMenu}
            aria-haspopup="menu"
          >
            <ProfileIconFilled />
          </button>
          {showUserMenu && (
            <div className="absolute top-full right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden" role="menu">
              <Link href="/profile" className="block px-5 py-3 text-sm text-gray-700 hover:bg-gray-50 font-medium border-b border-gray-100" onClick={() => setShowUserMenu(false)}>
                {t('common.navigation.profile')}
              </Link>
              {isAdmin && (
                <Link href="/admin" className="block px-5 py-3 text-sm text-blue-600 hover:bg-blue-50 font-medium border-b border-gray-100" onClick={() => setShowUserMenu(false)}>
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    {t('common.navigation.adminPanel')}
                  </span>
                </Link>
              )}
              <button type="button" onClick={() => { setShowUserMenu(false); logout(); }} className="block w-full text-left px-5 py-3 text-sm text-red-600 hover:bg-red-50 font-medium">
                {t('common.navigation.logout')}
              </button>
            </div>
          )}
        </>
      ) : (
        <Link href="/login" className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors shrink-0" aria-label="Account">
          <ProfileIconOutline />
        </Link>
      )}
    </div>
  );

  const compareLink = (
    <Link href="/compare" className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition-colors relative shrink-0" aria-label={t('common.navigation.compare')}>
      <BadgeIcon icon={<CompareIcon size={18} />} badge={compareCount} />
    </Link>
  );

  const wishlistLink = (
    <Link href="/wishlist" className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition-colors relative shrink-0" aria-label={t('common.navigation.wishlist')}>
      <BadgeIcon icon={<WishlistIcon />} badge={wishlistCount} />
    </Link>
  );

  const cartButtonNode = (
    <CartButton
      totalFormatted={formatPrice(cartTotal, selectedCurrency)}
      icon={<CartIcon size={20} />}
      badge={cartCount}
    />
  );

  return (
    <header className="bg-white sticky top-0 z-50 border-b border-gray-100 shadow-sm">
      <Suspense fallback={null}>
        <HeaderSearchSync setSearchQuery={setSearchQuery} setSelectedCategory={setSelectedCategory} categories={categories} />
      </Suspense>

      {/* Mobile: hamburger + logo row */}
      <div className="flex md:hidden items-center justify-between px-4 py-3 border-b border-gray-100">
        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 hover:bg-gray-200"
          aria-label={t('common.ariaLabels.openMenu')}
          aria-expanded={mobileMenuOpen}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7h16M4 12h16M4 17h16" /></svg>
        </button>
        <Link href="/" className="text-lg font-semibold text-gray-900">White-Shop</Link>
        <div className="flex items-center gap-1">
          <div className="relative" ref={mobileCurrencyRef}>
            <button type="button" onClick={() => setShowMobileCurrency(!showMobileCurrency)} className="flex h-9 items-center gap-1 px-2 text-sm font-medium text-gray-800">
              <span>{selectedCurrencyInfo.symbol}</span>
              <span>{selectedCurrency}</span>
              <ChevronDownIcon />
            </button>
            {showMobileCurrency && (
              <div className="absolute top-full right-0 mt-2 w-40 bg-white rounded-xl shadow-xl border border-gray-100 z-50">
                {Object.values(CURRENCIES).map((currency) => (
                  <button key={currency.code} type="button" onClick={() => { handleCurrencyChange(currency.code); setShowMobileCurrency(false); }} className={`w-full text-left px-4 py-2.5 text-sm ${selectedCurrency === currency.code ? 'bg-gray-50 font-semibold' : 'hover:bg-gray-50'}`}>
                    {currency.code} {currency.symbol}
                  </button>
                ))}
              </div>
            )}
          </div>
          <LanguageSwitcherHeader />
        </div>
      </div>

      {/* Desktop: Top bar + Action bar */}
      <div className="hidden md:block">
        <HeaderTopNav
          t={t}
          phoneDisplay={phoneDisplay}
          instagramUrl={t('contact.social.instagram') || '#'}
          facebookUrl={t('contact.social.facebook') || '#'}
          linkedinUrl={t('contact.social.linkedin') || '#'}
          languageSwitcher={<LanguageSwitcherHeader />}
          locationDropdown={locationDropdown}
        />
        <HeaderActionBar
          t={t}
          searchPlaceholder={t('common.placeholders.search')}
          searchCtaLabel={t('common.buttons.search')}
          categoryLabel={t('common.navigation.categories')}
          categoryDropdown={categoryDropdown}
          onSearchClick={() => { setShowSearchModal(true); setShowCurrency(false); }}
          searchInputRef={searchInputRef}
          searchValue={searchQuery}
          onSearchChange={(v) => { setSearchQuery(v); if (v.trim().length >= 1) setSearchDropdownOpen(true); }}
          onSearchSubmit={handleSearch}
          currencySwitcher={currencySwitcher}
          themeButton={themeButton}
          accountButton={accountButton}
          compareLink={compareLink}
          wishlistLink={wishlistLink}
          cartButton={cartButtonNode}
        />
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 flex md:hidden bg-black/40 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="h-full min-h-screen w-1/2 min-w-[16rem] max-w-full bg-white flex flex-col shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <p className="text-lg font-semibold text-gray-900">Navigation</p>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="w-10 h-10 rounded-full border border-gray-200 text-gray-600 hover:text-gray-900 hover:border-gray-300 transition-colors"
                aria-label={t('common.ariaLabels.closeMenu')}
              >
                <svg className="w-5 h-5 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-hidden min-h-0">
              <nav className="flex h-full flex-col border-y border-gray-200 text-sm font-semibold uppercase tracking-wide text-gray-800 bg-white">
                <div className="flex-1 overflow-y-auto divide-y divide-gray-200">
                  {HEADER_NAV_LINKS.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
                    >
                      {t(link.translationKey)}
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  ))}

                  <Link
                    href="/wishlist"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
                  >
                    <span className="flex items-center gap-2 normal-case font-medium text-gray-700">
                      <WishlistIcon />
                      {t('common.navigation.wishlist')}
                    </span>
                    {wishlistCount > 0 && (
                      <span className="rounded-full bg-gray-900 px-2 py-0.5 text-xs font-semibold text-white">
                        {wishlistCount > 99 ? '99+' : wishlistCount}
                      </span>
                    )}
                  </Link>

                  <Link
                    href="/compare"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
                  >
                    <span className="flex items-center gap-2 normal-case font-medium text-gray-700">
                      <CompareIcon size={18} />
                      Compare
                    </span>
                    {compareCount > 0 && (
                      <span className="rounded-full bg-gray-900 px-2 py-0.5 text-xs font-semibold text-white">
                        {compareCount > 99 ? '99+' : compareCount}
                      </span>
                    )}
                  </Link>

                  <Link
                    href="/cart"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
                  >
                    <span className="flex items-center gap-2 normal-case font-medium text-gray-700">
                      <CartIcon size={19} />
                      Cart
                    </span>
                    {cartCount > 0 && (
                      <span className="rounded-full bg-gray-900 px-2 py-0.5 text-xs font-semibold text-white">
                        {cartCount > 99 ? '99+' : cartCount}
                      </span>
                    )}
                  </Link>

                  {isLoggedIn ? (
                    <>
                      <Link
                        href="/profile"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 normal-case text-gray-800"
                      >
                        <span className="flex items-center gap-2">
                          <ProfileIconFilled />
                          Profile
                        </span>
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                      {isAdmin && (
                        <Link
                          href="/admin"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center justify-between px-4 py-3 hover:bg-blue-50 normal-case text-blue-700"
                        >
                          <span>Admin Panel</span>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      )}
                      <button
                        onClick={() => {
                          setMobileMenuOpen(false);
                          logout();
                        }}
                        className="flex w-full items-center justify-between px-4 py-3 text-left text-red-600 hover:bg-red-50 normal-case font-semibold"
                      >
                        Logout
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/login"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 normal-case text-gray-800"
                      >
                        <span>Login</span>
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                      <Link
                        href="/register"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center justify-between px-4 py-3 hover:bg-gray-900 hover:text-white normal-case text-gray-900 font-semibold"
                      >
                        <span>Create account</span>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </>
                  )}
                </div>

                <div className="border-t border-gray-200 px-4 py-4 text-xs font-medium tracking-wide text-gray-500 normal-case">
                  © {currentYear} White-Shop
                </div>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Search Modal */}
      {showSearchModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-start justify-center pt-20 px-4">
          <div 
            ref={searchModalRef}
            className="w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-gray-200/80 p-4 animate-in fade-in slide-in-from-top-2 duration-200 relative"
          >
            <form onSubmit={handleSearch} className="flex items-center gap-2">
              {/* Search Input */}
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (e.target.value.trim().length >= 1) setSearchDropdownOpen(true);
                }}
                onFocus={() => { if (searchQuery.trim().length >= 1) setSearchDropdownOpen(true); }}
                onKeyDown={searchHandleKeyDown}
                placeholder={t('common.placeholders.search')}
                className="flex-1 h-11 px-4 border-2 border-gray-200 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent text-sm placeholder:text-gray-400"
                aria-controls="search-results"
                aria-expanded={searchDropdownOpen && searchResults.length > 0}
                aria-autocomplete="list"
              />
              
              {/* Search Button */}
              <button
                type="submit"
                className="h-11 px-6 bg-gray-900 text-white rounded-r-lg hover:bg-gray-800 transition-colors flex items-center justify-center"
              >
                <SearchIcon />
              </button>
            </form>

            <SearchDropdown
              results={searchResults}
              loading={searchLoading}
              error={searchError}
              isOpen={searchDropdownOpen}
              selectedIndex={searchSelectedIndex}
              query={searchQuery}
              onResultClick={(result) => {
                router.push(`/products/${result.slug}`);
                setShowSearchModal(false);
                clearSearch();
              }}
              onClose={() => setSearchDropdownOpen(false)}
              onSeeAllClick={() => setShowSearchModal(false)}
            />
          </div>
        </div>
      )}
    </header>
  );
}

