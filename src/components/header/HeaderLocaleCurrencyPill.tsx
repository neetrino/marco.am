'use client';

import { useState, useEffect, useRef } from 'react';
import { Banknote, Globe } from 'lucide-react';
import { CURRENCIES, type CurrencyCode } from '../../lib/currency';
import { LANGUAGES, type LanguageCode, getStoredLanguage, setStoredLanguage } from '../../lib/language';

const ChevronDownIcon = () => (
  <svg width="10" height="10" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function displayLangCode(raw: LanguageCode): string {
  if (raw === 'ka') return 'EN';
  return raw.toUpperCase();
}

interface HeaderLocaleCurrencyPillProps {
  selectedCurrency: CurrencyCode;
  onCurrencyChange: (code: CurrencyCode) => void;
}

/**
 * Compact language + currency control — MARCO header pill (Figma).
 */
function getInitialHeaderLang(): LanguageCode {
  if (typeof window === 'undefined') {
    return 'en';
  }
  const stored = getStoredLanguage();
  return stored === 'ka' ? 'en' : stored;
}

export function HeaderLocaleCurrencyPill({
  selectedCurrency,
  onCurrencyChange,
}: HeaderLocaleCurrencyPillProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [currentLang, setCurrentLang] = useState<LanguageCode>(getInitialHeaderLang);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleLanguageUpdate = () => {
      const next = getStoredLanguage();
      setCurrentLang(next === 'ka' ? 'en' : next);
    };
    window.addEventListener('language-updated', handleLanguageUpdate);
    return () => window.removeEventListener('language-updated', handleLanguageUpdate);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const changeLanguage = (langCode: LanguageCode) => {
    if (currentLang === langCode && langCode !== 'ka') {
      setShowMenu(false);
      return;
    }
    const displayLang = langCode === 'ka' ? 'en' : langCode;
    setCurrentLang(displayLang);
    setShowMenu(false);
    setStoredLanguage(langCode);
  };

  const handleCurrencySelect = (code: CurrencyCode) => {
    onCurrencyChange(code);
    setShowMenu(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setShowMenu(!showMenu)}
        aria-expanded={showMenu}
        className="flex h-12 min-w-0 items-center gap-2 rounded-full bg-marco-gray px-3 text-[15px] font-bold text-marco-text sm:gap-3 sm:px-4"
      >
        <Globe className="h-[18px] w-[18px] shrink-0 opacity-80" strokeWidth={1.75} aria-hidden />
        <span className="whitespace-nowrap">
          {displayLangCode(currentLang)} <span className="font-bold opacity-70">/</span>
        </span>
        <Banknote className="h-[18px] w-[18px] shrink-0 opacity-80" strokeWidth={1.75} aria-hidden />
        <span className="whitespace-nowrap">{selectedCurrency}</span>
        <ChevronDownIcon />
      </button>
      {showMenu && (
        <div className="absolute right-0 top-full z-[60] mt-2 w-64 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
          <p className="border-b border-gray-100 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Language
          </p>
          {Object.values(LANGUAGES)
            .filter((lang) => lang.code !== 'ka')
            .map((lang) => {
              const isActive = currentLang === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => changeLanguage(lang.code)}
                  disabled={isActive}
                  className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
                    isActive ? 'bg-gray-50 font-semibold text-gray-900' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {lang.nativeName}
                </button>
              );
            })}
          <p className="border-b border-t border-gray-100 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Currency
          </p>
          {Object.values(CURRENCIES).map((currency) => {
            const isActive = selectedCurrency === currency.code;
            return (
              <button
                key={currency.code}
                type="button"
                onClick={() => handleCurrencySelect(currency.code)}
                className={`flex w-full items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                  isActive ? 'bg-gray-50 font-semibold text-gray-900' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span>{currency.code}</span>
                <span className="text-gray-500">{currency.symbol}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
