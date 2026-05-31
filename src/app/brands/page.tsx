import { Suspense } from 'react';
import { cookies } from 'next/headers';

import { StaticPageLoadingSkeleton } from '@/components/navigation/StaticPageLoadingSkeleton';
import { t } from '@/lib/i18n';
import {
  LANGUAGE_PREFERENCE_KEY,
  parseLanguageFromServer,
  type LanguageCode,
} from '@/lib/language';
import { BrandsPageContent } from './BrandsPageContent';

/**
 * Brands landing — title paints immediately; grid streams after DB fetch.
 */
export default async function BrandsPage() {
  const cookieStore = await cookies();
  const language: LanguageCode =
    parseLanguageFromServer(cookieStore.get(LANGUAGE_PREFERENCE_KEY)?.value) ?? 'en';

  return (
    <div className="w-full pb-16 pt-10">
      <div className="marco-header-container">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#383838] dark:text-white md:text-4xl">
            {t(language, 'common.navigation.brands')}
          </h1>
        </div>
        <Suspense fallback={<StaticPageLoadingSkeleton variant="grid-body" />}>
          <BrandsPageContent />
        </Suspense>
      </div>
    </div>
  );
}
