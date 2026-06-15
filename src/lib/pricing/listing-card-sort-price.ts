import { resolveProductPrice } from '@/lib/pricing/product-price';
import { pickVariantForListingPrice } from '@/lib/product-variant-listing-pick';
import type { ListingDiscountSettings } from '@/lib/services/listing-discount-settings';
import type { ProductWithRelations } from '@/lib/services/products-find-query/types';

function resolveAppliedListingDiscount(
  product: Pick<ProductWithRelations, 'discountPercent' | 'primaryCategoryId' | 'brandId'>,
  settings: ListingDiscountSettings,
): number {
  const productDiscount = product.discountPercent || 0;
  if (productDiscount > 0) {
    return productDiscount;
  }
  if (product.primaryCategoryId && settings.categoryDiscounts[product.primaryCategoryId]) {
    return settings.categoryDiscounts[product.primaryCategoryId];
  }
  if (product.brandId && settings.brandDiscounts[product.brandId]) {
    return settings.brandDiscounts[product.brandId];
  }
  return settings.globalDiscount > 0 ? settings.globalDiscount : 0;
}

/**
 * Effective PLP card price for sorting — matches listing transform `price` output.
 */
export function resolveListingCardSortPrice(
  product: ProductWithRelations,
  settings: ListingDiscountSettings,
): number {
  const variant = pickVariantForListingPrice(product.variants);
  const currentPrice = variant?.price || 0;
  const appliedDiscount = resolveAppliedListingDiscount(product, settings);
  const pricing = resolveProductPrice({
    currentPrice,
    compareAtPrice: variant?.compareAtPrice ?? null,
    fallbackDiscountPercent: appliedDiscount > 0 ? appliedDiscount : null,
  });
  return pricing.currentPrice;
}
