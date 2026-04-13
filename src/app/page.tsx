import { HeroCarousel } from '../components/HeroCarousel';
import { HomeReelsSection } from '../components/home/HomeReelsSection';

import { FeaturesSection } from '../components/FeaturesSection';
import { FeaturedProductsTabs } from '../components/FeaturedProductsTabs';
import { HomeSpecialOffersSection } from '../components/home/HomeSpecialOffersSection';

export default async function HomePage() {

  return (
    <div className="min-h-screen">
      <HeroCarousel />

      <HomeReelsSection />

      <HomeSpecialOffersSection />

      {/* Featured Products with Tabs */}
      <FeaturedProductsTabs />

      {/* Features Section */}
      <FeaturesSection />
    </div>
  );
}

