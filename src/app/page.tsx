import { cookies } from 'next/headers';
import { HeroCarousel } from '../components/HeroCarousel';
import { HomeMobileMessageCta } from '../components/home/HomeMobileMessageCta';
import { HomeReelsSection } from '../components/home/HomeReelsSection';

import { FeaturedProductsTabs } from '../components/FeaturedProductsTabs';
import { HomeSpecialOffersSection } from '../components/home/HomeSpecialOffersSection';
import { LANGUAGE_PREFERENCE_KEY, parseLanguageFromServer } from '../lib/language';
import { reelsManagementService } from '../lib/services/reels-management.service';

export default async function HomePage() {
  const cookieStore = await cookies();
  const lang =
    parseLanguageFromServer(cookieStore.get(LANGUAGE_PREFERENCE_KEY)?.value) ??
    'en';
  const reelsFeed = await reelsManagementService.getPublicPayload({
    localeRaw: lang,
  });

  return (
    <div className="min-h-screen">
      <HeroCarousel />

      <div className="mt-4 sm:mt-6 md:mt-8">
        <HomeReelsSection items={reelsFeed.items} />
      </div>

      <HomeMobileMessageCta />

      <HomeSpecialOffersSection />

      {/* Featured Products with Tabs + two home banners (gradient + secondary) */}
      <FeaturedProductsTabs />
    </div>
  );
}

