import { cookies } from 'next/headers';
import { HeroCarousel } from '../components/HeroCarousel';
import { HomeMobileMessageCta } from '../components/home/HomeMobileMessageCta';
import { HomeReelsSection } from '../components/home/HomeReelsSection';

import { FeaturedProductsTabs } from '../components/FeaturedProductsTabs';
import { HomeSpecialOffersSection } from '../components/home/HomeSpecialOffersSection';
import { HomeCustomerReviewsSection } from '../components/home/HomeCustomerReviewsSection';
import { HomeWhyChooseUsSection } from '../components/home/HomeWhyChooseUsSection';
import { LANGUAGE_PREFERENCE_KEY, parseLanguageFromServer } from '../lib/language';
import { homeCustomerReviewsService } from '../lib/services/home-customer-reviews.service';
import { reelsManagementService } from '../lib/services/reels-management.service';
import { whyChooseUsService } from '../lib/services/why-choose-us.service';

export default async function HomePage() {
  const cookieStore = await cookies();
  const lang =
    parseLanguageFromServer(cookieStore.get(LANGUAGE_PREFERENCE_KEY)?.value) ??
    'en';
  const initialWhyChooseUs = await whyChooseUsService.getPublicPayload(lang);
  const initialCustomerReviews =
    await homeCustomerReviewsService.getPublicPayload(lang);
  const reelsFeed = await reelsManagementService.getPublicPayload({
    localeRaw: lang,
  });

  return (
    <div className="min-h-screen">
      <HeroCarousel />

      <div className="mt-6 sm:mt-8 md:mt-10">
        <HomeReelsSection items={reelsFeed.items} />
      </div>

      <HomeMobileMessageCta />

      <HomeSpecialOffersSection />

      <HomeWhyChooseUsSection initialWhyChooseUs={initialWhyChooseUs} />

      <HomeCustomerReviewsSection initialReviews={initialCustomerReviews} />

      {/* Featured Products with Tabs + two home banners (gradient + secondary) */}
      <FeaturedProductsTabs />
    </div>
  );
}

