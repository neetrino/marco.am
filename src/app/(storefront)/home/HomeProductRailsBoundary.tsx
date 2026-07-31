import { FeaturedProductsTabs } from '@/components/FeaturedProductsTabs';
import { HomeSpecialOffersSection } from '@/components/home/HomeSpecialOffersSection';
import { DEFAULT_STOREFRONT_LANGUAGE } from '@/lib/language';
import { getHomeProductRailsDataCached } from './home-product-rails-data';

/**
 * Both home product strips resolve together (one Suspense, parallel Redis/DB).
 * Rendered in the default language; client strips refetch in the visitor's language after hydration.
 */
export async function HomeProductRailsBoundary() {
  const lang = DEFAULT_STOREFRONT_LANGUAGE;
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
        initialAppDownloadBannerUrl={rails.appDownloadBannerUrl}
      />
    </>
  );
}
