import { Suspense } from 'react';
import { HomePageLayoutShell } from '@/components/home/HomePageLayoutShell';
import { HomeRoutePrefetch } from '@/components/home/HomeRoutePrefetch';
import { HomeFeaturedSection } from './home/HomeFeaturedSection';
import { HomeProductRailsSkeleton } from './home/HomeProductRailsSkeleton';
import { HomeSpecialOffersBoundary } from './home/HomeSpecialOffersBoundary';
import { HomeHeroBannerSection } from './HomeHeroBannerSection';
import { HomeHeroReelsFallback } from './HomeHeroReelsFallback';
import { HomeReelsBelowHero } from './HomeReelsBelowHero';

/**
 * Shell renders immediately; hero streams alone first; reels follow without blocking the banner.
 */
export default function HomePage() {
  return (
    <HomePageLayoutShell>
      <Suspense fallback={<HomeHeroReelsFallback />}>
        <HomeHeroBannerSection />
      </Suspense>

      <Suspense fallback={null}>
        <HomeReelsBelowHero />
      </Suspense>

      <Suspense fallback={<HomeProductRailsSkeleton />}>
        <HomeSpecialOffersBoundary />
      </Suspense>

      <Suspense fallback={<HomeProductRailsSkeleton />}>
        <HomeFeaturedSection />
      </Suspense>

      <HomeRoutePrefetch />
    </HomePageLayoutShell>
  );
}
