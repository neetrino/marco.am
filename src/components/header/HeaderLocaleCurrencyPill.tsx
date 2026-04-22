'use client';

import { useState, useEffect, useRef } from 'react';
import { Banknote, Globe } from 'lucide-react';
import { CURRENCIES, type CurrencyCode } from '../../lib/currency';
import { LANGUAGES, type LanguageCode, getStoredLanguage, setStoredLanguage } from '../../lib/language';
import {
  HEADER_LOCALE_PILL_HEIGHT_CLASS,
  HEADER_LOCALE_PILL_INNER_GAP_CLASS,
  HEADER_LOCALE_PILL_MIN_WIDTH_CLASS,
  HEADER_LOCALE_PILL_PADDING_X_CLASS,
  HEADER_LOCALE_PILL_RADIUS_CLASS,
  HEADER_MOBILE_HEADER_ROUND_CONTROL_CLASS,
} from './header.constants';

const ChevronDownIcon = () => (
  <svg
    className="shrink-0 self-center"
    width="8"
    height="8"
    viewBox="0 0 12 12"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden
  >
    <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** Figma 111:4306 — 3-letter labels (ENG / AMD row) */
function getPillLanguageLabel(raw: LanguageCode): string {
  if (raw === 'ka') {
    return 'ENG';
  }
  if (raw === 'en') {
    return 'ENG';
  }
  if (raw === 'hy') {
    return 'HYE';
  }
  return 'RUS';
}

interface HeaderLocaleCurrencyPillProps {
  selectedCurrency: CurrencyCode;
  onCurrencyChange: (code: CurrencyCode) => void;
  /** Server-known language so the first HTML matches SSR + first client paint. Omit to use "en" then sync localStorage in useEffect. */
  initialLanguage?: LanguageCode;
  onMenuOpenChange?: (isOpen: boolean) => void;
}

function normalizeHeaderLang(code: LanguageCode | undefined): LanguageCode {
  if (!code || code === 'ka') {
    return 'en';
  }
  return code;
}

interface LocaleCurrencyMenuProps {
  currentLang: LanguageCode;
  selectedCurrency: CurrencyCode;
  onLanguageSelect: (code: LanguageCode) => void;
  onCurrencySelect: (code: CurrencyCode) => void;
}

function LocaleLanguageRows({
  currentLang,
  onLanguageSelect,
}: {
  currentLang: LanguageCode;
  onLanguageSelect: (code: LanguageCode) => void;
}) {
  return Object.values(LANGUAGES)
    .filter((lang) => lang.code !== 'ka')
    .map((lang) => {
      const isActive = currentLang === lang.code;
      return (
        <button
          key={lang.code}
          type="button"
          onClick={() => onLanguageSelect(lang.code)}
          disabled={isActive}
          className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
            isActive ? 'bg-gray-50 font-semibold text-gray-900' : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          {lang.nativeName}
        </button>
      );
    });
}

function LocaleCurrencyRows({
  selectedCurrency,
  onCurrencySelect,
}: {
  selectedCurrency: CurrencyCode;
  onCurrencySelect: (code: CurrencyCode) => void;
}) {
  return Object.values(CURRENCIES).map((currency) => {
    const isActive = selectedCurrency === currency.code;
    return (
      <button
        key={currency.code}
        type="button"
        onClick={() => onCurrencySelect(currency.code)}
        className={`flex w-full items-center justify-between px-4 py-2.5 text-sm transition-colors ${
          isActive ? 'bg-gray-50 font-semibold text-gray-900' : 'text-gray-700 hover:bg-gray-50'
        }`}
      >
        <span>{currency.code}</span>
        <span className="text-gray-500">{currency.symbol}</span>
      </button>
    );
  });
}

function LocaleCurrencyMenu({
  currentLang,
  selectedCurrency,
  onLanguageSelect,
  onCurrencySelect,
}: LocaleCurrencyMenuProps) {
  return (
    <div className="absolute right-0 top-full z-[70] mt-2 w-64 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
      <p className="border-b border-gray-100 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
        Language
      </p>
      <LocaleLanguageRows currentLang={currentLang} onLanguageSelect={onLanguageSelect} />
      <p className="border-b border-t border-gray-100 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
        Currency
      </p>
      <LocaleCurrencyRows selectedCurrency={selectedCurrency} onCurrencySelect={onCurrencySelect} />
    </div>
  );
}

function useLocalePillSyncAndDismiss(
  menuRef: React.RefObject<HTMLDivElement | null>,
  setShowMenu: React.Dispatch<React.SetStateAction<boolean>>,
  setCurrentLang: React.Dispatch<React.SetStateAction<LanguageCode>>,
): void {
  useEffect(() => {
    const handleLanguageUpdate = () => {
      const next = getStoredLanguage();
      setCurrentLang(next === 'ka' ? 'en' : next);
    };
    window.addEventListener('language-updated', handleLanguageUpdate);
    return () => window.removeEventListener('language-updated', handleLanguageUpdate);
  }, [setCurrentLang]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuRef, setShowMenu]);
}

function useLocaleCurrencyPillState(
  onCurrencyChange: (code: CurrencyCode) => void,
  initialLanguage: LanguageCode | undefined,
): {
  showMenu: boolean;
  setShowMenu: React.Dispatch<React.SetStateAction<boolean>>;
  currentLang: LanguageCode;
  menuRef: React.RefObject<HTMLDivElement | null>;
  changeLanguage: (langCode: LanguageCode) => void;
  handleCurrencySelect: (code: CurrencyCode) => void;
} {
  const [showMenu, setShowMenu] = useState(false);
  const [currentLang, setCurrentLang] = useState<LanguageCode>(() =>
    normalizeHeaderLang(initialLanguage ?? 'en'),
  );
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialLanguage !== undefined) {
      return;
    }
    const stored = getStoredLanguage();
    setCurrentLang(normalizeHeaderLang(stored));
  }, [initialLanguage]);

  useLocalePillSyncAndDismiss(menuRef, setShowMenu, setCurrentLang);

  const changeLanguage = (langCode: LanguageCode) => {
    if (currentLang === langCode && langCode !== 'ka') {
      setShowMenu(false);
      return;
    }
    const nextLang = langCode === 'ka' ? 'en' : langCode;
    setCurrentLang(nextLang);
    setShowMenu(false);
    setStoredLanguage(langCode);
  };

  const handleCurrencySelect = (code: CurrencyCode) => {
    onCurrencyChange(code);
    setShowMenu(false);
  };

  return {
    showMenu,
    setShowMenu,
    currentLang,
    menuRef,
    changeLanguage,
    handleCurrencySelect,
  };
}

/**
 * Compact language + currency control — MARCO header pill (Figma 111:4306).
 */
export function HeaderLocaleCurrencyPill({
  selectedCurrency,
  onCurrencyChange,
  initialLanguage,
  onMenuOpenChange,
}: HeaderLocaleCurrencyPillProps) {
  const { showMenu, setShowMenu, currentLang, menuRef, changeLanguage, handleCurrencySelect } =
    useLocaleCurrencyPillState(onCurrencyChange, initialLanguage);

  useEffect(() => {
    onMenuOpenChange?.(showMenu);
    return () => {
      onMenuOpenChange?.(false);
    };
  }, [onMenuOpenChange, showMenu]);

  return (
    <div className="relative" ref={menuRef as React.RefObject<HTMLDivElement>}>
      <button
        type="button"
        onClick={() => setShowMenu((open) => !open)}
        aria-expanded={showMenu}
        className={`flex shrink-0 items-center justify-center overflow-hidden bg-marco-gray text-xs font-bold leading-none text-marco-text ${HEADER_LOCALE_PILL_MIN_WIDTH_CLASS} ${HEADER_LOCALE_PILL_PADDING_X_CLASS} ${HEADER_LOCALE_PILL_INNER_GAP_CLASS} ${HEADER_LOCALE_PILL_HEIGHT_CLASS} ${HEADER_LOCALE_PILL_RADIUS_CLASS}`}
      >
        <Globe className="h-4 w-4 shrink-0 self-center" strokeWidth={1.75} aria-hidden />
        <span className="inline-flex items-center whitespace-nowrap">
          {getPillLanguageLabel(currentLang)} <span className="font-bold">/</span>
        </span>
        <Banknote className="h-4 w-4 shrink-0 self-center" strokeWidth={1.75} aria-hidden />
        <span className="inline-flex items-center whitespace-nowrap">{selectedCurrency}</span>
        <ChevronDownIcon />
      </button>
      {showMenu && (
        <LocaleCurrencyMenu
          currentLang={currentLang}
          selectedCurrency={selectedCurrency}
          onLanguageSelect={changeLanguage}
          onCurrencySelect={handleCurrencySelect}
        />
      )}
    </div>
  );
}

interface MobileHeaderLocaleCurrencyButtonProps {
  selectedCurrency: CurrencyCode;
  onCurrencyChange: (code: CurrencyCode) => void;
  initialLanguage?: LanguageCode;
  ariaLabel: string;
  onMenuOpenChange?: (isOpen: boolean) => void;
}

/**
 * Mobile header control (dark pill) — same locale + currency menu as desktop {@link HeaderLocaleCurrencyPill}.
 */
export function MobileHeaderLocaleCurrencyButton({
  selectedCurrency,
  onCurrencyChange,
  initialLanguage,
  ariaLabel,
  onMenuOpenChange,
}: MobileHeaderLocaleCurrencyButtonProps) {
  const { showMenu, setShowMenu, currentLang, menuRef, changeLanguage, handleCurrencySelect } =
    useLocaleCurrencyPillState(onCurrencyChange, initialLanguage);

  useEffect(() => {
    onMenuOpenChange?.(showMenu);
    return () => {
      onMenuOpenChange?.(false);
    };
  }, [onMenuOpenChange, showMenu]);

  return (
    <div className="relative shrink-0" ref={menuRef as React.RefObject<HTMLDivElement>}>
      <button
        type="button"
        onClick={() => setShowMenu((open) => !open)}
        aria-expanded={showMenu}
        aria-label={ariaLabel}
        className={HEADER_MOBILE_HEADER_ROUND_CONTROL_CLASS}
      >
        <Globe className="h-6 w-6 shrink-0" strokeWidth={1.75} aria-hidden />
      </button>
      {showMenu && (
        <LocaleCurrencyMenu
          currentLang={currentLang}
          selectedCurrency={selectedCurrency}
          onLanguageSelect={changeLanguage}
          onCurrencySelect={handleCurrencySelect}
        />
      )}
    </div>
  );
}
