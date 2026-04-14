import { HeroCarousel } from '../components/HeroCarousel';
import { HomeMobileMessageCta } from '../components/home/HomeMobileMessageCta';
import { HomeReelsSection } from '../components/home/HomeReelsSection';

import { FeaturedProductsTabs } from '../components/FeaturedProductsTabs';
import { HomeSpecialOffersSection } from '../components/home/HomeSpecialOffersSection';

export default async function HomePage() {

  return (
    <div className="min-h-screen">
      <HeroCarousel />

      <HomeReelsSection />

      <HomeMobileMessageCta />

      <HomeSpecialOffersSection />

      {/* Featured Products with Tabs + two home banners (gradient + secondary) */}
      <FeaturedProductsTabs />
    </div>
  );
}

