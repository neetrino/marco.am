import { cookies } from 'next/headers';
import { HeroCarousel } from '../components/HeroCarousel';
import { HomeMobileMessageCta } from '../components/home/HomeMobileMessageCta';
import { HomeReelsSection } from '../components/home/HomeReelsSection';

import { FeaturedProductsTabs } from '../components/FeaturedProductsTabs';
import { HomeSpecialOffersSection } from '../components/home/HomeSpecialOffersSection';
import { HomeWhyChooseUsSection } from '../components/home/HomeWhyChooseUsSection';
import { LANGUAGE_PREFERENCE_KEY, parseLanguageFromServer } from '../lib/language';
import { homeHeroBannerService } from '../lib/services/home-hero-banner.service';
import { whyChooseUsService } from '../lib/services/why-choose-us.service';

export default async function HomePage() {
  const cookieStore = await cookies();
  const lang =
    parseLanguageFromServer(cookieStore.get(LANGUAGE_PREFERENCE_KEY)?.value) ??
    'en';
  const initialHero = await homeHeroBannerService.getPublicPayload(lang);
  const initialWhyChooseUs = await whyChooseUsService.getPublicPayload(lang);

  return (
    <div className="min-h-screen">
      <HeroCarousel initialHero={initialHero} />

      <HomeReelsSection />

      <HomeMobileMessageCta />

      <HomeSpecialOffersSection />

      <HomeWhyChooseUsSection initialWhyChooseUs={initialWhyChooseUs} />

      {/* Featured Products with Tabs + two home banners (gradient + secondary) */}
      <FeaturedProductsTabs />
    </div>
  );
}

