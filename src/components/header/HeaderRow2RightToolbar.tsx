'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { LanguageCode } from '../../lib/language';
import { HeaderLocaleCurrencyPill } from './HeaderLocaleCurrencyPill';
import {
  HEADER_CART_BUTTON_CLASS,
  HEADER_FIGMA_ROW2_RIGHT_INNER_GAP_CLASS,
  HEADER_LOCALE_TO_THEME_MARGIN_CLASS,
  HEADER_TOOLBAR_ICON_CLUSTER_CLASS,
  getHeaderThemeToggleButtonClass,
  getHeaderToolbarIconSurfaceClass,
} from './header.constants';
import {
  HeaderBadgeIcon,
  HeaderProfileIconFilled,
  HeaderProfileIconOutline,
} from './HeaderInlineIcons';
import { CompareIcon } from '../icons/CompareIcon';
import { HeaderNavbarCartIcon } from '../icons/HeaderNavbarCartIcon';
import { HeaderNavbarWishlistIcon } from '../icons/HeaderNavbarWishlistIcon';
import { ThemeToggleButton } from '../theme/ThemeToggleButton';
import { useTheme } from '../theme/ThemeProvider';
import { formatMoneyInCurrency } from '../../lib/currency';
import type { useHeaderData } from './useHeaderData';

type Props = {
  data: ReturnType<typeof useHeaderData>;
  compactPrimaryNav: boolean;
  headerMobileLike: boolean;
  initialLanguage?: LanguageCode;
};

function isProfileToolbarPathActive(pathname: string, isLoggedIn: boolean): boolean {
  if (isLoggedIn) {
    return pathname.startsWith('/profile');
  }
  return (
    pathname === '/login' ||
    pathname === '/register' ||
    pathname.startsWith('/forgot-password')
  );
}

export function HeaderRow2RightToolbar({ data, compactPrimaryNav, headerMobileLike, initialLanguage }: Props) {
  const pathname = usePathname();
  const { theme, mounted: themeMounted } = useTheme();
  const themeToggleResolvedDark = themeMounted && theme === 'dark';
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
    cartTotalCurrency,
    showUserMenu,
    setShowUserMenu,
    setShowLocaleCurrencyMenu,
    selectedCurrency,
    userMenuRef,
    handleCurrencyChange,
  } = data;

  const profileToolbarActive = isProfileToolbarPathActive(pathname, isLoggedIn);
  const compareToolbarActive = pathname.startsWith('/compare');
  const wishlistToolbarActive = pathname.startsWith('/wishlist');

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
      <ThemeToggleButton
        className={`${getHeaderThemeToggleButtonClass(themeToggleResolvedDark)} ${!compactPrimaryNav ? HEADER_LOCALE_TO_THEME_MARGIN_CLASS : ''}`}
        iconClassName="h-6 w-6 shrink-0"
      />
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
                className={getHeaderToolbarIconSurfaceClass(profileToolbarActive)}
                aria-haspopup="menu"
                aria-expanded={showUserMenu}
                aria-current={profileToolbarActive ? 'page' : undefined}
              >
                <HeaderProfileIconFilled />
              </button>
              {showUserMenu && (
                <div
                  data-theme-static="true"
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
              className={getHeaderToolbarIconSurfaceClass(profileToolbarActive)}
              aria-current={profileToolbarActive ? 'page' : undefined}
            >
              <HeaderProfileIconOutline />
            </Link>
          )}
        </div>

        <Link
          href="/compare"
          className={getHeaderToolbarIconSurfaceClass(compareToolbarActive)}
          aria-current={compareToolbarActive ? 'page' : undefined}
        >
          <HeaderBadgeIcon
            icon={<CompareIcon size={18} className="h-[18px] w-[18px] shrink-0" />}
            badge={compareCount}
          />
        </Link>

        <Link
          href="/wishlist"
          className={getHeaderToolbarIconSurfaceClass(wishlistToolbarActive)}
          aria-current={wishlistToolbarActive ? 'page' : undefined}
        >
          <HeaderBadgeIcon
            icon={<HeaderNavbarWishlistIcon className="h-[18px] w-[18px] shrink-0" />}
            badge={wishlistCount}
          />
        </Link>
      </div>

      <Link
        href="/cart"
        className={`relative !bg-[#050505] !text-white dark:!bg-white dark:!text-[#050505] dark:ring-1 dark:ring-black/10 ${HEADER_CART_BUTTON_CLASS}`}
      >
        <HeaderNavbarCartIcon className="h-[21px] w-[22px] shrink-0 !text-white dark:!text-[#050505]" />
        <span className="tabular-nums text-inherit">
          {formatMoneyInCurrency(cartTotal, cartTotalCurrency, selectedCurrency)}
        </span>
        {cartCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[18px] items-center justify-center rounded-full bg-red-600 px-0.5 text-[9px] font-bold text-[#ffffff]">
            {cartCount > 99 ? '99+' : cartCount}
          </span>
        )}
      </Link>
    </div>
  );
}
