import { cookies } from 'next/headers';
import { HomeReelsSection } from '../components/home/HomeReelsSection';
import {
  LANGUAGE_PREFERENCE_KEY,
  parseLanguageFromServer,
} from '../lib/language';
import { reelsManagementService } from '../lib/services/reels-management.service';

/**
 * Reels rail below hero — separate Suspense chunk so it never blocks hero images.
 */
export async function HomeReelsBelowHero() {
  const cookieStore = await cookies();
  const lang =
    parseLanguageFromServer(cookieStore.get(LANGUAGE_PREFERENCE_KEY)?.value) ?? 'en';

  const reelsFeed = await reelsManagementService.getPublicPayload({ localeRaw: lang });

  return (
    <div className="mt-4 sm:mt-6 md:mt-8">
      <HomeReelsSection items={reelsFeed.items} />
    </div>
  );
}
