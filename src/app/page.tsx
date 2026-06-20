import { Suspense } from 'react';
import { HomePageLayoutShell } from '@/components/home/HomePageLayoutShell';
import { HomeRoutePrefetch } from '@/components/home/HomeRoutePrefetch';
import { HomeProductRailsBoundary } from './home/HomeProductRailsBoundary';
import { HomeProductRailsPrefetch } from './home/HomeProductRailsPrefetch';
import { HomeHeroBannerSection } from './HomeHeroBannerSection';
import { HomeHeroBannerFallback, HomeReelsRailFallback } from './HomeHeroReelsFallback';
import { HomeReelsBelowHero } from './HomeReelsBelowHero';

/**
 * Home is prerendered as static HTML (instant hero/LCP) and refreshed via ISR every 5 minutes.
 * `force-static` is required because the merchandising data is read through the Upstash (fetch-based)
 * cache layer, which would otherwise opt the route into dynamic rendering. Hero images are
 * locale-independent and the product strips re-localize client-side, so the default-language
 * snapshot is correct for every visitor.
 */
export const revalidate = 300;
export const dynamic = 'force-static';

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
