import { BrandsPageContent } from './BrandsPageContent';
import { getBrandsPageDataCached } from '@/lib/brands-page-server-data';
import { t } from '@/lib/i18n';

/**
 * Brands directory — server payload streams with the route so the grid paints
 * without a client-only fetch round-trip.
 */
export default async function BrandsPage() {
  const { language, payload } = await getBrandsPageDataCached();

  return (
    <div className="w-full pb-16 pt-10">
      <div className="marco-header-container">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#383838] dark:text-white md:text-4xl">
            {t(language, 'common.navigation.brands')}
          </h1>
        </div>
        <BrandsPageContent initialPayload={payload} serverLanguage={language} />
      </div>
    </div>
  );
}
