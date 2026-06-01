'use client';

import { useTranslation } from '@/lib/i18n-client';

import { BrandsPageContent } from './BrandsPageContent';

/**
 * Brands landing — client shell paints immediately; grid hydrates from React Query (prefetched on idle).
 */
export default function BrandsPage() {
  const { t } = useTranslation();

  return (
    <div className="w-full pb-16 pt-10">
      <div className="marco-header-container">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#383838] dark:text-white md:text-4xl">
            {t('common.navigation.brands')}
          </h1>
        </div>
        <BrandsPageContent />
      </div>
    </div>
  );
}
