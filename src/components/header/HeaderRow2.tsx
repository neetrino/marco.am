'use client';

import type { LanguageCode } from '../../lib/language';
import { Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { SearchDropdown } from '../SearchDropdown';
import { CategoriesDropdownMega } from './CategoriesDropdownMega';
import {
  HEADER_CATEGORIES_BRIDGE_Z_INDEX,
  HEADER_CATEGORIES_OVERLAY_Z_INDEX,
  HEADER_CATEGORIES_PANEL_Z_INDEX,
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
    overlayTopPx: number;
    bridge: CSSProperties;
    panel: CSSProperties;
  } | null>(null);
  const [mobileSearchPopupOpen, setMobileSearchPopupOpen] = useState(false);

  useLayoutEffect(() => {
    if (!showProductsMenu) {
      setCategoriesDropdownLayout(null);
      return;
    }

    /** Keep dropdown close to the trigger without visual overlap. */
    const gapPx = 2;
    const raiseDropdownByPx = 50;

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
      const headerEl = typeof document !== 'undefined' ? document.querySelector('header') : null;
      const headerBottomPx = headerEl ? Math.ceil(headerEl.getBoundingClientRect().bottom) : 0;
      const rawPanelTop = r.bottom + gapPx - raiseDropdownByPx;
      const panelTop = Math.max(rawPanelTop, headerBottomPx + gapPx);
      /** Cap height to viewport so inner columns scroll; uncapped height made the list taller than the screen without overflow. */
      const bottomMargin = 8;
      const viewportH =
        typeof window !== 'undefined' && window.visualViewport?.height
          ? window.visualViewport.height
          : window.innerHeight;
      const rawHeight = Math.floor(viewportH - panelTop - bottomMargin);
      const maxHeightByViewport = Math.max(0, viewportH - headerBottomPx - bottomMargin);
      const panelHeight = Math.max(240, Math.min(rawHeight, maxHeightByViewport, viewportH - 16));
      setCategoriesDropdownLayout({
        overlayTopPx: headerBottomPx,
        bridge: {
          position: 'fixed',
          top: r.bottom,
          left: r.left,
          width: r.width,
          height: gapPx,
          zIndex: HEADER_CATEGORIES_BRIDGE_Z_INDEX,
        },
        panel: {
          position: 'fixed',
          top: panelTop,
          left: r.left,
          width: panelWidth,
          height: panelHeight,
          maxHeight: panelHeight,
          zIndex: HEADER_CATEGORIES_PANEL_Z_INDEX,
        },
      });
    };

    updateLayout();
    window.addEventListener('scroll', updateLayout, true);
    window.addEventListener('resize', updateLayout);
    const vv = window.visualViewport;
    vv?.addEventListener('resize', updateLayout);
    vv?.addEventListener('scroll', updateLayout);
    return () => {
      window.removeEventListener('scroll', updateLayout, true);
      window.removeEventListener('resize', updateLayout);
      vv?.removeEventListener('resize', updateLayout);
      vv?.removeEventListener('scroll', updateLayout);
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

  useEffect(() => {
    if (!useMobileRow2 || !mobileSearchPopupOpen || typeof document === 'undefined') {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileSearchPopupOpen, useMobileRow2]);

  useEffect(() => {
    if (!useMobileRow2 || !mobileSearchPopupOpen) {
      return;
    }

    const focusId = window.setTimeout(() => {
      headerSearchInputRef.current?.focus();
    }, 20);

    return () => {
      window.clearTimeout(focusId);
    };
  }, [headerSearchInputRef, mobileSearchPopupOpen, useMobileRow2]);

  useEffect(() => {
    if (!useMobileRow2 || !mobileSearchPopupOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileSearchPopupOpen(false);
        setSearchDropdownOpen(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [mobileSearchPopupOpen, setSearchDropdownOpen, useMobileRow2]);

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
                className={`flex w-full items-center !bg-[#050505] !text-white dark:!bg-white dark:!text-[#050505] dark:ring-1 dark:ring-black/10 ${getHeaderCategoryButtonClass(
                  row2TabletLike,
                  row2DesktopLike,
                )} [&_svg]:!text-white dark:[&_svg]:!text-[#050505]`}
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
              {showProductsMenu &&
                categoriesDropdownLayout &&
                typeof document !== 'undefined' &&
                createPortal(
                  <>
                    <div
                      data-marco-categories-overlay
                      role="presentation"
                      className="fixed bottom-0 left-0 right-0 cursor-default bg-white dark:bg-zinc-950"
                      style={{
                        top: categoriesDropdownLayout.overlayTopPx,
                        zIndex: HEADER_CATEGORIES_OVERLAY_Z_INDEX,
                      }}
                      aria-hidden
                      onClick={() => setShowProductsMenu(false)}
                    />
                    <div
                      aria-hidden
                      data-marco-categories-bridge
                      className="pointer-events-auto"
                      style={categoriesDropdownLayout.bridge}
                    />
                    <div
                      data-marco-categories-dropdown
                      data-theme-static="true"
                      className="flex h-full max-h-full min-h-0 min-w-0 flex-col overflow-hidden"
                      style={categoriesDropdownLayout.panel}
                    >
                      {loadingCategories ? (
                        <div className="h-full min-h-[200px] rounded-[13px] bg-white px-4 py-3 text-sm text-[#5d7285] shadow-2xl">
                          {t('common.messages.loading')}
                        </div>
                      ) : (
                        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                          <Suspense fallback={null}>
                            <CategoriesDropdownMega
                              categories={getRootCategories(categories)}
                              onClose={() => setShowProductsMenu(false)}
                            />
                          </Suspense>
                        </div>
                      )}
                    </div>
                  </>,
                  document.body,
                )}
            </div>

            <div ref={inlineSearchRef} className={`relative z-[480] min-w-0 flex-1 ${HEADER_SEARCH_BAR_INNER_CLASS}`}>
              {useMobileRow2 ? (
                <button
                  type="button"
                  onClick={() => {
                    setMobileSearchPopupOpen(true);
                    if (searchQuery.trim().length >= 1) {
                      setSearchDropdownOpen(true);
                    }
                  }}
                  className={`flex w-full min-w-0 flex-row items-center overflow-hidden bg-marco-gray text-left ${getHeaderSearchFormRadiusClass(row2TabletLike)} ${HEADER_SEARCH_BAR_HEIGHT_CLASS}`}
                  aria-label={t('common.ariaLabels.search')}
                >
                  <span
                    className={`flex min-h-0 min-w-0 flex-1 items-center self-stretch ${getHeaderSearchIconTextGapClass(row2TabletLike)} ${getHeaderSearchInputPaddingLeftClass(row2TabletLike)} ${getHeaderSearchInputInnerEndPadClass(row2TabletLike)}`}
                  >
                    <span className="shrink-0 text-[rgba(33,43,54,0.46)]" aria-hidden>
                      <HeaderSearchGlyph />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-xs leading-normal text-[rgba(33,43,54,0.46)]">
                      {searchQuery.trim().length >= 1 ? searchQuery : t('common.placeholders.search')}
                    </span>
                  </span>
                  <span
                    className={`${getHeaderSearchSubmitWidthClass(row2TabletLike)} ${getHeaderSearchSubmitClass(row2TabletLike)}`}
                    aria-hidden
                  >
                    {t('common.buttons.search')}
                  </span>
                </button>
              ) : (
                <>
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
                      <div className="relative min-w-0 flex-1">
                        <input
                          ref={headerSearchInputRef}
                          type="search"
                          value={searchQuery}
                          onChange={(e) => {
                            const nextQuery = e.target.value;
                            if (nextQuery.trim().length === 0) {
                              clearSearch();
                              return;
                            }
                            setSearchQuery(nextQuery);
                            setSearchDropdownOpen(true);
                          }}
                          onFocus={(e) => {
                            if (e.currentTarget.value.trim().length >= 1) setSearchDropdownOpen(true);
                          }}
                          onKeyDown={searchHandleKeyDown}
                          placeholder={t('common.placeholders.search')}
                          className="min-h-0 min-w-0 flex-1 w-full border-0 bg-transparent pr-6 text-xs leading-normal text-marco-text dark:!text-[#050505] placeholder:text-[rgba(33,43,54,0.46)] focus:outline-none focus:ring-0"
                          aria-controls="search-results"
                          aria-autocomplete="list"
                        />
                        {searchQuery.trim().length > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              clearSearch();
                              headerSearchInputRef.current?.focus();
                            }}
                            className="absolute right-0 top-1/2 -translate-y-1/2 inline-flex h-4 w-4 items-center justify-center text-marco-yellow hover:brightness-95 cursor-pointer"
                            aria-label={t('common.ariaLabels.clearSearch')}
                          >
                            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
                            </svg>
                          </button>
                        )}
                      </div>
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
                    className="max-md:fixed max-md:left-3 max-md:right-3 max-md:top-[4.5rem] max-md:mt-0 max-md:z-[320]"
                  />
                </>
              )}
              {useMobileRow2 &&
                mobileSearchPopupOpen &&
                typeof document !== 'undefined' &&
                createPortal(
                  <div className="fixed inset-0 z-[700]">
                    <button
                      type="button"
                      aria-label={t('common.buttons.close')}
                      className="absolute inset-0 bg-black/45 backdrop-blur-[1px]"
                      onClick={() => {
                        setMobileSearchPopupOpen(false);
                        setSearchDropdownOpen(false);
                      }}
                    />
                    <div className="relative z-[1] mx-4 mt-[4.5rem]">
                      <form
                        onSubmit={(event) => {
                          handleSearch(event);
                          if (searchQuery.trim().length >= 1) {
                            setMobileSearchPopupOpen(false);
                            setSearchDropdownOpen(false);
                          }
                        }}
                        className="flex h-[56px] w-full min-w-0 flex-row items-center overflow-hidden rounded-[20px] bg-white px-4 shadow-2xl"
                      >
                        <div className="flex min-h-0 min-w-0 flex-1 items-center gap-2 self-stretch">
                          <span className="shrink-0 text-[rgba(33,43,54,0.46)]" aria-hidden>
                            <HeaderSearchGlyph />
                          </span>
                          <div className="relative min-w-0 flex-1">
                            <input
                              ref={headerSearchInputRef}
                              type="search"
                              value={searchQuery}
                              onChange={(e) => {
                                const nextQuery = e.target.value;
                                if (nextQuery.trim().length === 0) {
                                  clearSearch();
                                  return;
                                }
                                setSearchQuery(nextQuery);
                                setSearchDropdownOpen(true);
                              }}
                              onFocus={(e) => {
                                if (e.currentTarget.value.trim().length >= 1) setSearchDropdownOpen(true);
                              }}
                              onKeyDown={searchHandleKeyDown}
                              placeholder={t('common.placeholders.search')}
                              className="min-h-0 min-w-0 flex-1 w-full border-0 bg-transparent pr-2 text-sm leading-normal text-[#8893a1] placeholder:text-[#a0a8b4] focus:outline-none focus:ring-0"
                              aria-controls="search-results"
                              aria-autocomplete="list"
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setMobileSearchPopupOpen(false);
                            setSearchDropdownOpen(false);
                          }}
                          className="inline-flex h-7 w-7 shrink-0 items-center justify-center text-[#8f99a8] hover:text-[#5d7285]"
                          aria-label={t('common.buttons.close')}
                        >
                          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
                          </svg>
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
                          setMobileSearchPopupOpen(false);
                          setSearchDropdownOpen(false);
                        }}
                        onClose={() => setSearchDropdownOpen(false)}
                        onSeeAllClick={() => undefined}
                        className="!relative !left-auto !right-auto !top-auto mt-2 !z-[1] !rounded-[16px]"
                      />
                    </div>
                  </div>,
                  document.body,
                )}
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
