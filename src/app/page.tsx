import { HeroCarousel } from '../components/HeroCarousel';
import { HomeReelsSection } from '../components/home/HomeReelsSection';

import { FeaturesSection } from '../components/FeaturesSection';
import { TopCategories } from '../components/TopCategories';
import { FeaturedProductsTabs } from '../components/FeaturedProductsTabs';

export default async function HomePage() {

  return (
    <div className="min-h-screen">
      <HeroCarousel />

      <HomeReelsSection />

      {/* Top Categories */}
      <TopCategories />

      {/* Featured Products with Tabs */}
      <FeaturedProductsTabs />

      {/* Features Section */}
      <FeaturesSection />
    </div>
  );
}

