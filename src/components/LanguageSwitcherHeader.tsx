'use client';

import { useState, useEffect, useRef, useContext } from 'react';
import Image from 'next/image';
import { LANGUAGES, type LanguageCode, setStoredLanguage } from '../lib/language';
import { LanguagePreferenceContext } from '../lib/language-context';
import { logger } from '@/lib/utils/logger';

const ChevronDownIcon = () => (
  <svg width="10" height="10" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const getLanguageIcon = (code: LanguageCode): React.ReactNode => {
  const icons: Record<LanguageCode, React.ReactNode> = {
    en: (
      <Image
        src="/assets/flags/lang-en.webp"
        alt="English"
        width={25}
        height={25}
        className="rounded"
        unoptimized
      />
    ),
    hy: (
      <Image
        src="/assets/flags/lang-hy.webp"
        alt="Armenian"
        width={25}
        height={25}
        className="rounded"
        unoptimized
      />
    ),
    ru: (
      <Image
        src="/assets/flags/lang-ru.webp"
        alt="Russian"
        width={25}
        height={25}
        className="rounded"
        unoptimized
      />
    ),
    ka: '🌐',
  };
  return icons[code] || '🌐';
};

export function getLanguageColor(code: LanguageCode, isActive: boolean): string {
  if (isActive) {
    const colors: Record<LanguageCode, string> = {
      en: 'bg-blue-50 border-blue-200',
      hy: 'bg-orange-50 border-orange-200',
      ru: 'bg-red-50 border-red-200',
      ka: 'bg-gray-100 border-gray-200',
    };
    return colors[code] || 'bg-gray-100 border-gray-200';
  }
  return 'bg-white border-transparent';
}

/**
 * Language switcher — updates locale via storage + context (no full page reload).
 */
export function LanguageSwitcherHeader() {
  const currentLang = useContext(LanguagePreferenceContext);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const displayLang: LanguageCode = currentLang === 'ka' ? 'en' : currentLang;

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
    if (typeof window !== 'undefined' && displayLang !== langCode) {
      logger.devInfo('[LanguageSwitcher] Changing language', {
        from: displayLang,
        to: langCode,
      });
      setShowMenu(false);
      setStoredLanguage(langCode);
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setShowMenu(!showMenu)}
        aria-expanded={showMenu}
        className="flex items-center gap-1 sm:gap-2 bg-transparent md:bg-white px-2 sm:px-3 py-1.5 sm:py-2 text-gray-800 transition-colors"
      >
        <span className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center text-base sm:text-lg leading-none">
          {getLanguageIcon(displayLang)}
        </span>
        <span className="text-xs sm:text-sm font-medium">{LANGUAGES[displayLang].name}</span>
        <ChevronDownIcon />
      </button>
      {showMenu && (
        <div
          data-theme-static="true"
          className="absolute top-full right-0 mt-2 w-48 bg-white shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
        >
          {Object.values(LANGUAGES)
            .filter((lang) => lang.code !== 'ka')
            .map((lang) => {
            const isActive = displayLang === lang.code;
            const icon = getLanguageIcon(lang.code);
            const colorClass = getLanguageColor(lang.code, isActive);

            return (
              <button
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
                disabled={isActive}
                className={`w-full text-left px-4 py-3 text-sm transition-all duration-150 border-l-4 ${
                  isActive
                    ? `${colorClass} text-gray-900 font-semibold cursor-default`
                    : 'text-gray-700 hover:bg-gray-50 cursor-pointer border-transparent hover:border-gray-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl flex-shrink-0">{icon}</span>
                  <div className="flex-1 flex items-center justify-between">
                    <span className={isActive ? 'font-semibold' : 'font-medium'}>
                      {lang.nativeName}
                    </span>
                    <span className={`text-xs ml-2 ${isActive ? 'text-gray-700 font-semibold' : 'text-gray-500'}`}>
                      {lang.code.toUpperCase()}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
