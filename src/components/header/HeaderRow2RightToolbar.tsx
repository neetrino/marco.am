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
    router,
    isLoggedIn,
    isAdmin,
    logout,
    compareCount,
    wishlistCount,
    cartCount,
    cartTotal,
    showUserMenu,
    setShowUserMenu,
    setShowLocaleCurrencyMenu,
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
          onMenuOpenChange={setShowLocaleCurrencyMenu}
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
        <div
          className="relative shrink-0"
          ref={userMenuRef}
        >
          {isLoggedIn ? (
            <>
              <button
                type="button"
                onMouseDown={(event) => event.stopPropagation()}
                onClick={(event) => {
                  event.stopPropagation();
                  setShowUserMenu(!showUserMenu);
                }}
                className={`flex items-center justify-center transition-all duration-200 group ${HEADER_TOOLBAR_ICON_BUTTON_CLASS}`}
                aria-haspopup="menu"
                aria-expanded={showUserMenu}
              >
                <HeaderProfileIconFilled />
              </button>
              {showUserMenu && (
                <div
                  className="absolute right-0 top-full z-[60] mt-2 w-52 overflow-hidden rounded-xl border border-gray-200/80 bg-white shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200"
                  role="menu"
                  onMouseDown={(event) => event.stopPropagation()}
                >
                  <Link
                    href="/profile"
                    className="block border-b border-gray-100 px-5 py-3 text-sm font-medium text-gray-700 transition-all duration-150 hover:bg-gradient-to-r hover:from-gray-50 hover:to-white"
                    onClick={() => setShowUserMenu(false)}
                  >
                    {t('common.navigation.profile')}
                  </Link>
                  {isAdmin && (
                    <Link
                      href="/supersudo"
                      className="block border-b border-gray-100 px-5 py-3 text-sm font-medium text-blue-600 transition-all duration-150 hover:bg-gradient-to-r hover:from-blue-50 hover:to-white"
                      onClick={() => setShowUserMenu(false)}
                    >
                      {t('common.navigation.adminPanel')}
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserMenu(false);
                      logout();
                      router.push('/login');
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
