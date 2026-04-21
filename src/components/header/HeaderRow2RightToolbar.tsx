'use client';

import Link from 'next/link';
import { Sun } from 'lucide-react';
import type { LanguageCode } from '../../lib/language';
import { HeaderLocaleCurrencyPill } from './HeaderLocaleCurrencyPill';
import {
  HEADER_CART_BUTTON_CLASS,
  HEADER_FIGMA_ROW2_RIGHT_INNER_GAP_CLASS,
  HEADER_LOCALE_TO_THEME_MARGIN_CLASS,
  HEADER_TOOLBAR_ICON_CLUSTER_CLASS,
  HEADER_TOOLBAR_ICON_BUTTON_CLASS,
} from './header.constants';
import {
  HeaderBadgeIcon,
  HeaderProfileIconFilled,
  HeaderProfileIconOutline,
} from './HeaderInlineIcons';
import { CompareIcon } from '../icons/CompareIcon';
import { HeaderNavbarCartIcon } from '../icons/HeaderNavbarCartIcon';
import { HeaderNavbarWishlistIcon } from '../icons/HeaderNavbarWishlistIcon';
import type { useHeaderData } from './useHeaderData';

type Props = {
  data: ReturnType<typeof useHeaderData>;
  compactPrimaryNav: boolean;
  headerMobileLike: boolean;
  initialLanguage?: LanguageCode;
};

export function HeaderRow2RightToolbar({ data, compactPrimaryNav, headerMobileLike, initialLanguage }: Props) {
  const {
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
    selectedCurrency,
    userMenuRef,
    handleCurrencyChange,
    formatPrice,
  } = data;

  return (
    <div
      className={
        headerMobileLike
          ? 'hidden w-full shrink-0 flex-wrap items-center justify-end'
          : `hidden w-full shrink-0 flex-wrap items-center justify-end md:flex md:w-auto md:flex-nowrap ${HEADER_FIGMA_ROW2_RIGHT_INNER_GAP_CLASS}`
      }
    >
      {!compactPrimaryNav && (
        <HeaderLocaleCurrencyPill
          selectedCurrency={selectedCurrency}
          onCurrencyChange={handleCurrencyChange}
          initialLanguage={initialLanguage}
        />
      )}
      <button
        type="button"
        className={`flex shrink-0 items-center justify-center rounded-full bg-marco-black text-white transition-opacity hover:opacity-90 ${!compactPrimaryNav ? HEADER_LOCALE_TO_THEME_MARGIN_CLASS : ''} ${HEADER_TOOLBAR_ICON_BUTTON_CLASS}`}
        aria-label="Theme"
      >
        <Sun className="h-6 w-6 shrink-0" strokeWidth={1.65} aria-hidden />
      </button>
      <div className={HEADER_TOOLBAR_ICON_CLUSTER_CLASS}>
        <div className="relative shrink-0" ref={userMenuRef}>
          {isLoggedIn ? (
            <>
              <button
                type="button"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className={`flex items-center justify-center transition-all duration-200 group ${HEADER_TOOLBAR_ICON_BUTTON_CLASS}`}
              >
                <HeaderProfileIconFilled />
              </button>
              {showUserMenu && (
                <div className="absolute right-0 top-full z-[60] mt-2 w-52 overflow-hidden rounded-xl border border-gray-200/80 bg-white shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
                  <Link
                    href="/profile"
                    className="block border-b border-gray-100 px-5 py-3 text-sm font-medium text-gray-700 transition-all duration-150 hover:bg-gradient-to-r hover:from-gray-50 hover:to-white"
                    onClick={() => setShowUserMenu(false)}
                  >
                    {t('common.navigation.profile')}
                  </Link>
                  {isAdmin && (
                    <Link
                      href="/admin"
                      className="block border-b border-gray-100 px-5 py-3 text-sm font-medium text-blue-600 transition-all duration-150 hover:bg-gradient-to-r hover:from-blue-50 hover:to-white"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <div className="flex items-center">
                        <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {t('common.navigation.adminPanel')}
                      </div>
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserMenu(false);
                      logout();
                    }}
                    className="block w-full px-5 py-3 text-left text-sm font-medium text-red-600 transition-all duration-150 hover:bg-gradient-to-r hover:from-red-50 hover:to-white"
                  >
                    {t('common.navigation.logout')}
                  </button>
                </div>
              )}
            </>
          ) : (
            <Link
              href="/login"
              className={`flex items-center justify-center text-gray-700 transition-colors duration-150 group hover:text-gray-900 ${HEADER_TOOLBAR_ICON_BUTTON_CLASS}`}
            >
              <HeaderProfileIconOutline />
            </Link>
          )}
        </div>

        <Link
          href="/compare"
          className={`relative flex items-center justify-center text-gray-700 transition-colors duration-150 hover:text-gray-900 ${HEADER_TOOLBAR_ICON_BUTTON_CLASS}`}
        >
          <HeaderBadgeIcon
            icon={<CompareIcon size={18} className="h-[18px] w-[18px] shrink-0" />}
            badge={compareCount}
          />
        </Link>

        <Link
          href="/wishlist"
          className={`relative flex items-center justify-center text-gray-700 transition-colors duration-150 hover:text-gray-900 ${HEADER_TOOLBAR_ICON_BUTTON_CLASS}`}
        >
          <HeaderBadgeIcon
            icon={<HeaderNavbarWishlistIcon className="h-[18px] w-[18px] shrink-0" />}
            badge={wishlistCount}
          />
        </Link>
      </div>

      <Link href="/cart" className={`relative bg-marco-black text-white ${HEADER_CART_BUTTON_CLASS}`}>
        <HeaderNavbarCartIcon className="h-[21px] w-[22px] shrink-0 text-white" />
        <span className="tabular-nums">{formatPrice(cartTotal, selectedCurrency)}</span>
        {cartCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[18px] items-center justify-center rounded-full bg-red-600 px-0.5 text-[9px] font-bold text-white">
            {cartCount > 99 ? '99+' : cartCount}
          </span>
        )}
      </Link>
    </div>
  );
}
