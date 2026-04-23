'use client';

import { useContext, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { CompareIcon } from '../icons/CompareIcon';
import { HeaderNavbarWishlistIcon } from '../icons/HeaderNavbarWishlistIcon';
import { MobileNavCartLinearIcon } from '../mobile-bottom-nav-icons';
import { LanguagePreferenceContext } from '../../lib/language-context';
import { HeaderSocialCircleLinks } from './HeaderSocialCircleLinks';
import { useShouldHideHeaderSocialLinks } from './useShouldHideHeaderSocialLinks';
import { HeaderProfileIconFilled } from './HeaderInlineIcons';
import { primaryNavLinks } from './nav-config';
import { ThemeToggleButton } from '../theme/ThemeToggleButton';
import type { useHeaderData } from './useHeaderData';
import { resolveCategoryNavPresentation } from './categoryNavPresentation';

type Props = {
  data: ReturnType<typeof useHeaderData>;
  compactPrimaryNav: boolean;
};

export function HeaderMobileDrawer({ data, compactPrimaryNav }: Props) {
  const lang = useContext(LanguagePreferenceContext);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [expandedCategorySlug, setExpandedCategorySlug] = useState<string | null>(null);
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
    categories,
    loadingCategories,
    getRootCategories,
  } = data;
  const rootCategories = getRootCategories(categories);

  useEffect(() => {
    if (!mobileMenuOpen) {
      setCategoriesOpen(false);
      setExpandedCategorySlug(null);
    }
  }, [mobileMenuOpen]);

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
        className="flex h-full min-h-screen w-[70vw] min-w-[18rem] max-w-[28rem] touch-auto flex-col bg-white shadow-2xl"
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
              <div className="border-b border-gray-200 normal-case">
                <button
                  type="button"
                  onClick={() => setCategoriesOpen((prev) => !prev)}
                  className="flex w-full items-center justify-between px-4 py-3 font-semibold text-gray-800 hover:bg-gray-50"
                  aria-expanded={categoriesOpen}
                  aria-controls="mobile-categories-menu"
                >
                  <span className="uppercase tracking-wide">{t('common.navigation.categories')}</span>
                  <svg
                    className={`h-4 w-4 text-gray-400 transition-transform duration-200 dark:text-white ${categoriesOpen ? 'rotate-180' : 'rotate-0'}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {categoriesOpen && (
                  <div id="mobile-categories-menu" className="border-t border-gray-100 bg-gray-50/60">
                    {loadingCategories ? (
                      <p className="px-4 py-3 text-sm text-gray-500">{t('common.messages.loading')}</p>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {rootCategories.map((category) => {
                          const categoryPresentation = resolveCategoryNavPresentation(
                            category.slug,
                            category.title,
                            lang
                          );
                          const CategoryIcon =
                            categoryPresentation.icon.kind === 'lucide'
                              ? categoryPresentation.icon.Icon
                              : null;
                          const hasChildren = category.children.length > 0;
                          const isExpanded = expandedCategorySlug === category.slug;
                          return (
                            <div key={category.id}>
                              <div className="flex items-center justify-between gap-2 px-4 py-2.5">
                                <Link
                                  href={`/products?category=${category.slug}`}
                                  onClick={() => setMobileMenuOpen(false)}
                                  className="flex min-w-0 flex-1 items-center gap-2.5 text-sm font-medium leading-5 text-gray-700 hover:text-gray-900"
                                >
                                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white dark:bg-slate-800">
                                    {categoryPresentation.icon.kind === 'figma' ? (
                                      <img
                                        src={categoryPresentation.icon.src}
                                        alt=""
                                        width={22}
                                        height={22}
                                        className="h-[22px] w-[22px] object-contain dark:brightness-0 dark:invert"
                                        draggable={false}
                                      />
                                    ) : (
                                      CategoryIcon && (
                                        <CategoryIcon
                                          size={18}
                                          strokeWidth={1.7}
                                          className="text-gray-700 dark:text-white"
                                          aria-hidden
                                        />
                                      )
                                    )}
                                  </span>
                                  <span className="min-w-0 flex-1 whitespace-normal break-words">
                                    {categoryPresentation.title}
                                  </span>
                                </Link>
                                {hasChildren && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setExpandedCategorySlug((prev) =>
                                        prev === category.slug ? null : category.slug
                                      )
                                    }
                                    className="rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-white dark:hover:bg-slate-700 dark:hover:text-white"
                                    aria-expanded={isExpanded}
                                    aria-label={isExpanded ? t('common.ariaLabels.closeMenu') : t('common.ariaLabels.openMenu')}
                                  >
                                    <svg
                                      className={`h-4 w-4 transition-transform duration-200 ${isExpanded ? 'rotate-90' : 'rotate-0'}`}
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                      aria-hidden
                                    >
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                  </button>
                                )}
                              </div>
                              {hasChildren && isExpanded && (
                                <div className="space-y-1.5 pb-2 pl-8 pr-4">
                                  {category.children.map((child) => {
                                    const childPresentation = resolveCategoryNavPresentation(
                                      child.slug,
                                      child.title,
                                      lang
                                    );
                                    const ChildIcon =
                                      childPresentation.icon.kind === 'lucide'
                                        ? childPresentation.icon.Icon
                                        : null;
                                    return (
                                    <Link
                                      key={child.id}
                                      href={`/products?category=${child.slug}`}
                                      onClick={() => setMobileMenuOpen(false)}
                                        className="flex items-start gap-2 py-1 text-sm leading-5 text-gray-600 hover:text-gray-900"
                                    >
                                        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded bg-white dark:bg-slate-800">
                                          {childPresentation.icon.kind === 'figma' ? (
                                            <img
                                              src={childPresentation.icon.src}
                                              alt=""
                                              width={16}
                                              height={16}
                                              className="h-4 w-4 object-contain dark:brightness-0 dark:invert"
                                              draggable={false}
                                            />
                                          ) : (
                                            ChildIcon && (
                                              <ChildIcon
                                                size={14}
                                                strokeWidth={1.7}
                                                className="text-gray-700 dark:text-white"
                                                aria-hidden
                                              />
                                            )
                                          )}
                                        </span>
                                        <span className="whitespace-normal break-words">
                                          {childPresentation.title}
                                        </span>
                                    </Link>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

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
                  <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-semibold text-white">
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

              <div className="border-b border-gray-200 px-4 py-3 normal-case">
                <ThemeToggleButton
                  className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 text-left text-gray-800 transition-colors hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                  iconClassName="h-5 w-5 shrink-0"
                  labelClassName="text-sm font-semibold"
                  showLabel
                />
              </div>

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
                      href="/supersudo"
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
