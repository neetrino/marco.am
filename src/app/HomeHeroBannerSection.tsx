import { cookies } from 'next/headers';
import { HeroCarousel } from '../components/HeroCarousel';
import { buildHeroCarouselImageUrls } from '../lib/home-hero-carousel-urls';
import {
  LANGUAGE_PREFERENCE_KEY,
  parseLanguageFromServer,
} from '../lib/language';
import { bannerManagementService } from '../lib/services/banner-management.service';

/**
 * Hero only — streams independently so reels + DB work cannot delay the main banner paint.
 */
export async function HomeHeroBannerSection() {
  const cookieStore = await cookies();
  const lang =
    parseLanguageFromServer(cookieStore.get(LANGUAGE_PREFERENCE_KEY)?.value) ?? 'en';

  const heroSlots = await bannerManagementService.getPublicHomeHeroSlotsPayload({
    localeRaw: lang,
  });
  const heroImageUrls = buildHeroCarouselImageUrls(heroSlots.primary, heroSlots.secondary);

  return <HeroCarousel heroImageUrls={heroImageUrls} />;
}
