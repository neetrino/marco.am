'use client';

import { Montserrat } from 'next/font/google';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { pushShopProductsListingUrl } from '../lib/push-shop-products-listing-url';
import { useState, useEffect, useRef, Suspense } from 'react';
import { useTranslation } from '../lib/i18n-client';
import { useForcedShopGridColumns } from './useForcedShopGridColumns';

/** Figma MARCO 218:2275 — wordmark «ԽԱՆՈՒԹ» (Montserrat Bold) */
const productsShopTitleFont = Montserrat({
  weight: '700',
  subsets: ['latin', 'latin-ext', 'cyrillic'],
});

/** Figma 218:2275 — wordmark, slightly smaller than 54px spec */
const PRODUCTS_PAGE_TITLE_CLASS = `${productsShopTitleFont.className} text-[#181111] dark:text-white uppercase font-bold leading-none tracking-[-0.6px] whitespace-nowrap text-[clamp(1.25rem,3.2vw,1.75rem)] sm:text-3xl lg:text-[36px]`;

/** Figma 218:2274 — yellow bar under title: h-1 w-20, marco yellow, mt-2 */
const PRODUCTS_PAGE_TITLE_UNDERLINE_CLASS =
  'mt-2 h-1 w-20 shrink-0 rounded-sm bg-marco-yellow';

/** Figma 218:2270 — breadcrumb above wordmark: #afafaf home link, #333 « / » + current */
const PRODUCTS_PAGE_BREADCRUMB_CLASS = `${productsShopTitleFont.className} text-xs font-bold leading-snug`;

type ViewMode = 'list' | 'grid-2' | 'grid-3';
type SortOption =
  | 'default'
  | 'price-asc'
  | 'price-desc'
  | 'name-asc'
  | 'name-desc'
  | 'bestsellers'
  | 'curated';
type SortParamOption = Exclude<SortOption, 'bestsellers' | 'curated'>;
type FilterParamOption = Extract<SortOption, 'bestsellers' | 'curated'>;
type SortMenuOption = Exclude<SortOption, 'default'>;

/** Figma MARCO 218:2319 — sliders / sort control, white on dark trigger */
function ProductsSortSlidersIcon({ className }: { readonly className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="14"
      viewBox="0 0 16 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <line x1="1" y1="2" x2="15" y2="2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="4" cy="2" r="2" fill="currentColor" />
      <line x1="1" y1="6" x2="15" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="12" cy="6" r="2" fill="currentColor" />
      <line x1="1" y1="10" x2="15" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="8" cy="10" r="2" fill="currentColor" />
    </svg>
  );
}

/** Figma MARCO 218:2294 — list / medium grid (3×3 dots) / dense grid (4×4 dots) */
function ProductsViewListIcon({ className }: { readonly className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <line x1="3" y1="5" x2="17" y2="5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="3" y1="10" x2="17" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="3" y1="15" x2="17" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function ProductsViewGridMediumDotsIcon({ className }: { readonly className?: string }) {
  const c = [5, 10, 15];
  return (
    <svg className={className} viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      {c.flatMap((y) => c.map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.75" fill="currentColor" />))}
    </svg>
  );
}

function ProductsViewGridDenseDotsIcon({ className }: { readonly className?: string }) {
  const c = [4, 8, 12, 16];
  return (
    <svg className={className} viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      {c.flatMap((y) => c.map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.25" fill="currentColor" />))}
    </svg>
  );
}

/** Sort trigger: #101010 — same symmetric pill radius as view toggles (`rounded-full`) */
const SORT_TRIGGER_CLASS =
  'flex h-10 min-w-[160px] items-center justify-between gap-2 rounded-full bg-marco-black px-4 text-sm font-normal leading-normal text-white transition-[filter] hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/25 active:brightness-90';

/** Dropdown aligns to trigger width (`w-full` inside `relative w-max` wrapper) */
const SORT_DROPDOWN_PANEL_CLASS =
  'absolute top-full right-0 z-50 mt-2 w-full min-w-0 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg';

/** Each option row matches trigger height (40px) and horizontal padding */
const SORT_DROPDOWN_ITEM_CLASS =
  'flex h-10 min-h-10 w-full shrink-0 items-center px-4 text-left text-sm font-normal leading-normal transition-colors';

/**
 * View layout toggles — ref. screenshot: symmetric white pill, thin #dedede border, black icons.
 */
const VIEW_TOGGLE_GROUP_CLASS =
  'flex h-10 min-h-10 shrink-0 items-stretch overflow-hidden rounded-full border border-solid border-[#dedede] bg-white';

const VIEW_TOGGLE_SEGMENT_BASE =
  'inline-flex min-w-[44px] flex-1 items-center justify-center px-3 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-marco-black border-r border-[#dedede] last:border-r-0';

function viewToggleSegmentClass(isActive: boolean): string {
  return isActive
    ? `${VIEW_TOGGLE_SEGMENT_BASE} bg-[#ffffff] text-[#050505] dark:bg-[#ffffff] dark:text-[#050505]`
    : `${VIEW_TOGGLE_SEGMENT_BASE} text-marco-black dark:text-white hover:bg-[#fafafa] dark:hover:bg-white/10`;
}

function ProductsShopTitleBlock({ total }: { readonly total: number }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-start">
      <nav
        aria-label={t('products.header.breadcrumbNavLabel')}
        className="mb-[12px] w-full min-w-0 md:mb-[16px]"
      >
        <p className={PRODUCTS_PAGE_BREADCRUMB_CLASS}>
          <Link
            href="/"
            className="text-[#afafaf] dark:text-white/78 transition-colors hover:text-[#333] dark:hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marco-black/20 focus-visible:ring-offset-2"
          >
            {t('products.header.breadcrumbHome')}
          </Link>
          <span className="text-[#333] dark:text-white/44">
            {' '}
            / {t('products.header.breadcrumbShop')}
          </span>
        </p>
      </nav>
      <div className="flex flex-col items-start gap-3">
        <h1 className={PRODUCTS_PAGE_TITLE_CLASS}>
          <span aria-hidden className="block">
            {t('products.header.shopWordmark')}
          </span>
          <span className="sr-only">
            {t('products.header.allProducts').replace('{total}', String(total))}
          </span>
        </h1>
        <span className={PRODUCTS_PAGE_TITLE_UNDERLINE_CLASS} aria-hidden />
      </div>
    </div>
  );
}

interface ProductsHeaderProps {
  /**
   * Ընդհանուր ապրանքների քանակը՝ բոլոր էջերում (from API meta.total)
   */
  total: number;
}

function ProductsHeaderContent({ total }: ProductsHeaderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const forcedShopGridCols = useForcedShopGridColumns();
  const [viewMode, setViewMode] = useState<ViewMode>('grid-2');
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);
  const mobileSortDropdownRef = useRef<HTMLDivElement>(null);

  const sortOptions: { value: SortMenuOption; label: string; mode: 'sort' | 'filter' }[] = [
    { value: 'bestsellers', label: t('products.header.sort.bestsellers'), mode: 'filter' },
    { value: 'curated', label: t('products.header.sort.curatedList'), mode: 'filter' },
    { value: 'price-asc', label: t('products.header.sort.priceAsc'), mode: 'sort' },
    { value: 'price-desc', label: t('products.header.sort.priceDesc'), mode: 'sort' },
    { value: 'name-asc', label: t('products.header.sort.nameAsc'), mode: 'sort' },
    { value: 'name-desc', label: t('products.header.sort.nameDesc'), mode: 'sort' },
  ];

  // Load view mode from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('products-view-mode');
    if (stored && ['list', 'grid-2', 'grid-3'].includes(stored)) {
      setViewMode(stored as ViewMode);
    } else {
      // Default to grid-2 if nothing stored
      setViewMode('grid-2');
      localStorage.setItem('products-view-mode', 'grid-2');
    }
  }, []);

  // Load sort from URL params
  useEffect(() => {
    const filterParam = searchParams.get('filter');
    if (filterParam === 'bestseller') {
      setSortBy('bestsellers');
      return;
    }
    if (filterParam === 'featured') {
      setSortBy('curated');
      return;
    }

    const sortParam = searchParams.get('sort') as SortOption | null;
    if (sortParam && sortOptions.some((opt) => opt.value === sortParam)) {
      setSortBy(sortParam);
      return;
    }
    setSortBy('default');
  }, [searchParams]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isClickInsideDesktop = sortDropdownRef.current?.contains(target);
      const isClickInsideMobile = mobileSortDropdownRef.current?.contains(target);
      
      if (!isClickInsideDesktop && !isClickInsideMobile) {
        setShowSortDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem('products-view-mode', mode);
    // Dispatch event to update grid layout
    window.dispatchEvent(new CustomEvent('view-mode-changed', { detail: mode }));
  };

  const handleSortChange = (option: SortMenuOption) => {
    setSortBy(option);
    setShowSortDropdown(false);
    
    // Update URL with sort parameter
    const params = new URLSearchParams(searchParams.toString());
    const selected = sortOptions.find((entry) => entry.value === option);

    if (!selected) {
      params.delete('sort');
      params.delete('filter');
    } else if (selected.mode === 'sort') {
      params.set('sort', selected.value as SortParamOption);
      params.delete('filter');
    } else {
      params.delete('sort');
      const filterValue: Record<FilterParamOption, 'bestseller' | 'featured'> = {
        bestsellers: 'bestseller',
        curated: 'featured',
      };
      params.set('filter', filterValue[selected.value as FilterParamOption]);
    }
    // Reset to page 1 when sorting changes
    params.delete('page');
    
    pushShopProductsListingUrl(router, `/products?${params.toString()}`);
  };

  return (
    <div className="marco-header-container pb-2 pt-[58px] sm:pb-4">
      {/* Desktop: All elements in one horizontal line */}
      <div className="hidden sm:flex sm:items-center sm:justify-between sm:gap-4">
        {/* Left side: SHOP wordmark only (Figma) */}
        <div className="flex items-center">
          <ProductsShopTitleBlock total={total} />
        </div>

        {/* Right side: View toggles + Sort */}
        <div className="flex items-center gap-4">
          {/* View mode — hidden on touch iPad / tablet when grid is fixed (see useForcedShopGridColumns) */}
          {forcedShopGridCols === null && (
            <div className={VIEW_TOGGLE_GROUP_CLASS}>
              <button
                type="button"
                onClick={() => handleViewModeChange('list')}
                className={viewToggleSegmentClass(viewMode === 'list')}
                aria-label={t('products.header.viewModes.list')}
                aria-pressed={viewMode === 'list'}
              >
                <ProductsViewListIcon className="h-[22px] w-[22px] shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => handleViewModeChange('grid-2')}
                className={viewToggleSegmentClass(viewMode === 'grid-2')}
                aria-label={t('products.header.viewModes.grid2')}
                aria-pressed={viewMode === 'grid-2'}
              >
                <ProductsViewGridMediumDotsIcon className="h-[22px] w-[22px] shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => handleViewModeChange('grid-3')}
                className={viewToggleSegmentClass(viewMode === 'grid-3')}
                aria-label={t('products.header.viewModes.grid3')}
                aria-pressed={viewMode === 'grid-3'}
              >
                <ProductsViewGridDenseDotsIcon className="h-[22px] w-[22px] shrink-0" />
              </button>
            </div>
          )}

          {/* Sort dropdown — panel width matches trigger; rows h-10 like trigger */}
          <div className="relative w-max min-w-0" ref={sortDropdownRef}>
            <button
              type="button"
              onClick={() => setShowSortDropdown(!showSortDropdown)}
              className={SORT_TRIGGER_CLASS}
              data-theme-static="true"
              aria-expanded={showSortDropdown}
            >
              <span className="flex min-w-0 flex-1 items-center gap-2">
                <ProductsSortSlidersIcon className="shrink-0 text-white" />
                <span className="truncate">
                  {sortOptions.find((opt) => opt.value === sortBy)?.label || t('products.header.sort.default')}
                </span>
              </span>
              <svg
                width="14"
                height="14"
                viewBox="0 0 12 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={`shrink-0 text-white transition-transform ${showSortDropdown ? 'rotate-180' : ''}`}
                aria-hidden
              >
                <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {showSortDropdown && (
              <div data-theme-static="true" className={SORT_DROPDOWN_PANEL_CLASS}>
                {sortOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSortChange(option.value)}
                    className={`${SORT_DROPDOWN_ITEM_CLASS} ${
                      sortBy === option.value
                        ? 'bg-gray-100 font-semibold text-gray-900'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile: Stacked layout */}
      <div className="sm:hidden flex flex-col gap-4">
        {/* Top: All Products Title */}
        <div className="flex items-center">
          <ProductsShopTitleBlock total={total} />
        </div>

        {/* Bottom: Filters + sort — same black sort pill as desktop (no view-mode grid toggles on mobile) */}
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event('mobile:filters-toggle'))}
            className="inline-flex shrink-0 items-center gap-2 rounded-[30px] border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-900 transition-colors hover:bg-gray-50 dark:border-white/10 dark:bg-black dark:text-white dark:hover:bg-white/5"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden
            >
              <line x1="3" y1="5" x2="17" y2="5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <line x1="3" y1="10" x2="17" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <line x1="3" y1="15" x2="17" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span>{t('products.header.filters')}</span>
          </button>

          <div className="flex min-w-0 flex-1 items-center justify-end" ref={mobileSortDropdownRef}>
            <div className="relative w-max max-w-full min-w-0">
              <button
                type="button"
                onClick={() => setShowSortDropdown(!showSortDropdown)}
                className={`${SORT_TRIGGER_CLASS} max-w-full`}
                data-theme-static="true"
                aria-expanded={showSortDropdown}
              >
                <span className="flex min-w-0 flex-1 items-center gap-2">
                  <ProductsSortSlidersIcon className="shrink-0 text-white" />
                  <span className="truncate">
                    {sortOptions.find((opt) => opt.value === sortBy)?.label || t('products.header.sort.default')}
                  </span>
                </span>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 12 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className={`shrink-0 text-white transition-transform ${showSortDropdown ? 'rotate-180' : ''}`}
                  aria-hidden
                >
                  <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {showSortDropdown && (
                <div data-theme-static="true" className={SORT_DROPDOWN_PANEL_CLASS}>
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleSortChange(option.value)}
                      className={`${SORT_DROPDOWN_ITEM_CLASS} ${
                        sortBy === option.value
                          ? 'bg-gray-100 font-semibold text-gray-900'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProductsHeader(props: ProductsHeaderProps) {
  return (
    <Suspense fallback={
      <div className="marco-header-container pb-2 pt-[58px] sm:pb-4">
        <div className="flex justify-end items-center">
          <div
            className="h-10 min-w-[160px] animate-pulse rounded-full bg-marco-black/20"
            aria-hidden
          />
        </div>
      </div>
    }>
      <ProductsHeaderContent {...props} />
    </Suspense>
  );
}

