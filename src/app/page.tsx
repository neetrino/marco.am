import { FeaturesSection } from '../components/FeaturesSection';
import { HeroSection } from '../components/HeroSection';
import { TopCategories } from '../components/TopCategories';
import { FeaturedProductsTabs } from '../components/FeaturedProductsTabs';
import { FigmaSamsungCard } from '../components/ProductCard/FigmaSamsungCard';

export default async function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero — desktop only, fixed 1920×990 */}
      <div className="overflow-x-auto">
        <HeroSection />
      </div>
      {/* Top Categories */}
      <TopCategories />

      <section className="bg-[#ffffff] py-8" aria-label="Galaxy S24 Ultra 256GB">
        <h2 className="mb-6 px-4 text-center font-montserrat-arm text-2xl font-bold text-gray-900 md:px-6 lg:px-8">
          Galaxy S24 Ultra 256GB
        </h2>
        <div className="flex justify-center px-4 pb-4 md:px-6 lg:px-8">
          <div className="relative h-[486px] w-[306.418px] shrink-0">
            <FigmaSamsungCard className="left-0" />
          </div>
        </div>
      </section>

      {/* Featured Products with Tabs */}
      <FeaturedProductsTabs />

      {/* Features Section */}
      <FeaturesSection />
    </div>
  );
}

