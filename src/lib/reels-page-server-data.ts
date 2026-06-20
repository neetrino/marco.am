import { cache } from 'react';

import { t } from '@/lib/i18n';
import type { LanguageCode } from '@/lib/language';
import { getServerLanguage } from '@/lib/language-server';
import type { ReelsPublicPayload } from '@/lib/schemas/reels-management.schema';
import { reelsManagementService } from '@/lib/services/reels-management.service';

type ReelsPageServerData = {
  language: LanguageCode;
  feed: ReelsPublicPayload;
  watchCtaLabel: string;
  emptyMessage: string;
};

/** Deduped `/reels` server payload — Redis read-through via `reelsManagementService`. */
export const getReelsPageDataCached = cache(async (): Promise<ReelsPageServerData> => {
  const language = await getServerLanguage();
  const feed = await reelsManagementService.getPublicPayload({ localeRaw: language });
  return {
    language,
    feed,
    watchCtaLabel: t(language, 'home.reels_page.watch_cta'),
    emptyMessage: t(language, 'home.reels_page.empty'),
  };
});
