import type { ShopGridProduct } from '@/app/products/shop-grid-product';
import type { LanguageCode } from '@/lib/language';
import { normalizePdpSlug } from '@/lib/product-pdp/pdp-slug';

const SHOP_PRODUCTS_CACHE_TTL_MS = 120_000;

type ShopProductCacheEntry = {
  product: ShopGridProduct;
  language: LanguageCode;
  storedAt: number;
};

const productsBySlug = new Map<string, ShopProductCacheEntry>();

/** Persists PLP grid rows by slug for instant PDP shell lookup after listing fetch. */
export function writeShopProductsCache(
  products: readonly ShopGridProduct[],
  language: LanguageCode,
): void {
  const storedAt = Date.now();
  for (const product of products) {
    if (!product.slug) {
      continue;
    }
    productsBySlug.set(normalizePdpSlug(product.slug), { product, language, storedAt });
  }
}

export function getShopProductBySlug(slug: string): ShopGridProduct | null {
  const normalizedSlug = normalizePdpSlug(slug);
  const entry = productsBySlug.get(normalizedSlug);
  if (!entry) {
    return null;
  }
  if (Date.now() - entry.storedAt > SHOP_PRODUCTS_CACHE_TTL_MS) {
    productsBySlug.delete(slug);
    return null;
  }
  return entry.product;
}
