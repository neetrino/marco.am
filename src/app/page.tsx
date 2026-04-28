import dynamic from 'next/dynamic';
import { cookies } from 'next/headers';
import { HeroCarousel } from '../components/HeroCarousel';
import { HomeReelsSection } from '../components/home/HomeReelsSection';

import { LANGUAGE_PREFERENCE_KEY, parseLanguageFromServer } from '../lib/language';
import { buildHeroCarouselImageUrls } from '../lib/home-hero-carousel-urls';
import { bannerManagementService } from '../lib/services/banner-management.service';
import { reelsManagementService } from '../lib/services/reels-management.service';

const FeaturedProductsTabs = dynamic(
  () =>
    import('../components/FeaturedProductsTabs').then((m) => ({
      default: m.FeaturedProductsTabs,
    })),
  { ssr: true, loading: () => <div className="min-h-[280px] w-full" aria-hidden /> },
);

const HomeSpecialOffersSection = dynamic(
  () =>
    import('../components/home/HomeSpecialOffersSection').then((m) => ({
      default: m.HomeSpecialOffersSection,
    })),
  { ssr: true, loading: () => <div className="min-h-[240px] w-full" aria-hidden /> },
);

export default async function HomePage() {
  const cookieStore = await cookies();
  const lang =
    parseLanguageFromServer(cookieStore.get(LANGUAGE_PREFERENCE_KEY)?.value) ??
    'en';

  const [reelsFeed, primaryBanners, secondaryBanners] = await Promise.all([
    reelsManagementService.getPublicPayload({ localeRaw: lang }),
    bannerManagementService.getPublicSlotPayload({
      slot: 'home.hero.primary',
      localeRaw: lang,
    }),
    bannerManagementService.getPublicSlotPayload({
      slot: 'home.hero.secondary',
      localeRaw: lang,
    }),
  ]);

  const heroImageUrls = buildHeroCarouselImageUrls(primaryBanners, secondaryBanners);

  return (
    <div className="min-h-screen">
      <HeroCarousel heroImageUrls={heroImageUrls} />

      <div className="mt-4 sm:mt-6 md:mt-8">
        <HomeReelsSection items={reelsFeed.items} />
      </div>

      <HomeSpecialOffersSection />

      {/* Featured Products with Tabs + two home banners (gradient + secondary) */}
      <FeaturedProductsTabs />
    </div>
  );
}

