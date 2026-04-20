'use client';

import { createPortal } from 'react-dom';
import Link from 'next/link';
import { CompareIcon } from '../icons/CompareIcon';
import { HeaderNavbarWishlistIcon } from '../icons/HeaderNavbarWishlistIcon';
import { MobileNavCartLinearIcon } from '../mobile-bottom-nav-icons';
import { HeaderSocialCircleLinks } from './HeaderSocialCircleLinks';
import { useShouldHideHeaderSocialLinks } from './useShouldHideHeaderSocialLinks';
import { HeaderProfileIconFilled } from './HeaderInlineIcons';
import { primaryNavLinks } from './nav-config';
import type { useHeaderData } from './useHeaderData';

type Props = {
  data: ReturnType<typeof useHeaderData>;
  compactPrimaryNav: boolean;
};

export function HeaderMobileDrawer({ data, compactPrimaryNav }: Props) {
  const hideHeaderSocialLinks = useShouldHideHeaderSocialLinks();
  const {
    t,
    mobileMenuOpen,
    setMobileMenuOpen,
    isLoggedIn,
    logout,
    isAdmin,
    wishlistCount,
    compareCount,
    cartCount,
    currentYear,
  } = data;

  if (!mobileMenuOpen) {
    return null;
  }

  const drawer = (
    <div
      className={`pointer-events-auto fixed inset-0 z-[200] flex touch-none bg-black/40 backdrop-blur-sm ${compactPrimaryNav ? '' : 'md:hidden'}`}
      role="dialog"
      aria-modal="true"
      onClick={() => setMobileMenuOpen(false)}
    >
      <div
        className="flex h-full min-h-screen w-1/2 min-w-[16rem] max-w-full touch-auto flex-col bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <p className="text-lg font-semibold text-gray-900">{t('common.menu.title')}</p>
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
              {primaryNavLinks.map((link) => {
                if (link.translationKey === 'common.navigation.reels') {
                  return (
                    <div key="common.navigation.reels" className="border-b border-gray-200">
                      {link.external === true ? (
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
                        >
                          {t(link.translationKey)}
                          <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </a>
                      ) : (
                        <Link
                          href={link.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
                        >
                          {t(link.translationKey)}
                          <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      )}
                      {!hideHeaderSocialLinks && (
                        <div className="flex justify-center border-t border-gray-100 px-4 py-4 normal-case">
                          <HeaderSocialCircleLinks />
                        </div>
                      )}
                    </div>
                  );
                }
                return link.external === true ? (
                  <a
                    key={link.translationKey}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
                  >
                    {t(link.translationKey)}
                    <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                ) : (
                  <Link
                    key={link.translationKey}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
                  >
                    {t(link.translationKey)}
                    <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                );
              })}

              <Link
                href="/wishlist"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
              >
                <span className="flex items-center gap-2 normal-case font-medium text-gray-700">
                  <HeaderNavbarWishlistIcon className="h-[18px] w-[18px] shrink-0" />
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
                  {t('common.navigation.compare')}
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
                  <MobileNavCartLinearIcon className="h-[19px] w-[19px]" />
                  {t('common.navigation.cart')}
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
                      <HeaderProfileIconFilled />
                      {t('common.navigation.profile')}
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
                      <span>{t('common.navigation.adminPanel')}</span>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      logout();
                    }}
                    className="flex w-full items-center justify-between px-4 py-3 text-left text-red-600 hover:bg-red-50 normal-case font-semibold"
                  >
                    {t('common.navigation.logout')}
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
                    <span>{t('common.navigation.login')}</span>
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between px-4 py-3 hover:bg-gray-900 hover:text-white normal-case text-gray-900 font-semibold"
                  >
                    <span>{t('register.form.createAccount')}</span>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </>
              )}
            </div>

            <div className="border-t border-gray-200 px-4 py-4 text-xs font-medium tracking-wide text-gray-500 normal-case">
              © {currentYear} MARCO GROUP
            </div>
          </nav>
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') {
    return null;
  }

  return createPortal(drawer, document.body);
}
