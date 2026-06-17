import type { ShopGridProduct } from '@/app/products/shop-grid-product';
import {
  resolveNavigationSeedImages,
  type ProductPdpNavigationSeed,
} from '@/lib/product-pdp/pdp-navigation-seed';

function deriveDiscountBadge(
  product: ShopGridProduct,
): ProductPdpNavigationSeed['discountBadge'] {
  if (
    product.compareAtPrice != null &&
    product.compareAtPrice > product.price &&
    product.price > 0
  ) {
    const percent = Math.round((1 - product.price / product.compareAtPrice) * 100);
    if (percent > 0) {
      return { type: 'percentage', value: percent, label: `-${percent}%` };
    }
  }

  return null;
}

/** Maps a PLP grid row into the PDP navigation seed shape. */
export function shopGridProductToPdpNavigationSeed(
  product: ShopGridProduct,
): ProductPdpNavigationSeed {
  const images = resolveNavigationSeedImages(product.image, product.images);

  return {
    id: product.id,
    slug: product.slug,
    title: product.title,
    image: product.image,
    images,
    labels: product.labels,
    inStock: product.inStock,
    brand: product.brand
      ? {
          id: product.brand.id,
          name: product.brand.name,
          logo: product.brand.logoUrl ?? null,
        }
      : null,
    categories: product.categories ?? [],
    price: product.price,
    oldPrice:
      product.compareAtPrice != null && product.compareAtPrice > product.price
        ? product.compareAtPrice
        : null,
    discountBadge: deriveDiscountBadge(product),
  };
}
