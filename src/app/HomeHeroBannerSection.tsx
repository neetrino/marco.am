import { HeroCarousel } from '../components/HeroCarousel';
import { buildHeroCarouselImageUrls } from '../lib/home-hero-carousel-urls';
import { collectImageOrigins } from '../lib/utils/collect-image-origins';
import { DEFAULT_STOREFRONT_LANGUAGE } from '../lib/language';
import { bannerManagementService } from '../lib/services/banner-management.service';

/**
 * Hero only — streams independently so reels + DB work cannot delay the main banner paint.
 * Rendered in the default language (hero images are locale-independent), so the page stays static/ISR.
 */
export async function HomeHeroBannerSection() {
  const heroSlots = await bannerManagementService.getPublicHomeHeroSlotsPayload({
    localeRaw: DEFAULT_STOREFRONT_LANGUAGE,
  });
  const heroImageUrls = buildHeroCarouselImageUrls(heroSlots.primary, heroSlots.secondary);
  const preconnectOrigins = collectImageOrigins(Object.values(heroImageUrls));

  return (
    <>
      {preconnectOrigins.map((origin) => (
        <link key={origin} rel="preconnect" href={origin} crossOrigin="anonymous" />
      ))}
      <HeroCarousel heroImageUrls={heroImageUrls} />
    </>
  );
}
