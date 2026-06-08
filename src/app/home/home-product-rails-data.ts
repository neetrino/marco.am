import { FEATURED_PRODUCTS_VISIBLE_COUNT } from '@/components/featured-products-tabs.constants';
import type { SpecialOfferProduct } from '@/components/home/special-offer-product.types';
import { SPECIAL_OFFERS_PRODUCTS_LIMIT } from '@/constants/specialOffersSection';
import { getProductsListingCached } from '@/lib/cache/products-listing-redis';
import { dedupeCardProductsByTitle } from '@/lib/dedupeCardProductsByTitle';
import type { LanguageCode } from '@/lib/language';
import { bannerManagementService } from '@/lib/services/banner-management.service';
import type { PublicBannersPayload } from '@/lib/services/banner-management.service';
import { homeBrandPartnersService } from '@/lib/services/home-brand-partners.service';
import type { HomeBrandPartnerPublicItem } from '@/lib/types/home-brand-partners-public';

export type HomeProductRailsData = {
  promotionProducts: SpecialOfferProduct[];
  newProducts: SpecialOfferProduct[];
  brandPartners: readonly HomeBrandPartnerPublicItem[] | null;
  brandPartnersSectionTitle: string | null;
  promoStripBanners: PublicBannersPayload | null;
};

/**
 * Fetches both home product strips and brand partners in one parallel round-trip.
 */
export async function fetchHomeProductRailsData(
  lang: LanguageCode,
): Promise<HomeProductRailsData> {
  const [promotionOutcome, newOutcome, partnersOutcome, promoBannersOutcome] =
    await Promise.allSettled([
    getProductsListingCached({
      page: 1,
      limit: SPECIAL_OFFERS_PRODUCTS_LIMIT,
      lang,
      filter: 'promotion',
      sort: 'createdAt',
      listingOmitProductAttributes: true,
      skipExactTotalCount: true,
      homeStripListing: true,
    }),
    getProductsListingCached({
      page: 1,
      limit: FEATURED_PRODUCTS_VISIBLE_COUNT,
      lang,
      filter: 'new',
      sort: 'createdAt',
      listingOmitProductAttributes: true,
      skipExactTotalCount: true,
      homeStripListing: true,
    }),
    homeBrandPartnersService.getPublicPayload(lang),
    bannerManagementService.getPublicSlotPayload({
      slot: 'home.promo.strip',
      localeRaw: lang,
    }),
  ]);

  let promotionProducts: SpecialOfferProduct[] = [];
  let newProducts: SpecialOfferProduct[] = [];
  let brandPartners: readonly HomeBrandPartnerPublicItem[] | null = null;
  let brandPartnersSectionTitle: string | null = null;
  let promoStripBanners: PublicBannersPayload | null = null;

  if (promotionOutcome.status === 'fulfilled') {
    promotionProducts = dedupeCardProductsByTitle(
      (promotionOutcome.value.data ?? []) as SpecialOfferProduct[],
    ).slice(0, SPECIAL_OFFERS_PRODUCTS_LIMIT);
  }

  if (newOutcome.status === 'fulfilled') {
    newProducts = dedupeCardProductsByTitle(
      (newOutcome.value.data ?? []) as SpecialOfferProduct[],
    ).slice(0, FEATURED_PRODUCTS_VISIBLE_COUNT);
  }

  if (partnersOutcome.status === 'fulfilled') {
    brandPartners = partnersOutcome.value.brands;
    brandPartnersSectionTitle = partnersOutcome.value.sectionTitle?.trim()
      ? partnersOutcome.value.sectionTitle.trim()
      : null;
  }

  if (promoBannersOutcome.status === 'fulfilled') {
    promoStripBanners = promoBannersOutcome.value;
  }

  return {
    promotionProducts,
    newProducts,
    brandPartners,
    brandPartnersSectionTitle,
    promoStripBanners,
  };
}
