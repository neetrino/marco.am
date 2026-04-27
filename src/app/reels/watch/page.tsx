import type { Metadata } from 'next';
import { cookies } from 'next/headers';

import { ReelsVerticalFeed } from '../../../components/reels/ReelsVerticalFeed';
import { t } from '../../../lib/i18n';
import { LANGUAGE_PREFERENCE_KEY, parseLanguageFromServer } from '../../../lib/language';
import { parseReelsIndexParam } from '../../../lib/reels/reels-url';
import { reelsManagementService } from '../../../lib/services/reels-management.service';

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const locale =
    parseLanguageFromServer(cookieStore.get(LANGUAGE_PREFERENCE_KEY)?.value) ?? 'en';
  return {
    title: t(locale, 'home.reels_watch_page.meta_title'),
    description: t(locale, 'home.reels_watch_page.meta_description'),
  };
}

export default async function ReelsWatchPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const cookieStore = await cookies();
  const locale =
    parseLanguageFromServer(cookieStore.get(LANGUAGE_PREFERENCE_KEY)?.value) ?? 'en';
  const feed = await reelsManagementService.getPublicPayload({
    localeRaw: locale,
  });

  const sp = searchParams ? await searchParams : {};
  const rawI = sp.i;
  const raw =
    typeof rawI === 'string'
      ? rawI
      : Array.isArray(rawI)
        ? rawI[0]
        : undefined;
  const initialIndex = parseReelsIndexParam(raw, feed.items.length);
  const orderedItems =
    initialIndex <= 0
      ? feed.items
      : [
          feed.items[initialIndex],
          ...feed.items.filter((_, index) => index !== initialIndex),
        ];

  return <ReelsVerticalFeed initialIndex={0} items={orderedItems} />;
}
