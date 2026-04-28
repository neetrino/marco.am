import { cookies } from 'next/headers';
import { HeroCarousel } from '../components/HeroCarousel';
import { HomeReelsSection } from '../components/home/HomeReelsSection';
import { LANGUAGE_PREFERENCE_KEY, parseLanguageFromServer } from '../lib/language';
import { buildHeroCarouselImageUrls } from '../lib/home-hero-carousel-urls';
import { bannerManagementService } from '../lib/services/banner-management.service';
import { reelsManagementService } from '../lib/services/reels-management.service';

export async function HomeHeroReelsSection() {
  const cookieStore = await cookies();
  const lang =
    parseLanguageFromServer(cookieStore.get(LANGUAGE_PREFERENCE_KEY)?.value) ?? 'en';

  const [reelsFeed, heroSlots] = await Promise.all([
    reelsManagementService.getPublicPayload({ localeRaw: lang }),
    bannerManagementService.getPublicHomeHeroSlotsPayload({ localeRaw: lang }),
  ]);

  const heroImageUrls = buildHeroCarouselImageUrls(heroSlots.primary, heroSlots.secondary);

  return (
    <>
      <HeroCarousel heroImageUrls={heroImageUrls} />

      <div className="mt-4 sm:mt-6 md:mt-8">
        <HomeReelsSection items={reelsFeed.items} />
      </div>
    </>
  );
}
