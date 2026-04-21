'use client';

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { logger } from "@/lib/utils/logger";
import { useTranslation } from '../lib/i18n-client';

export interface AdminMenuItem {
  id: string;
  label: string;
  path: string;
  icon: ReactNode;
  isSubCategory?: boolean;
}

const PRODUCT_SUBMENU_ITEM_IDS = new Set(['categories', 'brands', 'attributes']);
const PRODUCT_SECTION_PATHS = ['/supersudo/products', '/supersudo/categories', '/supersudo/brands', '/supersudo/attributes'] as const;

interface AdminMenuDrawerProps {
  tabs: AdminMenuItem[];
  currentPath: string;
}

/**
 * Renders a mobile-friendly admin hamburger menu that mirrors the desktop sidebar.
 */
export function AdminMenuDrawer({ tabs, currentPath }: AdminMenuDrawerProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isProductsExpanded, setIsProductsExpanded] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    if (open) {
      logger.devInfo('[AdminMenuDrawer] Locking body scroll for open drawer');
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  /**
   * Handles navigation button clicks inside the drawer.
   */
  const handleNavigate = (path: string) => {
    logger.devInfo('[AdminMenuDrawer] Navigating to admin path', { path });
    router.push(path);
    setOpen(false);
  };

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => {
          logger.devInfo('[AdminMenuDrawer] Toggling drawer', { open: !open });
          setOpen(true);
        }}
        className="inline-flex items-center gap-2 rounded-full border border-marco-border bg-white px-4 py-2 text-sm font-semibold uppercase tracking-wide text-marco-text shadow-sm transition-colors hover:bg-marco-gray"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6H20M4 12H16M4 18H12" />
        </svg>
        {t('common.menu.button')}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex bg-marco-black/40 backdrop-blur-sm"
          onClick={() => {
            logger.devInfo('[AdminMenuDrawer] Closing drawer from backdrop');
            setOpen(false);
          }}
        >
          <div
            className="h-full min-h-screen w-1/2 min-w-[16rem] max-w-full border-r border-marco-border bg-white flex flex-col shadow-2xl"
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-marco-border px-5 py-4">
              <p className="text-lg font-semibold text-marco-text">{t('common.menu.title')}</p>
              <button
                type="button"
                onClick={() => {
                  logger.devInfo('[AdminMenuDrawer] Closing drawer from close button');
                  setOpen(false);
                }}
                className="h-10 w-10 rounded-full border border-marco-border text-marco-text/80 transition-colors hover:bg-marco-gray hover:text-marco-black"
                aria-label="Закрыть меню админки"
              >
                <svg className="mx-auto h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-marco-border/80">
              {tabs.map((tab) => {
                const isProductsItem = tab.id === 'products';
                const isProductSubmenuItem = PRODUCT_SUBMENU_ITEM_IDS.has(tab.id);

                if (isProductSubmenuItem && !isProductsExpanded) {
                  return null;
                }

                const isProductsSectionActive = PRODUCT_SECTION_PATHS.some(
                  (path) => currentPath === path || currentPath.startsWith(`${path}/`),
                );
                const isActive = isProductsItem
                  ? isProductsSectionActive
                  : tab.path === '/'
                    ? currentPath === '/'
                    : currentPath === tab.path ||
                      (tab.path === '/supersudo' && currentPath === '/supersudo') ||
                      (tab.path !== '/supersudo' && currentPath.startsWith(tab.path));

                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      if (isProductsItem) {
                        setIsProductsExpanded((prev) => !prev);
                        return;
                      }

                      handleNavigate(tab.path);
                    }}
                    className={`group flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold transition-colors ${
                      tab.isSubCategory ? 'pl-9' : ''
                    } ${
                      isActive
                        ? 'bg-marco-yellow text-marco-black'
                        : 'text-marco-text hover:bg-marco-gray'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span
                        className={`transition-colors ${
                          isActive ? 'text-marco-black' : 'text-marco-text/70 group-hover:text-marco-black'
                        }`}
                      >
                        {tab.icon}
                      </span>
                      {tab.label}
                    </span>
                    <svg
                      className={`w-4 h-4 ${isActive ? 'text-marco-black' : 'text-marco-text/50 group-hover:text-marco-black'}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      {isProductsItem ? (
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d={isProductsExpanded ? 'M19 9l-7 7-7-7' : 'M9 5l7 7-7 7'}
                        />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      )}
                    </svg>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
