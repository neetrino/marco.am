'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '../../lib/api-client';
import { useAuth } from '../../lib/auth/AuthContext';
import { useTranslation } from '../../lib/i18n-client';
import { dispatchOpenCartDrawer } from '@/lib/cart/cart-drawer-context';
import { resolveRequiresAttributeSelection } from '@/lib/product-requires-attribute-selection';
import {
  readStoredGuestCart,
  runGuestCartMutation,
  upsertGuestCartItem,
} from '@/app/cart/guest-cart-local';
import { computeGuestCartTotalsFromStorage } from '@/lib/cart/guest-cart-totals';
import { fetchGuestCartCatalogProducts } from '@/app/cart/guest-cart-catalog-fetch';

interface ProductDetails {
  id: string;
  slug: string;
  title?: string;
  media?: Array<string | { url?: string; src?: string }>;
  variants?: Array<{
    id: string;
    sku: string;
    price: number;
    stock: number;
    available: boolean;
    imageUrl?: string | null;
  }>;
}

async function resolveGuestCartSnapshot(
  productId: string,
  title?: string,
  image?: string | null,
): Promise<{ title?: string; image: string | null }> {
  const snapshotTitle = title?.trim() || undefined;
  const snapshotImage = image?.trim() || null;

  if (snapshotTitle && snapshotImage) {
    return { title: snapshotTitle, image: snapshotImage };
  }

  const catalogById = await fetchGuestCartCatalogProducts([productId]);
  const catalogRow = catalogById.get(productId);

  return {
    title: snapshotTitle || catalogRow?.title?.trim() || undefined,
    image: snapshotImage || catalogRow?.image || null,
  };
}

function resolveSnapshotFromProductDetails(
  details: ProductDetails,
  title?: string,
  image?: string | null,
): { title?: string; image: string | null } {
  const snapshotTitle = title?.trim() || details.title?.trim() || undefined;
  if (image?.trim()) {
    return { title: snapshotTitle, image: image.trim() };
  }

  const mediaFirst = details.media?.[0];
  if (typeof mediaFirst === 'string' && mediaFirst.trim()) {
    return { title: snapshotTitle, image: mediaFirst.trim() };
  }
  if (mediaFirst && typeof mediaFirst === 'object') {
    const mediaUrl = mediaFirst.url?.trim() || mediaFirst.src?.trim();
    if (mediaUrl) {
      return { title: snapshotTitle, image: mediaUrl };
    }
  }

  const variantImage = details.variants?.[0]?.imageUrl?.trim();
  return {
    title: snapshotTitle,
    image: variantImage || image?.trim() || null,
  };
}

interface UseAddToCartProps {
  productId: string;
  productSlug: string;
  inStock: boolean;
  /** When present, skip GET /api/v1/products/:slug and use this variant for add-to-cart (one request instead of two). */
  defaultVariantId?: string | null;
  /** Unit price (AMD) — stored in guest cart so Header doesn't need extra API calls. */
  price?: number;
  /** Display snapshot for instant cart drawer (guest). */
  title?: string;
  image?: string | null;
  /** When true (or inferred from multiple colors), cart click opens PDP for attribute selection. */
  requiresAttributeSelection?: boolean | null;
  colors?: Array<{ value: string }> | null;
}

/**
 * Hook for adding products to cart
 * @param props - Product information
 * @returns Object with loading state and addToCart function
 */
export function useAddToCart({
  productId,
  productSlug,
  inStock,
  defaultVariantId,
  price: propPrice,
  title: propTitle,
  image: propImage,
  requiresAttributeSelection,
  colors,
}: UseAddToCartProps) {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const { t } = useTranslation();
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const needsAttributeSelection = resolveRequiresAttributeSelection({
    requiresAttributeSelection,
    colors,
  });
  const hasPurchasablePrice =
    typeof propPrice === 'number' ? Number.isFinite(propPrice) && propPrice > 0 : true;

  const addToCart = async () => {
    if (!inStock || !hasPurchasablePrice) {
      return;
    }

    if (needsAttributeSelection) {
      router.push(`/products/${encodeURIComponent(productSlug.trim())}`);
      return;
    }

    // Validate product slug before making API call
    if (!productSlug || productSlug.trim() === '' || productSlug.includes(' ')) {
      console.error('❌ [PRODUCT CARD] Invalid product slug:', productSlug);
      alert(t('common.alerts.invalidProduct'));
      return;
    }

    // If user is not logged in, use localStorage for cart
    if (!isLoggedIn) {
      setIsAddingToCart(true);
      try {
        let variantId: string;
        let variantStock: number | undefined;
        let variantPrice: number | undefined = propPrice || undefined;
        let snapshotTitle = propTitle?.trim() || undefined;
        let snapshotImage: string | null = propImage?.trim() || null;

        if (defaultVariantId) {
          variantId = defaultVariantId;
          const needsCatalogFetch = !variantPrice || !snapshotTitle || !snapshotImage;
          if (needsCatalogFetch) {
            const catalogById = await fetchGuestCartCatalogProducts([productId]);
            const catalogRow = catalogById.get(productId);
            if (!variantPrice && catalogRow?.price) {
              variantPrice = catalogRow.price;
            }
            snapshotTitle = snapshotTitle || catalogRow?.title?.trim();
            snapshotImage = snapshotImage || catalogRow?.image || null;
            if (!snapshotTitle || !snapshotImage) {
              const catalogSnapshot = await resolveGuestCartSnapshot(
                productId,
                snapshotTitle,
                snapshotImage,
              );
              snapshotTitle = catalogSnapshot.title ?? snapshotTitle;
              snapshotImage = catalogSnapshot.image ?? snapshotImage;
            }
          }
        } else {
          const encodedSlug = encodeURIComponent(productSlug.trim());
          const productDetails = await apiClient.get<ProductDetails>(
            `/api/v1/products/${encodedSlug}`,
          );
          if (!productDetails.variants || productDetails.variants.length === 0) {
            alert(t('common.alerts.noVariantsAvailable'));
            setIsAddingToCart(false);
            return;
          }
          variantId = productDetails.variants[0].id;
          variantStock = productDetails.variants[0].stock;
          if (!variantPrice) {
            variantPrice = productDetails.variants[0].price;
          }
          const detailSnapshot = resolveSnapshotFromProductDetails(
            productDetails,
            snapshotTitle,
            snapshotImage,
          );
          snapshotTitle = detailSnapshot.title;
          snapshotImage = detailSnapshot.image;
        }
        if (!variantPrice || variantPrice <= 0) {
          setIsAddingToCart(false);
          return;
        }

        await runGuestCartMutation(() => {
          const cart = readStoredGuestCart();
          const existingItem = cart.find(
            (item) => item.productId === productId && item.variantId === variantId,
          );
          const currentQuantityInCart = existingItem?.quantity || 0;
          const totalQuantity = currentQuantityInCart + 1;

          if (variantStock !== undefined && totalQuantity > variantStock) {
            throw new Error('INSUFFICIENT_STOCK');
          }

          upsertGuestCartItem({
            productId,
            productSlug,
            variantId,
            quantityDelta: 1,
            price: variantPrice || 0,
            title: snapshotTitle,
            image: snapshotImage,
          });
        });

        const guestTotals = computeGuestCartTotalsFromStorage(readStoredGuestCart());
        window.dispatchEvent(
          new CustomEvent('cart-updated', {
            detail: {
              itemsCount: guestTotals.itemsCount,
              total: guestTotals.total,
              currency: 'AMD',
            },
          }),
        );
        dispatchOpenCartDrawer();
      } catch (error: unknown) {
        if (error instanceof Error && error.message === 'INSUFFICIENT_STOCK') {
          alert(t('common.alerts.noMoreStockAvailable'));
          return;
        }
        console.error('❌ [PRODUCT CARD] Error adding to guest cart:', error);
        const err = error as { message?: string; status?: number };
        if (err?.message?.includes('does not exist') || err?.message?.includes('404') || err?.status === 404) {
          alert(t('common.alerts.productNotFound'));
        } else {
          router.push(`/login?redirect=/products`);
        }
      } finally {
        setIsAddingToCart(false);
      }
      return;
    }

    setIsAddingToCart(true);

    const unitPrice = propPrice ?? 0;
    const canOptimisticItem = Boolean(defaultVariantId);
    window.dispatchEvent(new CustomEvent('cart-updated', {
      detail: {
        optimisticAdd: {
          quantity: 1,
          price: unitPrice,
          ...(canOptimisticItem
            ? {
                productId,
                variantId: defaultVariantId,
                productSlug,
                title: propTitle,
                image: propImage,
              }
            : {}),
        },
      },
    }));
    dispatchOpenCartDrawer();

    try {
      let variantId: string;
      if (defaultVariantId) {
        variantId = defaultVariantId;
      } else {
        const encodedSlug = encodeURIComponent(productSlug.trim());
        const productDetails = await apiClient.get<ProductDetails>(`/api/v1/products/${encodedSlug}`);
        if (!productDetails.variants || productDetails.variants.length === 0) {
          alert(t('common.alerts.noVariantsAvailable'));
          return;
        }
        variantId = productDetails.variants[0].id;
        const fetchedPrice = productDetails.variants[0].price;
        if (!fetchedPrice || fetchedPrice <= 0) {
          setIsAddingToCart(false);
          return;
        }
      }

      const response = await apiClient.post<{
        item: { id: string; quantity: number; price: number };
        cartSummary?: { itemsCount: number; total: number };
      }>(
        '/api/v1/cart/items',
        {
          productId: productId,
          variantId: variantId,
          quantity: 1,
        }
      );

      window.dispatchEvent(new CustomEvent('cart-updated', {
        detail: response.cartSummary || null,
      }));
    } catch (error: unknown) {
      console.error('❌ [PRODUCT CARD] Error adding to cart:', error);

      const err = error as {
        message?: string;
        status?: number;
        statusCode?: number;
        response?: {
          data?: {
            detail?: string;
            title?: string;
          };
        };
      };

      if (err?.message?.includes('does not exist') || err?.message?.includes('404') || err?.status === 404 || err?.statusCode === 404) {
        alert(t('common.alerts.productNotFound'));
        setIsAddingToCart(false);
        return;
      }

      if (err.response?.data?.detail?.includes('No more stock available') ||
          err.response?.data?.detail?.includes('exceeds available stock') ||
          err.response?.data?.title === 'Insufficient stock') {
        alert(t('common.alerts.noMoreStockAvailable'));
        setIsAddingToCart(false);
        return;
      }

      if (err.message?.includes('401') || err.message?.includes('Unauthorized') || err?.status === 401 || err?.statusCode === 401) {
        router.push(`/login?redirect=/products`);
      } else {
        alert(t('common.alerts.failedToAddToCart'));
      }
      window.dispatchEvent(new Event('cart-updated'));
    } finally {
      setIsAddingToCart(false);
    }
  };

  return { isAddingToCart, addToCart };
}




