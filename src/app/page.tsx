import { Suspense } from 'react';
import { HomeRoutePrefetch } from '@/components/home/HomeRoutePrefetch';
import { HomeFeaturedSection } from './home/HomeFeaturedSection';
import { HomeSpecialOffersBoundary } from './home/HomeSpecialOffersBoundary';
import { HomeHeroBannerSection } from './HomeHeroBannerSection';
import { HomeHeroReelsFallback } from './HomeHeroReelsFallback';
import { HomeReelsBelowHero } from './HomeReelsBelowHero';

/**
 * Shell renders immediately; hero streams alone first; reels follow without blocking the banner.
 */
export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Suspense fallback={<HomeHeroReelsFallback />}>
        <HomeHeroBannerSection />
      </Suspense>

      <Suspense fallback={null}>
        <HomeReelsBelowHero />
      </Suspense>

      <Suspense fallback={null}>
        <HomeSpecialOffersBoundary />
      </Suspense>

      <Suspense fallback={null}>
        <HomeFeaturedSection />
      </Suspense>

      <HomeRoutePrefetch />
    </div>
  );
}
