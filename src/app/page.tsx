import { Suspense } from 'react';
import { HomePageLayoutShell } from '@/components/home/HomePageLayoutShell';
import { HomeRoutePrefetch } from '@/components/home/HomeRoutePrefetch';
import { HomeProductRailsBoundary } from './home/HomeProductRailsBoundary';
import { HomeProductRailsSkeleton } from './home/HomeProductRailsSkeleton';
import { HomeHeroBannerSection } from './HomeHeroBannerSection';
import { HomeHeroReelsFallback } from './HomeHeroReelsFallback';
import { HomeReelsBelowHero } from './HomeReelsBelowHero';

/**
 * Shell renders immediately; hero streams first; product rails before reels for faster product paint.
 */
export default function HomePage() {
  return (
    <HomePageLayoutShell>
      <Suspense fallback={<HomeHeroReelsFallback />}>
        <HomeHeroBannerSection />
      </Suspense>

      <Suspense fallback={<HomeProductRailsSkeleton />}>
        <HomeProductRailsBoundary />
      </Suspense>

      <Suspense fallback={null}>
        <HomeReelsBelowHero />
      </Suspense>

      <HomeRoutePrefetch />
    </HomePageLayoutShell>
  );
}
