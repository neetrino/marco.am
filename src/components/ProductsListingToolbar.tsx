'use client';

import { useRouter } from 'next/navigation';
import { useShopProductsListingSearchParams } from '@/lib/use-shop-products-listing-search-params';
import { pushShopProductsListingUrl } from '@/lib/push-shop-products-listing-url';
import { useState, useEffect, useRef, Suspense } from 'react';
import { Banknote } from 'lucide-react';
import { useTranslation } from '@/lib/i18n-client';
import { useForcedShopGridColumns } from './useForcedShopGridColumns';
import { MOBILE_FILTERS_EVENT } from '@/lib/events';

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
type PricePresenceOption = 'with' | 'without';

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

const SORT_TRIGGER_CLASS =
  'flex h-10 w-auto shrink-0 items-center gap-1.5 rounded-full border border-solid border-[#dedede] bg-white px-3 text-sm font-normal leading-normal text-marco-black transition-colors hover:bg-marco-gray/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marco-black/20 active:bg-marco-gray/50';

const SORT_DROPDOWN_PANEL_CLASS =
  'absolute top-full right-0 z-[100] mt-2 w-max min-w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg';

const SORT_DROPDOWN_ITEM_CLASS =
  'flex h-10 min-h-10 w-full shrink-0 items-center px-4 text-left text-sm font-normal leading-normal transition-colors';

const VIEW_TOGGLE_GROUP_CLASS =
  'flex h-10 min-h-10 shrink-0 items-stretch overflow-hidden rounded-full border border-solid border-[#dedede] bg-white';

const VIEW_TOGGLE_SEGMENT_BASE =
  'inline-flex min-w-[44px] flex-1 items-center justify-center px-3 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-marco-black border-r border-[#dedede] last:border-r-0';

const PRICE_PRESENCE_GROUP_CLASS =
  'flex h-10 min-h-10 shrink-0 items-stretch overflow-hidden rounded-full border border-solid border-marco-black/20 bg-white';

const PRICE_PRESENCE_SEGMENT_BASE =
  'inline-flex min-w-[112px] flex-1 items-center justify-center gap-1.5 whitespace-nowrap px-4 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-marco-black border-r border-marco-black/15 last:border-r-0';

function viewToggleSegmentClass(isActive: boolean): string {
  return isActive
    ? `${VIEW_TOGGLE_SEGMENT_BASE} bg-marco-yellow text-marco-black`
    : `${VIEW_TOGGLE_SEGMENT_BASE} bg-white text-marco-black/70 hover:bg-marco-gray/50`;
}

const PRICE_PRESENCE_SEGMENT_MOBILE_BASE =
  'inline-flex min-w-0 flex-1 items-center justify-center gap-1 whitespace-nowrap px-2 text-xs font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-marco-black border-r border-marco-black/15 last:border-r-0';

function pricePresenceSegmentClass(isActive: boolean, mobile = false): string {
  const base = mobile ? PRICE_PRESENCE_SEGMENT_MOBILE_BASE : PRICE_PRESENCE_SEGMENT_BASE;
  return isActive
    ? `${base} bg-marco-yellow text-marco-black`
    : `${base} bg-white text-marco-black/80 hover:bg-marco-gray/50`;
}

type ProductsPricePresenceSwitchProps = {
  readonly pricePresence: PricePresenceOption;
  readonly switchAria: string;
  readonly withPriceLabel: string;
  readonly withoutPriceLabel: string;
  readonly onChange: (next: PricePresenceOption) => void;
  readonly mobile?: boolean;
  readonly className?: string;
};

function ProductsPricePresenceSwitch({
  pricePresence,
  switchAria,
  withPriceLabel,
  withoutPriceLabel,
  onChange,
  mobile = false,
  className = '',
}: ProductsPricePresenceSwitchProps) {
  return (
    <div
      className={`${PRICE_PRESENCE_GROUP_CLASS} ${mobile ? 'w-full' : ''} ${className}`.trim()}
      role="group"
      aria-label={switchAria}
    >
      <button
        type="button"
        onClick={() => onChange('with')}
        className={pricePresenceSegmentClass(pricePresence === 'with', mobile)}
        aria-pressed={pricePresence === 'with'}
      >
        <Banknote
          className={mobile ? 'h-3.5 w-3.5 shrink-0' : 'h-4 w-4 shrink-0'}
          strokeWidth={2}
          aria-hidden
        />
        {withPriceLabel}
      </button>
      <button
        type="button"
        onClick={() => onChange('without')}
        className={pricePresenceSegmentClass(pricePresence === 'without', mobile)}
        aria-pressed={pricePresence === 'without'}
      >
        {withoutPriceLabel}
      </button>
    </div>
  );
}

function ProductsListingToolbarContent() {
  const router = useRouter();
  const searchParams = useShopProductsListingSearchParams();
  const { t } = useTranslation();
  const forcedShopGridCols = useForcedShopGridColumns();
  const [viewMode, setViewMode] = useState<ViewMode>('grid-2');
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [pricePresence, setPricePresence] = useState<PricePresenceOption>('with');
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

  useEffect(() => {
    const stored = localStorage.getItem('products-view-mode');
    if (stored && ['list', 'grid-2', 'grid-3'].includes(stored)) {
      setViewMode(stored as ViewMode);
    } else {
      setViewMode('grid-2');
      localStorage.setItem('products-view-mode', 'grid-2');
    }
  }, []);

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
    } else {
      setSortBy('default');
    }

    const rawPricePresence = searchParams.get('pricePresence');
    setPricePresence(rawPricePresence === 'without' ? 'without' : 'with');
  }, [searchParams]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isClickInsideDesktop = sortDropdownRef.current?.contains(target);
      const isClickInsideMobile = mobileSortDropdownRef.current?.contains(target);

      if (!isClickInsideDesktop && !isClickInsideMobile) {
        setShowSortDropdown(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem('products-view-mode', mode);
    window.dispatchEvent(new CustomEvent('view-mode-changed', { detail: mode }));
  };

  const handleSortChange = (option: SortMenuOption) => {
    setSortBy(option);
    setShowSortDropdown(false);

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
    params.delete('page');

    pushShopProductsListingUrl(router, `/products?${params.toString()}`);
  };

  const handlePricePresenceChange = (nextPricePresence: PricePresenceOption) => {
    if (nextPricePresence === pricePresence) {
      return;
    }
    setPricePresence(nextPricePresence);
    const params = new URLSearchParams(searchParams.toString());
    params.set('pricePresence', nextPricePresence);
    params.delete('page');
    pushShopProductsListingUrl(router, `/products?${params.toString()}`);
  };

  const pricePresenceLabels = {
    switchAria: t('products.header.pricePresence.switchAria'),
    withPrice: t('products.header.pricePresence.withPrice'),
    withoutPrice: t('products.header.pricePresence.withoutPrice'),
  };

  const sortButtonLabel =
    sortBy === 'default'
      ? t('products.header.sort.button')
      : (sortOptions.find((opt) => opt.value === sortBy)?.label ?? t('products.header.sort.button'));

  const toggleSortDropdown = () => {
    setShowSortDropdown((open) => !open);
  };

  const sortDropdown = (
    <>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          toggleSortDropdown();
        }}
        className={SORT_TRIGGER_CLASS}
        data-theme-static="true"
        aria-expanded={showSortDropdown}
        aria-haspopup="listbox"
      >
        <ProductsSortSlidersIcon className="shrink-0" />
        <span className="whitespace-nowrap">{sortButtonLabel}</span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 12 12"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`shrink-0 transition-transform ${showSortDropdown ? 'rotate-180' : ''}`}
          aria-hidden
        >
          <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {showSortDropdown ? (
        <div
          data-theme-static="true"
          className={SORT_DROPDOWN_PANEL_CLASS}
          role="listbox"
          aria-label={t('products.header.sortProducts')}
          onClick={(event) => event.stopPropagation()}
        >
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
      ) : null}
    </>
  );

  return (
    <>
      {/* Desktop: price toggle left, view + sort right — scoped to products column */}
      <div className="relative z-30 hidden min-[744px]:flex min-[744px]:items-center min-[744px]:justify-between min-[744px]:gap-4 min-[744px]:pb-4">
        <ProductsPricePresenceSwitch
          pricePresence={pricePresence}
          switchAria={pricePresenceLabels.switchAria}
          withPriceLabel={pricePresenceLabels.withPrice}
          withoutPriceLabel={pricePresenceLabels.withoutPrice}
          onChange={handlePricePresenceChange}
        />

        <div className="flex items-center gap-4">
          {forcedShopGridCols === null ? (
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
          ) : null}

          <div className="relative z-30 w-max min-w-0" ref={sortDropdownRef}>
            {sortDropdown}
          </div>
        </div>
      </div>

      {/* Mobile: filters + sort, then price toggle */}
      <div className="relative z-30 flex flex-col gap-4 pb-4 min-[744px]:hidden">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event(MOBILE_FILTERS_EVENT))}
            className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full border border-marco-black/12 bg-white px-4 text-sm font-semibold text-marco-black transition-[background-color,border-color] hover:border-marco-black/25 hover:bg-marco-gray/50 dark:border-white/12 dark:bg-zinc-900 dark:text-white dark:hover:border-white/25 dark:hover:bg-zinc-800"
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

          <div className="relative z-30 flex min-w-0 flex-1 items-center justify-end" ref={mobileSortDropdownRef}>
            <div className="relative w-max max-w-full min-w-0">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  toggleSortDropdown();
                }}
                className={`${SORT_TRIGGER_CLASS} max-w-full`}
                data-theme-static="true"
                aria-expanded={showSortDropdown}
                aria-haspopup="listbox"
              >
                <ProductsSortSlidersIcon className="shrink-0" />
                <span className="whitespace-nowrap">{sortButtonLabel}</span>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 12 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className={`shrink-0 transition-transform ${showSortDropdown ? 'rotate-180' : ''}`}
                  aria-hidden
                >
                  <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {showSortDropdown ? (
                <div
                  data-theme-static="true"
                  className={SORT_DROPDOWN_PANEL_CLASS}
                  role="listbox"
                  aria-label={t('products.header.sortProducts')}
                  onClick={(event) => event.stopPropagation()}
                >
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
              ) : null}
            </div>
          </div>
        </div>

        <ProductsPricePresenceSwitch
          pricePresence={pricePresence}
          switchAria={pricePresenceLabels.switchAria}
          withPriceLabel={pricePresenceLabels.withPrice}
          withoutPriceLabel={pricePresenceLabels.withoutPrice}
          onChange={handlePricePresenceChange}
          mobile
        />
      </div>
    </>
  );
}

/** Toolbar for the products listing column — price toggle left, view + sort right on desktop. */
export function ProductsListingToolbar() {
  return (
    <Suspense
      fallback={
        <div className="hidden min-[744px]:flex min-[744px]:justify-end min-[744px]:pb-4">
          <div className="h-10 w-20 animate-pulse rounded-full border border-[#dedede] bg-marco-gray/30" aria-hidden />
        </div>
      }
    >
      <ProductsListingToolbarContent />
    </Suspense>
  );
}
