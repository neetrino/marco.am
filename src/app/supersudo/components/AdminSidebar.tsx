'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminMenuDrawer } from '../../../components/AdminMenuDrawer';
import { getAdminMenuTABS } from '../admin-menu.config';
import { getStoredLanguage, setStoredLanguage, type LanguageCode } from '../../../lib/language';

interface AdminSidebarProps {
  currentPath: string;
  router: ReturnType<typeof useRouter>;
  t: ReturnType<typeof import('../../../lib/i18n-client').useTranslation>['t'];
}

const PRODUCT_SUBMENU_ITEM_IDS = new Set(['categories', 'brands', 'attributes']);
const PRODUCT_SECTION_PATHS = ['/supersudo/products', '/supersudo/categories', '/supersudo/brands', '/supersudo/attributes'] as const;
const ADMIN_LANGUAGES = ['en', 'hy', 'ru'] as const;
type AdminLanguageCode = (typeof ADMIN_LANGUAGES)[number];

export function AdminSidebar({ currentPath, router, t }: AdminSidebarProps) {
  const adminTabs = getAdminMenuTABS(t);
  const homeTab = adminTabs.find((tab) => tab.id === 'home');
  const sidebarTabs = adminTabs.filter((tab) => tab.id !== 'home');
  const isProductsSectionActive = PRODUCT_SECTION_PATHS.some(
    (path) => currentPath === path || currentPath.startsWith(`${path}/`),
  );
  const [isProductsExpanded, setIsProductsExpanded] = useState(isProductsSectionActive);
  const [currentLanguage, setCurrentLanguage] = useState<AdminLanguageCode>(() => {
    const stored = getStoredLanguage();
    return stored === 'en' || stored === 'hy' || stored === 'ru' ? stored : 'en';
  });

  useEffect(() => {
    if (isProductsSectionActive) {
      setIsProductsExpanded(true);
    }
  }, [isProductsSectionActive]);

  useEffect(() => {
    const syncLanguage = () => {
      const stored = getStoredLanguage();
      setCurrentLanguage(stored === 'en' || stored === 'hy' || stored === 'ru' ? stored : 'en');
    };

    window.addEventListener('language-updated', syncLanguage);
    return () => {
      window.removeEventListener('language-updated', syncLanguage);
    };
  }, []);

  const handleLanguageChange = (language: AdminLanguageCode) => {
    if (currentLanguage === language) {
      return;
    }
    setCurrentLanguage(language);
    setStoredLanguage(language as LanguageCode, { skipReload: true });
  };

  return (
    <>
      <div className="lg:hidden mb-6">
        <AdminMenuDrawer tabs={adminTabs} currentPath={currentPath} />
      </div>
      <aside className="hidden lg:block lg:w-64 flex-shrink-0">
        <nav className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-marco-border bg-white/95 p-3 shadow-[0_8px_24px_rgba(16,16,16,0.06)] backdrop-blur-sm">
          <div className="mb-3 border-b border-marco-border pb-3">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-marco-text/70">Admin Panel</p>
          </div>
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
                  <button
                    onClick={() => router.push(tab.path)}
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
                  </button>
                  <button
                    aria-label="Toggle products submenu"
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
              <button
                key={tab.id}
                onClick={() => {
                  router.push(tab.path);
                }}
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
              </button>
            );
          })}
          </div>
          <div className="mt-3 border-t border-marco-border pt-3">
            {homeTab ? (
              <button
                type="button"
                onClick={() => router.push(homeTab.path)}
                className={`group mb-3 w-full flex items-center justify-between rounded-2xl border px-3 py-3 text-sm font-semibold transition-all duration-200 ${
                  currentPath === '/'
                    ? 'border-marco-yellow bg-marco-yellow/90 text-marco-black shadow-[0_8px_20px_rgba(247,206,63,0.35)]'
                    : 'border-marco-yellow/40 bg-marco-yellow/20 text-marco-text hover:-translate-y-0.5 hover:border-marco-yellow hover:bg-marco-yellow/35 hover:text-marco-black'
                }`}
              >
                <span className="flex items-center gap-3">
                  <span
                    className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl transition-colors ${
                      currentPath === '/'
                        ? 'bg-marco-black/10 text-marco-black'
                        : 'bg-marco-yellow/35 text-marco-text/80 group-hover:bg-marco-yellow/50 group-hover:text-marco-black'
                    }`}
                  >
                    {homeTab.icon}
                  </span>
                  <span className="text-left leading-tight">
                    <span className="block text-xs font-medium uppercase tracking-[0.08em] text-current/70">Quick Access</span>
                    <span className="block">{homeTab.label}</span>
                  </span>
                </span>
                <svg
                  className={`h-4 w-4 transition-transform duration-200 ${
                    currentPath === '/' ? 'text-marco-black' : 'text-marco-text/50 group-hover:translate-x-0.5 group-hover:text-marco-black'
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ) : null}
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
}

