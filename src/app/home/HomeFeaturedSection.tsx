import { cookies } from 'next/headers';
import { FeaturedProductsTabs } from '@/components/FeaturedProductsTabs';
import { FEATURED_PRODUCTS_VISIBLE_COUNT } from '@/components/featured-products-tabs.constants';
import type { SpecialOfferProduct } from '@/components/home/special-offer-product.types';
import { getProductsListingCached } from '@/lib/cache/products-listing-redis';
import { dedupeCardProductsByTitle } from '@/lib/dedupeCardProductsByTitle';
import {
  LANGUAGE_PREFERENCE_KEY,
  parseLanguageFromServer,
  type LanguageCode,
} from '@/lib/language';
import { homeBrandPartnersService } from '@/lib/services/home-brand-partners.service';

/**
 * Streams after hero: «Նորույթներ» + brand partners load together on the server (Redis-backed)
 * so logos and cards hydrate without a client-side waterfall.
 */
export async function HomeFeaturedSection() {
  const cookieStore = await cookies();
  const lang: LanguageCode =
    parseLanguageFromServer(cookieStore.get(LANGUAGE_PREFERENCE_KEY)?.value) ?? 'en';

  let rows: SpecialOfferProduct[] = [];
  let brandPartnersPayload: Awaited<
    ReturnType<typeof homeBrandPartnersService.getPublicPayload>
  > | null = null;

  const [listingOutcome, partnersOutcome] = await Promise.allSettled([
    getProductsListingCached({
      page: 1,
      limit: FEATURED_PRODUCTS_VISIBLE_COUNT,
      lang,
      filter: 'new',
      sort: 'createdAt',
      listingOmitProductAttributes: true,
      skipExactTotalCount: true,
    }),
    homeBrandPartnersService.getPublicPayload(lang),
  ]);

  if (listingOutcome.status === 'fulfilled') {
    rows = dedupeCardProductsByTitle(
      (listingOutcome.value.data ?? []) as SpecialOfferProduct[],
    ).slice(0, FEATURED_PRODUCTS_VISIBLE_COUNT);
  }

  if (partnersOutcome.status === 'fulfilled') {
    brandPartnersPayload = partnersOutcome.value;
  }

  const initialBrandPartners =
    brandPartnersPayload !== null ? brandPartnersPayload.brands : null;

  return (
    <FeaturedProductsTabs
      serverLanguage={lang}
      initialNewProducts={rows}
      initialHomeBrandPartners={initialBrandPartners}
      initialHomeBrandPartnersSectionTitle={
        brandPartnersPayload?.sectionTitle?.trim()
          ? brandPartnersPayload.sectionTitle.trim()
          : null
      }
    />
  );
}
