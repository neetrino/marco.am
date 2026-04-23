'use client';

import { Suspense, useLayoutEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import type { LanguageCode } from '../lib/language';
import { useTranslation } from '../lib/i18n-client';
import { MarcoLogo } from './header/MarcoLogo';
import { MobileHeaderLocaleCurrencyButton } from './header/HeaderLocaleCurrencyPill';
import { HeaderSearchSync } from './header/HeaderSearchSync';
import { HeaderDesktopTopRow } from './header/HeaderDesktopTopRow';
import { HeaderRow2 } from './header/HeaderRow2';
import { HeaderMobileDrawer } from './header/HeaderMobileDrawer';
import { useHeaderData } from './header/useHeaderData';
import { useHeaderLayoutMetrics } from './header/useHeaderLayoutMetrics';
import {
  HEADER_CONTAINER_CLASS,
  HEADER_MOBILE_HEADER_ROUND_CONTROL_CLASS,
  HEADER_COMPACT_PRIMARY_NAV_MAX_WIDTH_PX,
} from './header/header.constants';

/** Cumulative down-scroll while the row is visible. */
const HEADER_ROW2_HIDE_AFTER_DOWN_ACCUM_PX = 12;
/** Cumulative up-scroll while the row is hidden. */
const HEADER_ROW2_SHOW_AFTER_UP_ACCUM_PX = 5;
/**
 * After a hide, ignore "show" for this long (stops down-fling + bounce from reopening).
 * After a show, ignore "hide" for the same (stops up + jitter from re-closing).
 */
const HEADER_ROW2_OPPOSITE_ACTION_SUPPRESS_MS = 85;
/** Always show the search/tools row when near the top of the page. */
const HEADER_ROW2_ALWAYS_SHOW_SCROLL_TOP_PX = 12;

type HeaderProps = {
  initialLanguage?: LanguageCode;
};

export function Header({ initialLanguage }: HeaderProps) {
  const pathname = usePathname();
  const data = useHeaderData();
  const layout = useHeaderLayoutMetrics();
  const { t } = useTranslation();
  const [row2ScrollProgress, setRow2ScrollProgress] = useState(0);
  const [row2HeightPx, setRow2HeightPx] = useState(0);
  const row2WrapperRef = useRef<HTMLDivElement>(null);
  const row2ContentRef = useRef<HTMLDivElement>(null);
  const row2ScrollProgressRef = useRef(0);
  const lastProcessedScrollYRef = useRef(0);
  const downAccumPxRef = useRef(0);
  const upAccumPxRef = useRef(0);
  const scrollRafPendingRef = useRef(false);
  const menusBlockRow2ScrollRef = useRef(false);
  /** Do not start showing (scroll-up / accum) right after a hide, until this time. */
  const suppressShowRow2UntilAtRef = useRef(0);
  /** Do not start hiding (scroll-down / accum) right after a show, until this time. */
  const suppressHideRow2UntilAtRef = useRef(0);
  /** When row2's layout height is toggled, the browser may emit scroll; ignore those. */
  const skipRow2ScrollApplyCountRef = useRef(0);
  /** Last row2 `scrollY` offset we have normalized scroll for (0 = shown, 1 = hidden in layout). */
  const row2LayoutCompensatedForRef = useRef(0);
  /** Snapshot of row2 full height; updated when `row2HeightPx` is known. */
  const row2ContentHeightForScrollRef = useRef(0);
  /** `scrollY` and height (before the row2 layout flips) for scroll anchoring. */
  const row2LayoutTransitionInputRef = useRef<{ y0: number; h: number } | null>(null);

  const { compactPrimaryNav, viewportWidth, desktopTopRowInnerRef, desktopTopRowMeasureRef } = layout;

  const {
    setSearchQuery,
    setSelectedCategory,
    categories,
    showProductsMenu,
    showUserMenu,
    showLocaleCurrencyMenu,
    setShowLocaleCurrencyMenu,
    setMobileMenuOpen,
    mobileMenuOpen,
    selectedCurrency,
    handleCurrencyChange,
  } = data;

  useLayoutEffect(() => {
    row2ScrollProgressRef.current = row2ScrollProgress;
  }, [row2ScrollProgress]);

  useLayoutEffect(() => {
    menusBlockRow2ScrollRef.current = showProductsMenu || showUserMenu || showLocaleCurrencyMenu;
  }, [showLocaleCurrencyMenu, showProductsMenu, showUserMenu]);

  useLayoutEffect(() => {
    row2ContentHeightForScrollRef.current = row2HeightPx;
  }, [row2HeightPx]);

  useLayoutEffect(() => {
    const initialY = window.scrollY;
    lastProcessedScrollYRef.current = initialY;
    let scrollRafId = 0;

    const setRow2Hidden = (isHidden: boolean) => {
      const next = isHidden ? 1 : 0;
      if (row2ScrollProgressRef.current === next) {
        return;
      }
      const h = Math.max(0, row2ContentHeightForScrollRef.current);
      row2LayoutTransitionInputRef.current = { y0: window.scrollY, h };
      const now = performance.now();
      row2ScrollProgressRef.current = next;
      setRow2ScrollProgress(next);
      downAccumPxRef.current = 0;
      upAccumPxRef.current = 0;
      if (isHidden) {
        suppressShowRow2UntilAtRef.current = now + HEADER_ROW2_OPPOSITE_ACTION_SUPPRESS_MS;
      } else {
        suppressHideRow2UntilAtRef.current = now + HEADER_ROW2_OPPOSITE_ACTION_SUPPRESS_MS;
      }
    };

    const applyRow2Scroll = () => {
      if (skipRow2ScrollApplyCountRef.current > 0) {
        skipRow2ScrollApplyCountRef.current -= 1;
        lastProcessedScrollYRef.current = window.scrollY;
        return;
      }
      const y = window.scrollY;
      const deltaY = y - lastProcessedScrollYRef.current;
      lastProcessedScrollYRef.current = y;
      const now = performance.now();

      if (menusBlockRow2ScrollRef.current) {
        return;
      }

      if (y <= HEADER_ROW2_ALWAYS_SHOW_SCROLL_TOP_PX) {
        suppressShowRow2UntilAtRef.current = 0;
        suppressHideRow2UntilAtRef.current = 0;
        downAccumPxRef.current = 0;
        upAccumPxRef.current = 0;
        if (row2ScrollProgressRef.current !== 0) {
          const h = Math.max(0, row2ContentHeightForScrollRef.current);
          row2LayoutTransitionInputRef.current = { y0: window.scrollY, h };
          row2ScrollProgressRef.current = 0;
          setRow2ScrollProgress(0);
        }
        return;
      }

      const isHidden = row2ScrollProgressRef.current === 1;

      if (deltaY === 0) {
        return;
      }
      if (!isHidden) {
        if (deltaY > 0) {
          if (now < suppressHideRow2UntilAtRef.current) {
            return;
          }
          downAccumPxRef.current += deltaY;
          upAccumPxRef.current = 0;
          if (downAccumPxRef.current >= HEADER_ROW2_HIDE_AFTER_DOWN_ACCUM_PX) {
            setRow2Hidden(true);
          }
        } else {
          downAccumPxRef.current = 0;
        }
        return;
      }

      if (deltaY < 0) {
        if (now < suppressShowRow2UntilAtRef.current) {
          return;
        }
        upAccumPxRef.current += -deltaY;
        downAccumPxRef.current = 0;
        if (upAccumPxRef.current >= HEADER_ROW2_SHOW_AFTER_UP_ACCUM_PX) {
          setRow2Hidden(false);
        }
      } else {
        upAccumPxRef.current = 0;
      }
    };

    const scheduleRow2Scroll = () => {
      if (scrollRafPendingRef.current) {
        return;
      }
      scrollRafPendingRef.current = true;
      scrollRafId = requestAnimationFrame(() => {
        scrollRafPendingRef.current = false;
        applyRow2Scroll();
        scrollRafId = 0;
      });
    };

    window.addEventListener('scroll', scheduleRow2Scroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', scheduleRow2Scroll);
      if (scrollRafId !== 0) {
        cancelAnimationFrame(scrollRafId);
      }
    };
  }, []);

  useLayoutEffect(() => {
    const next = row2ScrollProgress;
    if (row2HeightPx <= 0) {
      return;
    }
    const prev = row2LayoutCompensatedForRef.current;
    if (prev === next) {
      return;
    }
    const hBase = row2HeightPx;
    const input = row2LayoutTransitionInputRef.current;
    row2LayoutTransitionInputRef.current = null;
    const h = input && input.h > 0 ? input.h : hBase;
    const yBefore = input != null ? input.y0 : window.scrollY;
    const maxY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    const y1 = next === 1 ? Math.min(yBefore + h, maxY) : Math.max(0, yBefore - h);
    row2LayoutCompensatedForRef.current = next;
    const yAfterLayout = window.scrollY;
    if (Math.abs(y1 - yAfterLayout) < 0.5) {
      return;
    }
    skipRow2ScrollApplyCountRef.current = 3;
    window.scrollTo(0, y1);
    lastProcessedScrollYRef.current = window.scrollY;
  }, [row2ScrollProgress, row2HeightPx]);

  useLayoutEffect(() => {
    const node = row2ContentRef.current;
    if (!node) {
      return;
    }

    const syncHeight = () => {
      setRow2HeightPx(node.scrollHeight);
    };

    syncHeight();
    const observer = new ResizeObserver(syncHeight);
    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, []);

  const effectiveScrollProgress =
    showProductsMenu || showUserMenu || showLocaleCurrencyMenu ? 0 : row2ScrollProgress;
  const row2HiddenPx = Math.round(row2HeightPx * effectiveScrollProgress);
  const row2MaxHeightPx = Math.max(0, row2HeightPx - row2HiddenPx);
  const row2MarginTopPx = -row2HiddenPx;
  const row2MaxHeightStyle = row2HeightPx > 0 ? `${row2MaxHeightPx}px` : undefined;

  if (pathname?.startsWith('/supersudo')) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 border-b border-marco-border bg-white shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-[var(--app-bg)]">
      <Suspense fallback={null}>
        <HeaderSearchSync
          setSearchQuery={setSearchQuery}
          setSelectedCategory={setSelectedCategory}
          categories={categories}
        />
      </Suspense>
      {!compactPrimaryNav && (
        <div className="w-full border-b border-marco-border bg-white dark:border-white/10 dark:bg-[var(--app-bg)]">
          <HeaderDesktopTopRow innerRef={desktopTopRowInnerRef} />
        </div>
      )}
      {compactPrimaryNav &&
        viewportWidth !== null &&
        viewportWidth > HEADER_COMPACT_PRIMARY_NAV_MAX_WIDTH_PX && (
          <div
            className="pointer-events-none fixed -left-[10000px] top-0 z-[-80] w-screen opacity-0"
            aria-hidden
          >
            <HeaderDesktopTopRow innerRef={desktopTopRowMeasureRef} />
          </div>
        )}

      <div
        className={`${HEADER_CONTAINER_CLASS} ${compactPrimaryNav ? 'flex' : 'hidden'} items-center justify-between gap-2 border-b border-marco-border py-2`}
      >
        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          className={HEADER_MOBILE_HEADER_ROUND_CONTROL_CLASS}
          aria-label={t('common.ariaLabels.openMenu')}
          aria-expanded={mobileMenuOpen}
        >
          <svg className="h-6 w-6 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M5 8h14M5 12h14M5 16h14"
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth={2}
            />
          </svg>
        </button>
        <MarcoLogo />
        <MobileHeaderLocaleCurrencyButton
          selectedCurrency={selectedCurrency}
          onCurrencyChange={handleCurrencyChange}
          initialLanguage={initialLanguage}
          ariaLabel={t('common.ariaLabels.languageCurrencyMenu')}
          onMenuOpenChange={setShowLocaleCurrencyMenu}
        />
      </div>

      <div
        ref={row2WrapperRef}
        className={`${
          showProductsMenu || showUserMenu || showLocaleCurrencyMenu ? 'overflow-visible' : 'overflow-hidden'
        }`}
        style={{
          maxHeight: row2MaxHeightStyle,
        }}
      >
        <div ref={row2ContentRef} style={{ marginTop: `${row2MarginTopPx}px` }}>
          <HeaderRow2
            data={data}
            layout={layout}
            compactPrimaryNav={compactPrimaryNav}
            initialLanguage={initialLanguage}
          />
        </div>
      </div>

      <HeaderMobileDrawer data={data} compactPrimaryNav={compactPrimaryNav} />
    </header>
  );
}
