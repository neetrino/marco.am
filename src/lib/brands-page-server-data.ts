import { cache } from 'react';
import { cookies } from 'next/headers';
import {
  LANGUAGE_PREFERENCE_KEY,
  parseLanguageFromServer,
  type LanguageCode,
} from '@/lib/language';
import { homeBrandPartnersService } from '@/lib/services/home-brand-partners.service';
import type { HomeBrandPartnersPublicPayload } from '@/lib/types/home-brand-partners-public';

export type BrandsPageServerData = {
  language: LanguageCode;
  payload: HomeBrandPartnersPublicPayload;
};

/** Deduped `/brands` server payload — Redis read-through via `homeBrandPartnersService`. */
export const getBrandsPageDataCached = cache(async (): Promise<BrandsPageServerData> => {
  const cookieStore = await cookies();
  const language: LanguageCode =
    parseLanguageFromServer(cookieStore.get(LANGUAGE_PREFERENCE_KEY)?.value) ?? 'en';
  const payload = await homeBrandPartnersService.getPublicPayload(language);
  return { language, payload };
});
