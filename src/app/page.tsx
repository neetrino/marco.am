import { HomeBanner } from '../components/HomeBanner';
import { FeaturesSection } from '../components/FeaturesSection';
import { TopCategories } from '../components/TopCategories';
import { FeaturedProductsTabs } from '../components/FeaturedProductsTabs';

export default async function HomePage() {
  return (
    <div className="min-h-screen">
      <section>
        <HomeBanner />
      </section>

      <TopCategories />

      <FeaturedProductsTabs />

      <FeaturesSection />
    </div>
  );
}
