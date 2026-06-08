import { cookies } from 'next/headers';
import { FeaturedProductsTabs } from '@/components/FeaturedProductsTabs';
import { HomeSpecialOffersSection } from '@/components/home/HomeSpecialOffersSection';
import {
  LANGUAGE_PREFERENCE_KEY,
  parseLanguageFromServer,
  type LanguageCode,
} from '@/lib/language';
import { getHomeProductRailsDataCached } from './home-product-rails-data';

/**
 * Both home product strips resolve together (one Suspense, parallel Redis/DB).
 */
export async function HomeProductRailsBoundary() {
  const cookieStore = await cookies();
  const lang: LanguageCode =
    parseLanguageFromServer(cookieStore.get(LANGUAGE_PREFERENCE_KEY)?.value) ?? 'en';

  const rails = await getHomeProductRailsDataCached(lang);

  return (
    <>
      <HomeSpecialOffersSection
        serverLanguage={lang}
        initialPromotionProducts={rails.promotionProducts}
      />
      <FeaturedProductsTabs
        serverLanguage={lang}
        initialNewProducts={rails.newProducts}
        initialHomeBrandPartners={rails.brandPartners}
        initialHomeBrandPartnersSectionTitle={rails.brandPartnersSectionTitle}
        initialPromoStripBanners={rails.promoStripBanners}
      />
    </>
  );
}
