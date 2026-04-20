'use client';

import { Suspense } from 'react';
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

export function Header({ initialLanguage }: HeaderProps) {
  const data = useHeaderData();
  const layout = useHeaderLayoutMetrics();
  const { t } = useTranslation();

  const { compactPrimaryNav, viewportWidth, desktopTopRowInnerRef, desktopTopRowMeasureRef } = layout;

  const {
    setSearchQuery,
    setSelectedCategory,
    categories,
    setMobileMenuOpen,
    mobileMenuOpen,
    selectedCurrency,
    handleCurrencyChange,
  } = data;

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
        />
      </div>

      <HeaderRow2
        data={data}
        layout={layout}
        compactPrimaryNav={compactPrimaryNav}
        initialLanguage={initialLanguage}
      />

      <HeaderMobileDrawer data={data} compactPrimaryNav={compactPrimaryNav} />
    </header>
  );
}
