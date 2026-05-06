'use client';

import { useState, useEffect, useMemo, useCallback, useTransition } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from '../lib/i18n-client';
import { logger } from '@/lib/utils/logger';
import {
  MOBILE_DRAWER_CLOSE_BTN_CLASS,
  MOBILE_DRAWER_CONTENT_MAX_CLASS,
  MOBILE_DRAWER_MENU_HEADER_ROW_CLASS,
  MOBILE_DRAWER_PANEL_CLASS,
} from './header/header-mobile-drawer.classes';
import { MobileFiltersDraftProvider } from './mobile-filters-draft-context';

interface MobileFiltersDrawerProps {
  title?: string;
  triggerLabel?: string;
  children: ReactNode;
  openEventName?: string;
}

/**
 * Mobile filters drawer that կարող է բացվել թե՛ կոճակից, թե՛ արտաքին իրադարձությունից։
 */
export function MobileFiltersDrawer({
  title,
  triggerLabel: _triggerLabel,
  children,
  openEventName,
}: MobileFiltersDrawerProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const urlSearchParams = useSearchParams();
  const defaultTitle = title || t('products.mobileFilters.title');
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [draftSearchParams, setDraftSearchParams] = useState<URLSearchParams>(
    () => new URLSearchParams(urlSearchParams.toString())
  );

  const closeDrawer = useCallback(() => {
    setOpen(false);
  }, []);

  const handleApplyFilters = useCallback(() => {
    const currentQs = urlSearchParams.toString();
    const qs = draftSearchParams.toString();
    closeDrawer();
    if (qs === currentQs) {
      return;
    }
    const href = qs ? `/products?${qs}` : '/products';
    startTransition(() => {
      void router.push(href);
    });
  }, [closeDrawer, draftSearchParams, router, startTransition, urlSearchParams]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      document.body.dataset.mobileFiltersOpen = 'true';
    } else {
      document.body.style.overflow = '';
      delete document.body.dataset.mobileFiltersOpen;
    }
    return () => {
      document.body.style.overflow = '';
      delete document.body.dataset.mobileFiltersOpen;
    };
  }, [open]);

  useEffect(() => {
    if (!openEventName) return;

    const handleExternalToggle = () => {
      logger.devDebug('[MobileFiltersDrawer] external toggle received');
      setOpen((prev) => {
        const next = !prev;
        if (next) {
          setDraftSearchParams(new URLSearchParams(urlSearchParams.toString()));
        }
        return next;
      });
    };

    window.addEventListener(openEventName, handleExternalToggle);
    return () => {
      window.removeEventListener(openEventName, handleExternalToggle);
    };
  }, [openEventName, urlSearchParams]);

  const updateDraftSearchParams = useCallback((updater: (params: URLSearchParams) => void) => {
    setDraftSearchParams((prev) => {
      const next = new URLSearchParams(prev.toString());
      updater(next);
      return next;
    });
  }, []);

  const draftContextValue = useMemo(
    () => ({
      enabled: true,
      searchParams: draftSearchParams,
      updateSearchParams: updateDraftSearchParams,
    }),
    [draftSearchParams, updateDraftSearchParams]
  );

  if (!open || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div
      className={`fixed inset-0 z-[200] min-[744px]:hidden ${MOBILE_DRAWER_PANEL_CLASS}`}
      role="dialog"
      aria-modal="true"
      aria-label={defaultTitle}
    >
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden px-3 min-[400px]:px-4">
        <div className="flex min-h-0 flex-1 flex-col gap-y-2 pb-3 text-marco-black dark:text-white">
          <div className={MOBILE_DRAWER_MENU_HEADER_ROW_CLASS}>
            <h2 className="text-base font-bold text-marco-black dark:text-white">{defaultTitle}</h2>
            <button
              type="button"
              onClick={closeDrawer}
              className={`${MOBILE_DRAWER_CLOSE_BTN_CLASS} absolute right-0 top-1/2 -translate-y-1/2`}
              aria-label={t('products.mobileFilters.close')}
            >
              <svg className="mx-auto h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className={`${MOBILE_DRAWER_CONTENT_MAX_CLASS} flex min-h-0 flex-1 flex-col`}>
            <MobileFiltersDraftProvider value={draftContextValue}>
              <div className="min-h-0 flex-1 overflow-y-auto pb-3">{children}</div>
            </MobileFiltersDraftProvider>
            <div className="sticky bottom-0 border-t border-marco-black/10 bg-[#F2F2F7] pb-[calc(env(safe-area-inset-bottom)+0.35rem)] pt-3 dark:border-white/10 dark:bg-zinc-950">
              <button
                type="button"
                onClick={handleApplyFilters}
                disabled={isPending}
                className="flex min-h-[3.25rem] w-full items-center justify-center rounded-full bg-marco-yellow px-6 py-3 text-xs font-bold uppercase tracking-wide text-marco-black transition-[filter] duration-200 hover:brightness-95 active:brightness-90"
              >
                {t('products.mobileFilters.apply')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

