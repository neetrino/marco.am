'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';

type TFunction = (key: string) => string;

interface HeaderActionBarProps {
  t: TFunction;
  searchPlaceholder: string;
  searchCtaLabel: string;
  categoryLabel: string;
  categoryDropdown: ReactNode;
  onSearchClick?: () => void;
  searchInputRef?: React.RefObject<HTMLInputElement | null>;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onSearchSubmit?: (e: React.FormEvent) => void;
  currencySwitcher: ReactNode;
  themeButton: ReactNode;
  accountButton: ReactNode;
  compareLink: ReactNode;
  wishlistLink: ReactNode;
  cartButton: ReactNode;
}

export function HeaderActionBar({
  t,
  searchPlaceholder,
  searchCtaLabel,
  categoryLabel,
  categoryDropdown,
  onSearchClick,
  searchInputRef,
  searchValue = '',
  onSearchChange,
  onSearchSubmit,
  currencySwitcher,
  themeButton,
  accountButton,
  compareLink,
  wishlistLink,
  cartButton,
}: HeaderActionBarProps) {
  return (
    <div className="bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          {/* Left: Category dropdown (dark pill) */}
          <div className="relative shrink-0">{categoryDropdown}</div>

          {/* Center: Search + Yellow CTA */}
          <div className="flex-1 flex items-center gap-2 min-w-0 max-w-2xl">
            <form
              onSubmit={onSearchSubmit ?? ((e) => e.preventDefault())}
              className="flex-1 flex items-center rounded-full bg-gray-100 border border-gray-200 overflow-hidden focus-within:ring-2 focus-within:ring-gray-300 focus-within:border-gray-300"
            >
              <span className="pl-4 text-gray-400 pointer-events-none" aria-hidden>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              </span>
              <input
                ref={searchInputRef}
                type="search"
                role="searchbox"
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(e) => onSearchChange?.(e.target.value)}
                onFocus={onSearchClick}
                onClick={onSearchClick}
                className="flex-1 min-w-0 py-2.5 pl-2 pr-4 bg-transparent border-0 text-sm text-gray-900 placeholder-gray-500 focus:ring-0 focus:outline-none"
                aria-label={t('common.ariaLabels.search')}
              />
            </form>
            <Link
              href="/products"
              className="shrink-0 h-11 px-5 rounded-full bg-gold text-gray-900 font-semibold text-sm flex items-center justify-center hover:bg-amber-500 transition-colors"
            >
              {searchCtaLabel}
            </Link>
          </div>

          {/* Right: Currency, theme, account, compare, wishlist, cart */}
          <div className="flex items-center gap-2 sm:gap-3">
            {currencySwitcher}
            {themeButton}
            {accountButton}
            {compareLink}
            {wishlistLink}
            {cartButton}
          </div>
        </div>
      </div>
    </div>
  );
}
