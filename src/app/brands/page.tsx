import { cookies } from 'next/headers';

import { t } from '@/lib/i18n';
import {
  LANGUAGE_PREFERENCE_KEY,
  parseLanguageFromServer,
  type LanguageCode,
} from '@/lib/language';
import { homeBrandPartnersService } from '@/lib/services/home-brand-partners.service';
import { BrandsPageContent } from './BrandsPageContent';

/**
 * Brands landing — one SSR payload (title + grid) so navigation does not flash a second skeleton.
 */
export default async function BrandsPage() {
  const cookieStore = await cookies();
  const language: LanguageCode =
    parseLanguageFromServer(cookieStore.get(LANGUAGE_PREFERENCE_KEY)?.value) ?? 'en';

  const { brands } = await homeBrandPartnersService.getPublicPayload(language);

  return (
    <div className="w-full pb-16 pt-10">
      <div className="marco-header-container">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#383838] dark:text-white md:text-4xl">
            {t(language, 'common.navigation.brands')}
          </h1>
        </div>
        <BrandsPageContent brands={brands} language={language} />
      </div>
    </div>
  );
}
