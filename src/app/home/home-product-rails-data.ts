import { cache } from 'react';
import type { SpecialOfferProduct } from '@/components/home/special-offer-product.types';
import { SPECIAL_OFFERS_PRODUCTS_LIMIT } from '@/constants/specialOffersSection';
import { dedupeCardProductsByTitle } from '@/lib/dedupeCardProductsByTitle';
import { loadHomeNewArrivalsPool } from '@/lib/home/home-new-arrivals-pool';
import type { LanguageCode } from '@/lib/language';
import { getProductsPlpReadModelPayload } from '@/lib/read-model/products-plp-read-model';
import { bannerManagementService } from '@/lib/services/banner-management.service';
import type { PublicBannersPayload } from '@/lib/services/banner-management.service';
import { homeBrandPartnersService } from '@/lib/services/home-brand-partners.service';
import type { HomeBrandPartnerPublicItem } from '@/lib/types/home-brand-partners-public';

import {
  HOME_APP_DOWNLOAD_BANNER_ID,
  HOME_APP_DOWNLOAD_DEFAULT_IMAGE_URL,
} from '@/lib/constants/home-hero-admin-banners';

type HomeProductRailsData = {
  promotionProducts: SpecialOfferProduct[];
  newProducts: SpecialOfferProduct[];
  brandPartners: readonly HomeBrandPartnerPublicItem[] | null;
  brandPartnersSectionTitle: string | null;
  promoStripBanners: PublicBannersPayload | null;
  appDownloadBannerUrl: string | null;
};

/**
 * Fetches both home product strips and brand partners in one parallel round-trip.
 */
async function fetchHomeProductRailsData(
  lang: LanguageCode,
): Promise<HomeProductRailsData> {
  const [promotionOutcome, newOutcome, partnersOutcome, promoBannersOutcome, appBannerOutcome] =
    await Promise.allSettled([
      getProductsPlpReadModelPayload({
        page: '1',
        limit: String(SPECIAL_OFFERS_PRODUCTS_LIMIT),
        lang,
        filter: 'promotion',
        sort: 'createdAt',
        includeFilters: '0',
      }),
      loadHomeNewArrivalsPool(lang, getProductsPlpReadModelPayload),
      homeBrandPartnersService.getPublicPayload(lang),
      bannerManagementService.getPublicSlotPayload({
        slot: 'home.promo.strip',
        localeRaw: lang,
      }),
      bannerManagementService.getPublicSlotPayload({
        slot: 'home.app.banner',
        localeRaw: lang,
      }),
    ]);

  let promotionProducts: SpecialOfferProduct[] = [];
  let newProducts: SpecialOfferProduct[] = [];
  let brandPartners: readonly HomeBrandPartnerPublicItem[] | null = null;
  let brandPartnersSectionTitle: string | null = null;
  let promoStripBanners: PublicBannersPayload | null = null;
  let appDownloadBannerUrl: string | null = null;

  if (promotionOutcome.status === 'fulfilled') {
    promotionProducts = dedupeCardProductsByTitle(
      (promotionOutcome.value.items ?? []) as SpecialOfferProduct[],
    ).slice(0, SPECIAL_OFFERS_PRODUCTS_LIMIT);
  }

  if (newOutcome.status === 'fulfilled') {
    newProducts = newOutcome.value as SpecialOfferProduct[];
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

  if (appBannerOutcome.status === 'fulfilled') {
    appDownloadBannerUrl =
      appBannerOutcome.value.items.find((item) => item.id === HOME_APP_DOWNLOAD_BANNER_ID)
        ?.imageDesktopUrl ?? HOME_APP_DOWNLOAD_DEFAULT_IMAGE_URL;
  }

  return {
    promotionProducts,
    newProducts,
    brandPartners,
    brandPartnersSectionTitle,
    promoStripBanners,
    appDownloadBannerUrl,
  };
}

/** Deduped per-request rails payload — shared by prefetch + boundary. */
export const getHomeProductRailsDataCached = cache(fetchHomeProductRailsData);
