'use client';

import { Suspense, useLayoutEffect, useRef, useState } from 'react';
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

type HeaderProps = {
  initialLanguage?: LanguageCode;
};

const HEADER_ROW2_HIDE_SCROLL_DISTANCE_PX = 120;

export function Header({ initialLanguage }: HeaderProps) {
  const data = useHeaderData();
  const layout = useHeaderLayoutMetrics();
  const { t } = useTranslation();
  const [row2ScrollProgress, setRow2ScrollProgress] = useState(0);
  const [row2HeightPx, setRow2HeightPx] = useState(0);
  const row2WrapperRef = useRef<HTMLDivElement>(null);
  const row2ContentRef = useRef<HTMLDivElement>(null);

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
    const syncRow2Visibility = () => {
      const nextProgress = Math.min(window.scrollY / HEADER_ROW2_HIDE_SCROLL_DISTANCE_PX, 1);
      setRow2ScrollProgress(nextProgress);
    };

    syncRow2Visibility();
    window.addEventListener('scroll', syncRow2Visibility, { passive: true });
    return () => {
      window.removeEventListener('scroll', syncRow2Visibility);
    };
  }, []);

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

  const effectiveScrollProgress = showProductsMenu ? 0 : row2ScrollProgress;
  const row2HiddenPx = Math.round(row2HeightPx * effectiveScrollProgress);
  const row2MaxHeightPx = Math.max(0, row2HeightPx - row2HiddenPx);
  const row2MarginTopPx = -row2HiddenPx;
  const row2MaxHeightStyle = row2HeightPx > 0 ? `${row2MaxHeightPx}px` : undefined;

  return (
    <header className="sticky top-0 z-50 border-b border-marco-border bg-white shadow-sm backdrop-blur-sm">
      <Suspense fallback={null}>
        <HeaderSearchSync
          setSearchQuery={setSearchQuery}
          setSelectedCategory={setSelectedCategory}
          categories={categories}
        />
      </Suspense>
      {!compactPrimaryNav && (
        <div className="w-full border-b border-marco-border bg-white">
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
        } will-change-[max-height]`}
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
