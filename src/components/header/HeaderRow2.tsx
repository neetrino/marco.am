'use client';

import type { LanguageCode } from '../../lib/language';
import { Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { SearchDropdown } from '../SearchDropdown';
import { CategoriesDropdownMega } from './CategoriesDropdownMega';
import {
  HEADER_CONTAINER_CLASS,
  HEADER_SEARCH_BAR_HEIGHT_CLASS,
  HEADER_SEARCH_BAR_INNER_CLASS,
  getHeaderCategoryButtonClass,
  getHeaderFigmaRow2LeftInnerGapClass,
  getHeaderFigmaRow2MainGapClass,
  getHeaderSearchFormRadiusClass,
  getHeaderSearchIconTextGapClass,
  getHeaderSearchInputInnerEndPadClass,
  getHeaderSearchInputPaddingLeftClass,
  getHeaderSearchSubmitClass,
  getHeaderSearchSubmitWidthClass,
} from './header.constants';
import { HeaderChevronDownIcon, HeaderSearchGlyph } from './HeaderInlineIcons';
import { HeaderRow2RightToolbar } from './HeaderRow2RightToolbar';
import type { useHeaderData } from './useHeaderData';
import type { useHeaderLayoutMetrics } from './useHeaderLayoutMetrics';

type HeaderRow2Props = {
  data: ReturnType<typeof useHeaderData>;
  layout: ReturnType<typeof useHeaderLayoutMetrics>;
  compactPrimaryNav: boolean;
  initialLanguage?: LanguageCode;
};

export function HeaderRow2({ data, layout, compactPrimaryNav, initialLanguage }: HeaderRow2Props) {
  const { headerMobileLike, row2DesktopLike, row2TabletLike } = layout;
  const useMobileRow2 = headerMobileLike && !row2DesktopLike;
  const {
    t,
    router,
    showProductsMenu,
    setShowProductsMenu,
    categories,
    loadingCategories,
    productsMenuRef,
    headerSearchInputRef,
    inlineSearchRef,
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
    handleSearch,
    getRootCategories,
  } = data;

  const categoriesTriggerRef = useRef<HTMLButtonElement>(null);
  /** Align categories dropdown right edge with the header *inner* content (same as search row), not the container border box. */
  const headerRowContainerRef = useRef<HTMLDivElement>(null);
  const [categoriesDropdownLayout, setCategoriesDropdownLayout] = useState<{
    bridge: CSSProperties;
    panel: CSSProperties;
  } | null>(null);

  useLayoutEffect(() => {
    if (!showProductsMenu) {
      setCategoriesDropdownLayout(null);
      return;
    }

    /** User-requested upward shift for categories dropdown. */
    const seamOverlapPx = 47;

    const updateLayout = () => {
      const trigger = categoriesTriggerRef.current;
      const container = headerRowContainerRef.current;
      if (!trigger) {
        return;
      }
      const r = trigger.getBoundingClientRect();
      const cr = container?.getBoundingClientRect();
      const paddingRight = container
        ? parseFloat(getComputedStyle(container).paddingRight) || 0
        : 0;
      const rightEdge = cr ? cr.right - paddingRight : window.innerWidth - 16;
      const panelWidth = Math.max(280, Math.min(rightEdge, window.innerWidth - 8) - r.left);
      const panelTop = r.bottom - seamOverlapPx;
      const bridgeHeight = 0;
      const panelHeight = Math.max(240, Math.floor(window.innerHeight - panelTop));
      setCategoriesDropdownLayout({
        bridge: {
          position: 'fixed',
          top: r.bottom,
          left: r.left,
          width: r.width,
          height: bridgeHeight,
          zIndex: 69,
        },
        panel: {
          position: 'fixed',
          top: panelTop,
          left: r.left,
          width: panelWidth,
          height: panelHeight,
          maxHeight: panelHeight,
          zIndex: 70,
        },
      });
    };

    updateLayout();
    window.addEventListener('scroll', updateLayout, true);
    window.addEventListener('resize', updateLayout);
    return () => {
      window.removeEventListener('scroll', updateLayout, true);
      window.removeEventListener('resize', updateLayout);
    };
  }, [showProductsMenu]);

  useEffect(() => {
    if (!showProductsMenu || typeof document === 'undefined') {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [showProductsMenu]);

  return (
    <div
      className={`w-full border-b border-marco-border bg-white max-md:border-b-0 ${useMobileRow2 ? 'border-b-0' : ''}`}
    >
      <div ref={headerRowContainerRef} className={HEADER_CONTAINER_CLASS}>
        <div
          className={
            useMobileRow2
              ? 'flex w-full min-w-0 flex-col flex-wrap gap-y-0 py-2'
              : `flex w-full min-w-0 flex-col flex-wrap gap-y-1.5 max-md:gap-y-0 py-2 md:flex-row md:flex-nowrap md:items-center md:gap-y-0 ${getHeaderFigmaRow2MainGapClass(row2TabletLike)}`
          }
        >
          <div
            className={
              useMobileRow2
                ? 'flex min-w-0 w-full flex-1 flex-col min-h-0 gap-y-0'
                : `flex min-w-0 w-full flex-1 flex-col sm:flex-row sm:items-center ${getHeaderFigmaRow2LeftInnerGapClass(row2TabletLike)} max-md:min-h-0 max-md:gap-y-0`
            }
          >
            <div
              ref={productsMenuRef}
              className={
                useMobileRow2
                  ? 'relative hidden w-full shrink-0'
                  : 'relative hidden w-full shrink-0 sm:w-auto md:block'
              }
            >
              <button
                ref={categoriesTriggerRef}
                type="button"
                onClick={() => setShowProductsMenu((open) => !open)}
                className={`flex w-full items-center bg-marco-black text-white dark:[&_svg]:text-[#050505] ${getHeaderCategoryButtonClass(
                  row2TabletLike,
                  row2DesktopLike,
                )} [&_svg]:text-white`}
                aria-expanded={showProductsMenu}
                aria-haspopup="true"
              >
                <span
                  className={
                    row2TabletLike
                      ? `min-w-0 flex-1 text-center whitespace-nowrap md:truncate md:text-left md:text-[11px] ${
                          row2DesktopLike ? 'md:pl-[18px]' : 'md:pl-2'
                        }`
                      : 'min-w-0 flex-1 text-center whitespace-nowrap'
                  }
                >
                  {t('common.navigation.categories')}
                </span>
                <span className="inline-flex w-2.5 shrink-0 items-center justify-center md:w-4 min-[1367px]:w-5" aria-hidden>
                  <span
                    className={`inline-flex origin-center transform-gpu transition-transform duration-300 ease-out ${
                      showProductsMenu ? 'rotate-180' : 'rotate-0'
                    }`}
                  >
                    <HeaderChevronDownIcon />
                  </span>
                </span>
              </button>
              {showProductsMenu && categoriesDropdownLayout && (
                <>
                  <div
                    aria-hidden
                    className="pointer-events-auto"
                    style={categoriesDropdownLayout.bridge}
                  />
                  <div
                    data-marco-categories-dropdown
                    className="flex min-h-0 flex-col"
                    style={categoriesDropdownLayout.panel}
                  >
                    {loadingCategories ? (
                      <div className="h-full min-h-[200px] rounded-[13px] bg-marco-gray px-4 py-3 text-sm text-[#5d7285] shadow-2xl">
                        {t('common.messages.loading')}
                      </div>
                    ) : (
                      <Suspense fallback={null}>
                        <CategoriesDropdownMega
                          categories={getRootCategories(categories)}
                          onClose={() => setShowProductsMenu(false)}
                        />
                      </Suspense>
                    )}
                  </div>
                </>
              )}
            </div>

            <div ref={inlineSearchRef} className={`relative min-w-0 flex-1 ${HEADER_SEARCH_BAR_INNER_CLASS}`}>
              <form
                onSubmit={handleSearch}
                className={`flex w-full min-w-0 flex-row items-center overflow-hidden bg-marco-gray ${getHeaderSearchFormRadiusClass(row2TabletLike)} ${HEADER_SEARCH_BAR_HEIGHT_CLASS}`}
              >
                <div
                  className={`flex min-h-0 min-w-0 flex-1 items-center self-stretch ${getHeaderSearchIconTextGapClass(row2TabletLike)} ${getHeaderSearchInputPaddingLeftClass(row2TabletLike)} ${getHeaderSearchInputInnerEndPadClass(row2TabletLike)}`}
                >
                  <span className="shrink-0 text-[rgba(33,43,54,0.46)]" aria-hidden>
                    <HeaderSearchGlyph />
                  </span>
                  <input
                    ref={headerSearchInputRef}
                    type="search"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      if (e.target.value.trim().length >= 1) setSearchDropdownOpen(true);
                    }}
                    onFocus={() => {
                      if (searchQuery.trim().length >= 1) setSearchDropdownOpen(true);
                    }}
                    onKeyDown={searchHandleKeyDown}
                    placeholder={t('common.placeholders.search')}
                    className="min-h-0 min-w-0 flex-1 border-0 bg-transparent text-xs leading-normal text-marco-text placeholder:text-[rgba(33,43,54,0.46)] focus:outline-none focus:ring-0"
                    aria-controls="search-results"
                    aria-autocomplete="list"
                  />
                </div>
                <button
                  type="submit"
                  className={`${getHeaderSearchSubmitWidthClass(row2TabletLike)} ${getHeaderSearchSubmitClass(row2TabletLike)}`}
                >
                  {t('common.buttons.search')}
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
                  clearSearch();
                }}
                onClose={() => setSearchDropdownOpen(false)}
                onSeeAllClick={() => undefined}
                className={
                  useMobileRow2
                    ? 'fixed left-3 right-3 top-[4.5rem] z-[70] mt-0'
                    : 'max-md:fixed max-md:left-3 max-md:right-3 max-md:top-[4.5rem] max-md:mt-0 max-md:z-[70]'
                }
              />
            </div>
          </div>

          <HeaderRow2RightToolbar
            data={data}
            compactPrimaryNav={compactPrimaryNav}
            headerMobileLike={useMobileRow2}
            initialLanguage={initialLanguage}
          />
        </div>
      </div>
    </div>
  );
}
