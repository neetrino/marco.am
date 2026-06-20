import { HomeReelsSection } from '../components/home/HomeReelsSection';
import { DEFAULT_STOREFRONT_LANGUAGE } from '../lib/language';
import { reelsManagementService } from '../lib/services/reels-management.service';

/**
 * Reels rail below hero — separate Suspense chunk so it never blocks hero images.
 * Rendered in the default language to keep the home route static/ISR.
 */
export async function HomeReelsBelowHero() {
  const reelsFeed = await reelsManagementService.getPublicPayload({
    localeRaw: DEFAULT_STOREFRONT_LANGUAGE,
  });

  return (
    <div className="mt-4 sm:mt-6 md:mt-8">
      <HomeReelsSection items={reelsFeed.items} />
    </div>
  );
}
