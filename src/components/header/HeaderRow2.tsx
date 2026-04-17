'use client';

import type { LanguageCode } from '../../lib/language';
import { SearchDropdown } from '../SearchDropdown';
import { CategoryMenuItem } from './CategoryMenuItem';
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
  const { headerMobileLike, row2TabletLike } = layout;
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

  return (
    <div
      className={`w-full border-b border-marco-border bg-white max-md:border-b-0 ${headerMobileLike ? 'border-b-0' : ''}`}
    >
      <div className={HEADER_CONTAINER_CLASS}>
        <div
          className={
            headerMobileLike
              ? 'flex w-full min-w-0 flex-col flex-wrap gap-y-0 py-2'
              : `flex w-full min-w-0 flex-col flex-wrap gap-y-1.5 max-md:gap-y-0 py-2 md:flex-row md:flex-nowrap md:items-center md:gap-y-0 ${getHeaderFigmaRow2MainGapClass(row2TabletLike)}`
          }
        >
          <div
            className={
              headerMobileLike
                ? 'flex min-w-0 w-full flex-1 flex-col min-h-0 gap-y-0'
                : `flex min-w-0 w-full flex-1 flex-col sm:flex-row sm:items-center ${getHeaderFigmaRow2LeftInnerGapClass(row2TabletLike)} max-md:min-h-0 max-md:gap-y-0`
            }
          >
            <div
              ref={productsMenuRef}
              className={
                headerMobileLike
                  ? 'relative hidden w-full shrink-0'
                  : 'relative hidden w-full shrink-0 sm:w-auto md:block'
              }
            >
              <button
                type="button"
                onClick={() => setShowProductsMenu((open) => !open)}
                className={`flex w-full items-center bg-marco-black text-white ${getHeaderCategoryButtonClass(row2TabletLike)} [&_svg]:text-white`}
                aria-expanded={showProductsMenu}
                aria-haspopup="true"
              >
                <span
                  className={
                    row2TabletLike
                      ? 'min-w-0 flex-1 text-center whitespace-nowrap md:truncate md:pl-2 md:text-left md:text-[11px]'
                      : 'min-w-0 flex-1 text-center whitespace-nowrap'
                  }
                >
                  {t('common.navigation.categories')}
                </span>
                <HeaderChevronDownIcon />
              </button>
              {showProductsMenu && (
                <>
                  <div className="absolute left-0 top-full z-[55] h-2 w-full" aria-hidden />
                  <div className="absolute left-0 top-full z-[55] pt-2 md:left-0">
                    <div className="w-64 overflow-visible rounded-xl border border-gray-200/80 bg-white shadow-2xl">
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
                  headerMobileLike
                    ? 'fixed left-3 right-3 top-[4.5rem] z-[70] mt-0'
                    : 'max-md:fixed max-md:left-3 max-md:right-3 max-md:top-[4.5rem] max-md:mt-0 max-md:z-[70]'
                }
              />
            </div>
          </div>

          <HeaderRow2RightToolbar
            data={data}
            compactPrimaryNav={compactPrimaryNav}
            headerMobileLike={headerMobileLike}
            initialLanguage={initialLanguage}
          />
        </div>
      </div>
    </div>
  );
}
