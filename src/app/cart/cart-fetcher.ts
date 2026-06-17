import { fetchProductDetail } from '../../lib/product-pdp/product-pdp-fetchers';
import { getStoredLanguage } from '../../lib/language';
import { apiClient } from '../../lib/api-client';
import { logger } from '../../lib/utils/logger';
import type { Product, ProductVariant } from '../products/[slug]/types';
import type { Cart, CartItem } from './types';
import {
  buildGuestCartFromStorage,
  persistGuestCartSnapshots,
  readStoredGuestCart,
  type StoredGuestCartItem,
} from './guest-cart-local';
import { fetchGuestCartCatalogProducts, type GuestCartCatalogProduct } from './guest-cart-catalog-fetch';
import { cartLineSubtotal, resolveGuestUnitPrice } from './line-subtotal';
import {
  formatCartVariantOptionFromApi,
  type CartVariantOption,
} from '../../lib/cart/format-cart-variant-options';
import {
  findGuestCartVariant,
  normalizeProductSlug,
  resolveGuestCartItemImage,
} from './guest-cart-product-utils';

export { buildGuestCartFromStorage } from './guest-cart-local';

async function fetchProductDetailBySlug(slug: string): Promise<Product | null> {
  try {
    const lang = getStoredLanguage();
    return await fetchProductDetail(slug, lang);
  } catch (error: unknown) {
    const errorObj = error as { status?: number; statusCode?: number };
    if (errorObj?.status === 404 || errorObj?.statusCode === 404) {
      return null;
    }
    logger.error(`Error fetching product detail for slug ${slug}`, { error });
    return null;
  }
}

async function fetchProductDetailsBySlugs(slugs: string[]): Promise<Map<string, Product>> {
  const uniqueSlugs = [...new Set(slugs.map((slug) => slug.trim()).filter(Boolean))];
  const entries = await Promise.all(
    uniqueSlugs.map(async (slug) => {
      const product = await fetchProductDetailBySlug(slug);
      return [slug, product] as const;
    }),
  );

  const bySlug = new Map<string, Product>();
  for (const [slug, product] of entries) {
    if (product) {
      bySlug.set(slug, product);
      const responseSlug = normalizeProductSlug(product.slug);
      if (responseSlug && responseSlug !== slug) {
        bySlug.set(responseSlug, product);
      }
    }
  }
  return bySlug;
}

function resolveCartLineTitle(
  catalog: GuestCartCatalogProduct | undefined,
  detail: Product | undefined,
  storedTitle: string | undefined,
  fallback: string,
): string {
  const detailTitle = detail?.title?.trim();
  if (detailTitle) {
    return detailTitle;
  }
  const catalogTitle = catalog?.title?.trim();
  if (catalogTitle) {
    return catalogTitle;
  }
  const cachedTitle = storedTitle?.trim();
  if (cachedTitle) {
    return cachedTitle;
  }
  return fallback;
}

function resolveCartLineImage(
  catalog: GuestCartCatalogProduct | undefined,
  detail: Product | undefined,
  variant: ProductVariant | undefined,
  storedImage: string | null | undefined,
): string | null {
  if (storedImage) {
    return storedImage;
  }
  if (detail && variant) {
    const detailImage = resolveGuestCartItemImage(detail, variant);
    if (detailImage) {
      return detailImage;
    }
  }
  return catalog?.image ?? null;
}

function mapGuestItemToCartItem(
  item: StoredGuestCartItem,
  index: number,
  catalog: GuestCartCatalogProduct | undefined,
  detail: Product | undefined,
  t: (key: string) => string,
): { item: CartItem | null; shouldRemove: boolean; snapshot?: Partial<StoredGuestCartItem> } {
  const slug =
    normalizeProductSlug(catalog?.slug) ??
    normalizeProductSlug(detail?.slug) ??
    normalizeProductSlug(item.productSlug);

  if (!slug && !item.productId) {
    return { item: null, shouldRemove: true };
  }

  const variant = detail ? findGuestCartVariant(detail, item.variantId) : undefined;
  const title = resolveCartLineTitle(catalog, detail, item.title, t('common.messages.product'));
  const resolvedImage = resolveCartLineImage(catalog, detail, variant, item.image ?? null);
  const unitPrice = resolveGuestUnitPrice(
    Number(variant?.currentPrice ?? variant?.price ?? catalog?.price ?? item.price ?? 0),
    item.price,
  );
  const variantOptions: CartVariantOption[] = (variant?.options ?? [])
    .map((option) => formatCartVariantOptionFromApi(option))
    .filter((option): option is CartVariantOption => option !== null);

  const snapshot: Partial<StoredGuestCartItem> = {
    title,
    image: resolvedImage,
    sku: variant?.sku ?? item.sku ?? '',
    stock: variant?.stock ?? item.stock,
    originalPrice: variant?.originalPrice ?? variant?.oldPrice ?? item.originalPrice ?? null,
    options: variantOptions.length > 0 ? variantOptions : item.options,
    price: unitPrice,
    productSlug: slug,
  };

  return {
    item: {
      id: `${item.productId}-${item.variantId}-${index}`,
      variant: {
        id: item.variantId,
        sku: variant?.sku ?? item.sku ?? '',
        stock: variant?.stock ?? item.stock,
        options: variantOptions.length > 0 ? variantOptions : item.options,
        product: {
          id: item.productId,
          title,
          slug: slug ?? '',
          image: resolvedImage,
        },
      },
      quantity: Number(item.quantity),
      price: unitPrice,
      originalPrice: variant?.originalPrice ?? variant?.oldPrice ?? item.originalPrice ?? null,
      total: cartLineSubtotal(unitPrice, item.quantity),
    },
    shouldRemove: false,
    snapshot,
  };
}

function buildCartFromResolvedItems(validItems: CartItem[]): Cart {
  const subtotal = validItems.reduce(
    (sum, item) => sum + cartLineSubtotal(item.price, item.quantity),
    0,
  );
  const itemsCount = validItems.reduce((sum, item) => sum + Number(item.quantity), 0);

  return {
    id: 'guest-cart',
    items: validItems,
    totals: {
      subtotal,
      discount: 0,
      shipping: 0,
      tax: 0,
      total: subtotal,
      currency: 'AMD',
    },
    itemsCount,
  };
}

export async function fetchGuestCart(
  t: (key: string) => string,
): Promise<Cart | null> {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const guestCartAtStart = readStoredGuestCart();
    if (guestCartAtStart.length === 0) {
      return null;
    }

    const guestCart = readStoredGuestCart();
    const productIds = [
      ...new Set([
        ...guestCartAtStart.map((item) => item.productId),
        ...guestCart.map((item) => item.productId),
      ]),
    ];
    const catalogById = await fetchGuestCartCatalogProducts(productIds);

    const slugsForDetail = [
      ...new Set(
        guestCart
          .map(
            (item) =>
              normalizeProductSlug(catalogById.get(item.productId)?.slug) ??
              normalizeProductSlug(item.productSlug),
          )
          .filter((slug): slug is string => Boolean(slug)),
      ),
    ];
    const detailBySlug = await fetchProductDetailsBySlugs(slugsForDetail);

    const itemsWithDetails = guestCart.map((item, index) => {
      const catalog = catalogById.get(item.productId);
      const slug =
        normalizeProductSlug(catalog?.slug) ?? normalizeProductSlug(item.productSlug);
      const detail = slug ? detailBySlug.get(slug) : undefined;
      return mapGuestItemToCartItem(item, index, catalog, detail, t);
    });

    const snapshotPatches = new Map<string, Partial<StoredGuestCartItem>>();
    itemsWithDetails.forEach((result, index) => {
      const row = guestCart[index];
      if (row && result.snapshot) {
        snapshotPatches.set(`${row.productId}:${row.variantId}`, result.snapshot);
      }
    });
    persistGuestCartSnapshots(guestCart, snapshotPatches);

    const validItems = itemsWithDetails
      .map((result) => result.item)
      .filter((item): item is CartItem => item !== null);

    if (validItems.length === 0) {
      return buildGuestCartFromStorage(t);
    }

    const cart = buildCartFromResolvedItems(validItems);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('cart-updated', {
          detail: {
            itemsCount: cart.itemsCount,
            total: cart.totals.total,
            currency: cart.totals.currency,
            /** Prevents useCartData from re-entering guest hydration (infinite fetch loop). */
            hydrated: true,
          },
        }),
      );
    }
    return cart;
  } catch (error: unknown) {
    logger.error('Error loading guest cart', { error });
    return buildGuestCartFromStorage(t);
  }
}

export async function fetchLoggedInCart(): Promise<Cart | null> {
  try {
    const response = await apiClient.get<{ cart: Cart }>('/api/v1/cart');
    return response.cart;
  } catch (error: unknown) {
    logger.error('Error fetching cart', { error });
    return null;
  }
}

export async function fetchCart(
  isLoggedIn: boolean,
  t: (key: string) => string,
): Promise<Cart | null> {
  if (!isLoggedIn) {
    return fetchGuestCart(t);
  }
  return fetchLoggedInCart();
}
