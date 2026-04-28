import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { HomeHeroReelsFallback } from './HomeHeroReelsFallback';
import { HomeHeroReelsSection } from './HomeHeroReelsSection';

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

/**
 * Sync shell: hero + reels stream inside Suspense; below-the-fold sections stay dynamic imports.
 */
export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Suspense fallback={<HomeHeroReelsFallback />}>
        <HomeHeroReelsSection />
      </Suspense>

      <HomeSpecialOffersSection />

      <FeaturedProductsTabs />
    </div>
  );
}
