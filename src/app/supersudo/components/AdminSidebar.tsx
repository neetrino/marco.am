'use client';

import { memo, useEffect, useState, useSyncExternalStore } from 'react';
import { AdminMenuDrawer } from '../../../components/AdminMenuDrawer';
import { getAdminMenuTABS } from '../admin-menu.config';
import { getStoredLanguage, setStoredLanguage, type LanguageCode } from '../../../lib/language';
import { AdminNavLink } from './AdminNavLink';

interface AdminSidebarProps {
  currentPath: string;
  t: ReturnType<typeof import('../../../lib/i18n-client').useTranslation>['t'];
}

const PRODUCT_SUBMENU_ITEM_IDS = new Set(['categories', 'brands', 'attributes']);
const PRODUCT_SECTION_PATHS = ['/supersudo/products', '/supersudo/categories', '/supersudo/brands', '/supersudo/attributes'] as const;
const ADMIN_LANGUAGES = ['en', 'hy', 'ru'] as const;
type AdminLanguageCode = (typeof ADMIN_LANGUAGES)[number];

const DEFAULT_ADMIN_LANGUAGE: AdminLanguageCode = 'en';

function normalizeAdminLanguage(code: LanguageCode | string | null | undefined): AdminLanguageCode {
  return code === 'en' || code === 'hy' || code === 'ru' ? code : DEFAULT_ADMIN_LANGUAGE;
}

function readAdminSidebarLanguage(): AdminLanguageCode {
  return normalizeAdminLanguage(getStoredLanguage());
}

function subscribeAdminSidebarLanguage(onStoreChange: () => void): () => void {
  window.addEventListener('language-updated', onStoreChange);
  return () => {
    window.removeEventListener('language-updated', onStoreChange);
  };
}

export const AdminSidebar = memo(function AdminSidebar({ currentPath, t }: AdminSidebarProps) {
  const adminTabs = getAdminMenuTABS(t);
  const homeTab = adminTabs.find((tab) => tab.id === 'home');
  const sidebarTabs = adminTabs.filter((tab) => tab.id !== 'home');
  const isProductsSectionActive = PRODUCT_SECTION_PATHS.some(
    (path) => currentPath === path || currentPath.startsWith(`${path}/`),
  );
  const [isProductsExpanded, setIsProductsExpanded] = useState(isProductsSectionActive);
  const currentLanguage = useSyncExternalStore(
    subscribeAdminSidebarLanguage,
    readAdminSidebarLanguage,
    () => DEFAULT_ADMIN_LANGUAGE,
  );

  useEffect(() => {
    if (isProductsSectionActive) {
      setIsProductsExpanded(true);
    }
  }, [isProductsSectionActive]);

  const handleLanguageChange = (language: AdminLanguageCode) => {
    if (currentLanguage === language) {
      return;
    }
    setStoredLanguage(language as LanguageCode, { skipReload: true });
  };

  return (
    <>
      <div className="lg:hidden mb-6">
        <AdminMenuDrawer tabs={adminTabs} currentPath={currentPath} />
      </div>
      <aside className="hidden lg:block lg:w-64 flex-shrink-0">
        <nav className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-marco-border bg-white/95 p-3 shadow-[0_8px_24px_rgba(16,16,16,0.06)] backdrop-blur-sm">
          {homeTab ? (
            <div className="mb-3 border-b border-marco-border pb-3">
              <AdminNavLink
                href={homeTab.path}
                className={`group w-full flex items-center rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors duration-200 ${
                  currentPath === '/'
                    ? 'bg-marco-yellow text-marco-black shadow-sm'
                    : 'text-marco-text hover:bg-marco-gray hover:text-marco-black'
                }`}
              >
                <span className="flex items-center gap-3">
                  <span
                    className={`flex-shrink-0 transition-colors ${
                      currentPath === '/'
                        ? 'text-marco-black'
                        : 'text-marco-text/70 group-hover:text-marco-black'
                    }`}
                  >
                    {homeTab.icon}
                  </span>
                  <span className="text-left">{homeTab.label}</span>
                </span>
              </AdminNavLink>
            </div>
          ) : null}
          <div className="flex-1 space-y-1 overflow-y-auto">
          {sidebarTabs.map((tab) => {
            const isProductsItem = tab.id === 'products';
            const isProductSubmenuItem = PRODUCT_SUBMENU_ITEM_IDS.has(tab.id);

            if (isProductSubmenuItem && !isProductsExpanded) {
              return null;
            }

            const isActive = isProductsItem
              ? isProductsSectionActive
              : tab.path === '/'
                ? currentPath === '/'
                : currentPath === tab.path ||
                  (tab.path === '/supersudo' && currentPath === '/supersudo') ||
                  (tab.path !== '/supersudo' && currentPath.startsWith(tab.path));

            if (isProductsItem) {
              return (
                <div key={tab.id} className="group flex items-center gap-1">
                  <AdminNavLink
                    href={tab.path}
                    className={`flex-1 flex items-center rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors duration-200 ${
                      isActive
                        ? 'bg-marco-yellow text-marco-black shadow-sm'
                        : 'text-marco-text hover:bg-marco-gray hover:text-marco-black'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span
                        className={`flex-shrink-0 transition-colors ${
                          isActive ? 'text-marco-black' : 'text-marco-text/70 group-hover:text-marco-black'
                        }`}
                      >
                        {tab.icon}
                      </span>
                      <span className="text-left">{tab.label}</span>
                    </span>
                  </AdminNavLink>
                  <button
                    aria-label={t('admin.common.toggleProductsSubmenu')}
                    onClick={() => setIsProductsExpanded((prev) => !prev)}
                    className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
                      isActive
                        ? 'bg-marco-yellow text-marco-black shadow-sm'
                        : 'text-marco-text/50 hover:bg-marco-gray hover:text-marco-black'
                    }`}
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d={isProductsExpanded ? 'M19 9l-7 7-7-7' : 'M9 5l7 7-7 7'}
                      />
                    </svg>
                  </button>
                </div>
              );
            }

            return (
              <AdminNavLink
                key={tab.id}
                href={tab.path}
                className={`group w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors duration-200 ${
                  tab.isSubCategory ? 'pl-9' : ''
                } ${
                  isActive
                    ? 'bg-marco-yellow text-marco-black shadow-sm'
                    : 'text-marco-text hover:bg-marco-gray hover:text-marco-black'
                }`}
              >
                <span className="flex items-center gap-3">
                  <span
                    className={`flex-shrink-0 transition-colors ${
                      isActive ? 'text-marco-black' : 'text-marco-text/70 group-hover:text-marco-black'
                    }`}
                  >
                    {tab.icon}
                  </span>
                  <span className="text-left">{tab.label}</span>
                </span>
              </AdminNavLink>
            );
          })}
          </div>
          <div className="mt-3 border-t border-marco-border pt-3">
            <div className="grid grid-cols-3 gap-2">
              {ADMIN_LANGUAGES.map((language) => {
                const isActive = language === currentLanguage;
                return (
                  <button
                    key={language}
                    type="button"
                    onClick={() => handleLanguageChange(language)}
                    aria-pressed={isActive}
                    className={`rounded-lg px-2 py-2 text-xs font-semibold uppercase tracking-wide transition-colors ${
                      isActive
                        ? 'bg-marco-yellow text-marco-black shadow-sm'
                        : 'border border-marco-border text-marco-text hover:bg-marco-gray hover:text-marco-black'
                    }`}
                  >
                    {language}
                  </button>
                );
              })}
            </div>
          </div>
        </nav>
      </aside>
    </>
  );
});

