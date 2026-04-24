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
import { useHeaderRow2AutoHide } from './header/useHeaderRow2AutoHide';
import {
  HEADER_CONTAINER_CLASS,
  HEADER_MOBILE_HEADER_ROUND_CONTROL_CLASS,
  HEADER_COMPACT_PRIMARY_NAV_MAX_WIDTH_PX,
} from './header/header.constants';

const HEADER_ROW2_WRAPPER_CLASS =
  'transition-[max-height] duration-220 ease-out motion-reduce:transition-none';
const HEADER_ROW2_CONTENT_CLASS =
  'will-change-transform transition-transform duration-220 ease-out motion-reduce:transition-none';

type HeaderProps = {
  initialLanguage?: LanguageCode;
};

export function Header({ initialLanguage }: HeaderProps) {
  const pathname = usePathname();
  const data = useHeaderData();
  const layout = useHeaderLayoutMetrics();
  const { t } = useTranslation();
  const [row2HeightPx, setRow2HeightPx] = useState(0);
  const row2ContentRef = useRef<HTMLDivElement>(null);

  const { compactPrimaryNav, viewportWidth, desktopTopRowInnerRef, desktopTopRowMeasureRef } = layout;

  const {
    setSearchQuery,
    setSelectedCategory,
    categories,
    showProductsMenu,
    showUserMenu,
    showLocaleCurrencyMenu,
    searchDropdownOpen,
    setShowLocaleCurrencyMenu,
    setMobileMenuOpen,
    mobileMenuOpen,
    selectedCurrency,
    handleCurrencyChange,
  } = data;

  const isRow2Blocked = showProductsMenu || showUserMenu || showLocaleCurrencyMenu || searchDropdownOpen;
  const isRow2Hidden = useHeaderRow2AutoHide({
    isBlocked: isRow2Blocked,
  });

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

  const effectiveRow2Hidden = isRow2Blocked ? false : isRow2Hidden;
  const row2HiddenPx = effectiveRow2Hidden ? row2HeightPx : 0;
  const row2MaxHeightPx = Math.max(0, row2HeightPx - row2HiddenPx);
  const row2MaxHeightStyle = row2HeightPx > 0 ? `${row2MaxHeightPx}px` : undefined;
  const row2TranslateY = `-${row2HiddenPx}px`;

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
          className={`${HEADER_MOBILE_HEADER_ROUND_CONTROL_CLASS} dark:!bg-white dark:ring-1 dark:ring-black/15`}
          aria-label={t('common.ariaLabels.openMenu')}
          aria-expanded={mobileMenuOpen}
        >
          <svg
            className="h-6 w-6 shrink-0 dark:!text-black dark:[&_path]:!stroke-black"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden
          >
            <path
              d="M5 8h14M5 12h14M5 16h14"
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth={2.25}
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
        className={`${
          isRow2Blocked ? 'overflow-visible' : 'overflow-hidden'
        } ${HEADER_ROW2_WRAPPER_CLASS}`}
        style={{
          maxHeight: row2MaxHeightStyle,
        }}
      >
        <div
          ref={row2ContentRef}
          className={HEADER_ROW2_CONTENT_CLASS}
          style={{ transform: `translateY(${row2TranslateY})` }}
        >
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
