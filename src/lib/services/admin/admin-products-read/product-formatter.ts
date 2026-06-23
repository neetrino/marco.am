import { pickVariantForListingPrice } from '@/lib/product-variant-listing-pick';
import { resolveAdminProductListImageUrl } from '@/lib/admin/admin-list-product-image';
import { resolveEffectiveDiscount, type DiscountKind } from '@/lib/discount/discount-expiry';
import { resolveProductPrice } from '@/lib/pricing/product-price';

/**
 * Format product for list response
 */
export function formatProductForList(product: {
  id: string;
  primaryCategoryId?: string | null;
  published: boolean;
  featured: boolean | null;
  productClass?: "retail" | "wholesale";
  discountType?: DiscountKind | null;
  discountValue?: number | null;
  discountExpiresAt?: Date | null;
  createdAt: Date;
  translations?: Array<{
    slug: string;
    title: string;
  }>;
  variants?: Array<{
    price: number;
    stock: number;
    imageUrl?: string | null;
    discountType?: DiscountKind | null;
    discountValue?: number | null;
    discountExpiresAt?: Date | null;
  }>;
  media?: unknown[];
  categoryIds?: string[];
}, locale: string = "en") {
  // locale reserved for future list fields; category titles resolve on the client.
  void locale;
  // Безопасное получение translation с проверкой на существование массива
  const translation = Array.isArray(product.translations) && product.translations.length > 0
    ? product.translations[0]
    : null;
  
  const variant = pickVariantForListingPrice(product.variants ?? []);

  const standardPrice = variant?.price ?? 0;
  const appliedDiscount = resolveEffectiveDiscount({
    variant: variant
      ? {
          type: variant.discountType ?? 'NONE',
          value: variant.discountValue ?? null,
          expiresAt: variant.discountExpiresAt ?? null,
        }
      : null,
    product: {
      type: product.discountType ?? 'NONE',
      value: product.discountValue ?? null,
      expiresAt: product.discountExpiresAt ?? null,
    },
  });
  const resolvedPrice = resolveProductPrice({ standardPrice, discount: appliedDiscount });

  const image = resolveAdminProductListImageUrl(product.media, product.variants ?? []);

  const rawCategoryIds = product.categoryIds ?? [];
  const primaryId = product.primaryCategoryId ?? null;
  const sortedCategoryIds = [...rawCategoryIds].sort((left, right) => {
    if (left === primaryId) return -1;
    if (right === primaryId) return 1;
    return 0;
  });
  const categories = sortedCategoryIds.map((id) => ({ id, title: '' }));

  return {
    id: product.id,
    slug: translation?.slug || "",
    title: translation?.title || "",
    productClass: product.productClass || "retail",
    published: product.published,
    featured: product.featured || false,
    price: resolvedPrice.currentPrice,
    stock: variant?.stock || 0,
    discountPercent: resolvedPrice.discountPercent ?? 0,
    discountExpiresAt:
      variant?.discountExpiresAt?.toISOString() ??
      product.discountExpiresAt?.toISOString() ??
      null,
    originalPrice: resolvedPrice.oldPrice,
    colorStocks: [], // Can be enhanced later
    image,
    createdAt: product.createdAt.toISOString(),
    categories,
  };
}
