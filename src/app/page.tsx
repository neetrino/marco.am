import { HomeBanner } from '../components/HomeBanner';
import { HomeAppPromoBanner } from '../components/home/HomeAppPromoBanner';
import { HomeBrandsSection } from '../components/home/HomeBrandsSection';
import { HomeChatFab } from '../components/home/HomeChatFab';
import { HomeProductSection } from '../components/home/HomeProductSection';
import { HomeReelsSection } from '../components/home/HomeReelsSection';
import { HomeSecondaryBanners } from '../components/home/HomeSecondaryBanners';
import { HOME_PAGE_CONTAINER_CLASS } from '@/constants/homePageLayout';

export default async function HomePage() {
  return (
    <>
      <div className="min-h-screen w-full">
        <div className={HOME_PAGE_CONTAINER_CLASS}>
          <section>
            <HomeBanner />
          </section>

          <HomeReelsSection />

          <HomeProductSection titleKey="home.special_offers_title" filter="featured" />

          <HomeProductSection titleKey="home.new_arrivals_title" filter="new" />

          <HomeBrandsSection />

          <HomeAppPromoBanner />

          <HomeSecondaryBanners />
        </div>
      </div>
      <HomeChatFab />
    </>
  );
}
