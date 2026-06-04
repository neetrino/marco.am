'use client';

import { useTranslation } from '../../lib/i18n-client';

interface CarouselNavigationProps {
  onPrevious: () => void;
  onNext: () => void;
}

/**
 * Navigation arrows for carousel
 */
export function CarouselNavigation({ onPrevious, onNext }: CarouselNavigationProps) {
  const { t } = useTranslation();

  return (
    <>
      <button
        onClick={onPrevious}
        className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-12 bg-white/90 hover:bg-white text-gray-900 p-2 rounded-full shadow-lg transition-all z-20 cursor-pointer hover:scale-110"
        aria-label={t('common.ariaLabels.previousProducts')}
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>

      <button
        onClick={onNext}
        className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-12 bg-white/90 hover:bg-white text-gray-900 p-2 rounded-full shadow-lg transition-all z-20 cursor-pointer hover:scale-110"
        aria-label={t('common.ariaLabels.nextProducts')}
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>
    </>
  );
}




