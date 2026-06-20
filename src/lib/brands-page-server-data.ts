import { cache } from 'react';

import { t } from '@/lib/i18n';
import type { LanguageCode } from '@/lib/language';
import { getServerLanguage } from '@/lib/language-server';
import { homeBrandPartnersService } from '@/lib/services/home-brand-partners.service';
import type { HomeBrandPartnerPublicItem } from '@/lib/types/home-brand-partners-public';

type BrandsPageServerData = {
  language: LanguageCode;
  brands: HomeBrandPartnerPublicItem[];
  pageTitle: string;
  emptyMessage: string;
};

/** Deduped `/brands` server payload — Redis read-through via `homeBrandPartnersService`. */
export const getBrandsPageDataCached = cache(async (): Promise<BrandsPageServerData> => {
  const language = await getServerLanguage();
  const payload = await homeBrandPartnersService.getPublicPayload(language);

  return {
    language,
    brands: payload.brands,
    pageTitle: t(language, 'common.navigation.brands'),
    emptyMessage: t(language, 'common.brandsPage.empty'),
  };
});
