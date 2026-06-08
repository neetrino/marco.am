import { Suspense } from 'react';
import { HomePageLayoutShell } from '@/components/home/HomePageLayoutShell';
import { HomeRoutePrefetch } from '@/components/home/HomeRoutePrefetch';
import { HomeProductRailsBoundary } from './home/HomeProductRailsBoundary';
import { HomeProductRailsPrefetch } from './home/HomeProductRailsPrefetch';
import { HomeHeroBannerSection } from './HomeHeroBannerSection';
import { HomeHeroBannerFallback, HomeReelsRailFallback } from './HomeHeroReelsFallback';
import { HomeReelsBelowHero } from './HomeReelsBelowHero';

/**
 * Shell renders immediately; hero streams first, then REELS, then product rails (Figma `1:2665`).
 */
export default function HomePage() {
  return (
    <HomePageLayoutShell>
      <Suspense fallback={<HomeHeroBannerFallback />}>
        <HomeHeroBannerSection />
      </Suspense>

      <Suspense fallback={<HomeReelsRailFallback />}>
        <HomeReelsBelowHero />
      </Suspense>

      <Suspense fallback={null}>
        <HomeProductRailsPrefetch />
      </Suspense>
      <Suspense fallback={null}>
        <HomeProductRailsBoundary />
      </Suspense>

      <HomeRoutePrefetch />
    </HomePageLayoutShell>
  );
}
