'use client';

import { useState, useEffect, useRef } from 'react';
import { Globe, Banknote } from 'lucide-react';
import {
  LANGUAGES,
  type LanguageCode,
  getStoredLanguage,
  setStoredLanguage,
} from '../lib/language';
import type { CurrencyCode } from '../lib/currency';
import { CURRENCIES } from '../lib/currency';
import { getLanguageColor } from './LanguageSwitcherHeader';

/** Uppercase labels on the pill trigger (matches Figma-style locale display). */
const LANGUAGE_PILL_LABEL: Record<Exclude<LanguageCode, 'ka'>, string> = {
  en: 'ENG',
  hy: 'HY',
  ru: 'RU',
};

const ChevronDownIcon = () => (
  <svg width="10" height="10" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function toHeaderLanguage(stored: LanguageCode): Exclude<LanguageCode, 'ka'> {
  return stored === 'ka' ? 'en' : stored;
}

function pillLabelForLang(stored: LanguageCode): string {
  return LANGUAGE_PILL_LABEL[toHeaderLanguage(stored)];
}

export interface LocaleCurrencyPillProps {
  selectedCurrency: CurrencyCode;
  onCurrencyChange: (currency: CurrencyCode) => void;
  /** When true, closes the dropdown (e.g. search modal or mobile drawer open). */
  menuSuppressed?: boolean;
  variant?: 'desktop' | 'mobile';
}

/**
 * Single pill: globe + language code + "/" + banknote + currency + chevron; one menu for language and currency.
 */
export function LocaleCurrencyPill({
  selectedCurrency,
  onCurrencyChange,
  menuSuppressed = false,
  variant = 'desktop',
}: LocaleCurrencyPillProps) {
  const [showMenu, setShowMenu] = useState(false);
  /** Must match SSR (`getStoredLanguage()` on server is always `'en'`). Sync from storage after mount in `useEffect`. */
  const [currentLang, setCurrentLang] = useState<Exclude<LanguageCode, 'ka'>>(() =>
    toHeaderLanguage('en'),
  );
  const menuRef = useRef<HTMLDivElement>(null);

  const isMobile = variant === 'mobile';

  useEffect(() => {
    const handleLanguageUpdate = () => {
      setCurrentLang(toHeaderLanguage(getStoredLanguage()));
    };

    handleLanguageUpdate();
    window.addEventListener('language-updated', handleLanguageUpdate);
    return () => {
      window.removeEventListener('language-updated', handleLanguageUpdate);
    };
  }, []);

  useEffect(() => {
    if (menuSuppressed) {
      setShowMenu(false);
    }
  }, [menuSuppressed]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const changeLanguage = (langCode: LanguageCode) => {
    if (currentLang === langCode) {
      setShowMenu(false);
      return;
    }
    setCurrentLang(toHeaderLanguage(langCode));
    setShowMenu(false);
    setStoredLanguage(langCode);
  };

  const handleCurrencySelect = (code: CurrencyCode) => {
    onCurrencyChange(code);
    setShowMenu(false);
  };

  const triggerClass = isMobile
    ? 'flex h-9 sm:h-10 min-h-9 sm:min-h-10 items-center gap-1.5 sm:gap-2 rounded-full bg-[#f4f4f4] px-2.5 sm:px-3 text-[#333]'
    : 'flex h-12 min-h-12 items-center gap-2 rounded-full bg-[#f4f4f4] px-4 text-[#333]';

  const iconClass = isMobile ? 'h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0' : 'h-[18px] w-[18px] shrink-0';
  const textClass = isMobile
    ? 'text-xs sm:text-sm font-bold leading-none'
    : 'text-[16px] font-bold leading-none';

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setShowMenu(!showMenu)}
        aria-expanded={showMenu}
        aria-haspopup="true"
        className={triggerClass}
      >
        <Globe className={iconClass} strokeWidth={2} aria-hidden />
        <span className={textClass}>{pillLabelForLang(currentLang)}</span>
        <span className={`font-bold text-[#333] ${isMobile ? 'text-xs sm:text-sm' : 'text-[16px]'}`} aria-hidden>
          /
        </span>
        <Banknote className={iconClass} strokeWidth={2} aria-hidden />
        <span className={textClass}>{selectedCurrency}</span>
        <ChevronDownIcon />
      </button>

      {showMenu && (
        <div
          data-theme-static="true"
          className="absolute right-0 top-full z-50 mt-2 max-h-[min(70vh,420px)] w-56 overflow-y-auto rounded-xl border border-gray-200/80 bg-white shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <div className="py-1">
            {Object.values(LANGUAGES)
              .filter((lang) => lang.code !== 'ka')
              .map((lang) => {
                const isActive = toHeaderLanguage(currentLang) === lang.code;
                const colorClass = getLanguageColor(lang.code, isActive);
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => changeLanguage(lang.code)}
                    disabled={isActive}
                    className={`w-full border-l-4 px-3 py-2.5 text-left text-sm transition-all duration-150 ${
                      isActive
                        ? `${colorClass} cursor-default font-semibold text-gray-900`
                        : 'border-transparent text-gray-700 hover:border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex min-w-0 items-center justify-between gap-2">
                      <span className={isActive ? 'font-semibold' : 'font-medium'}>{lang.nativeName}</span>
                      <span
                        className={`shrink-0 text-xs ${isActive ? 'font-semibold text-gray-700' : 'text-gray-500'}`}
                      >
                        {LANGUAGE_PILL_LABEL[lang.code as Exclude<LanguageCode, 'ka'>]}
                      </span>
                    </div>
                  </button>
                );
              })}
          </div>
          <div className="border-t border-gray-100" role="separator" />
          <div className="py-1">
            {Object.values(CURRENCIES).map((currency) => (
              <button
                key={currency.code}
                type="button"
                onClick={() => handleCurrencySelect(currency.code)}
                className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition-all duration-150 ${
                  selectedCurrency === currency.code
                    ? 'bg-gradient-to-r from-gray-100 to-gray-50 font-semibold text-gray-900'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span>{currency.code}</span>
                <span className="text-gray-500">{currency.symbol}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
