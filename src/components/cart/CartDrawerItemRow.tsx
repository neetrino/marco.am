'use client';

import { Trash2 } from 'lucide-react';
import Image from 'next/image';
import { ProductPdpPrefetchLink } from '../ProductPdpPrefetchLink';
import type { ProductPdpNavigationSeed } from '@/lib/product-pdp/pdp-navigation-seed';
import { ProductImagePlaceholder } from '../ProductImagePlaceholder';
import { shouldShowCartSku } from '../../lib/cart/format-cart-variant-options';
import { formatMoneyInCurrency, type CurrencyCode } from '../../lib/currency';
import type { CartItem } from '../../app/cart/types';
import { cartLineSubtotal } from '../../app/cart/line-subtotal';

interface CartDrawerItemRowProps {
  item: CartItem;
  currency: CurrencyCode;
  amountCurrency: CurrencyCode;
  updating: boolean;
  onRemove: (itemId: string) => void;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onNavigate: () => void;
  t: (key: string) => string;
}

export function CartDrawerItemRow({
  item,
  currency,
  amountCurrency,
  updating,
  onRemove,
  onUpdateQuantity,
  onNavigate,
  t,
}: CartDrawerItemRowProps) {
  const productNavigationSeed: ProductPdpNavigationSeed = {
    id: item.variant.product.id,
    slug: item.variant.product.slug,
    title: item.variant.product.title,
    image: item.variant.product.image ?? null,
    inStock: (item.variant.stock ?? 0) > 0,
    brand: null,
    categories: [],
    price: item.price,
    oldPrice: null,
    discountBadge: null,
  };

  const showSku = shouldShowCartSku(
    item.variant.sku,
    item.variant.product.title,
    item.variant.options ?? [],
  );

  return (
    <article className="relative rounded-xl border border-marco-border/80 bg-white p-3 dark:border-white/10 dark:bg-zinc-900">
      <button
        type="button"
        onClick={() => onRemove(item.id)}
        className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-md border border-error/40 text-error transition-colors hover:bg-error/5"
        aria-label={t('common.ariaLabels.removeItem')}
      >
        <Trash2 className="h-4 w-4" aria-hidden />
      </button>

      <div className="flex gap-3 pr-11">
        <ProductPdpPrefetchLink
          href={`/products/${item.variant.product.slug}`}
          productSlug={item.variant.product.slug}
          navigationSeed={productNavigationSeed}
          onClick={onNavigate}
          className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-marco-gray"
        >
          {item.variant.product.image ? (
            <Image
              key={item.variant.product.image}
              src={item.variant.product.image}
              alt={item.variant.product.title}
              fill
              className="object-cover"
              sizes="80px"
              unoptimized
            />
          ) : (
            <ProductImagePlaceholder
              className="h-full w-full"
              aria-label={item.variant.product.title}
            />
          )}
        </ProductPdpPrefetchLink>

        <div className="min-w-0 flex-1">
          <ProductPdpPrefetchLink
            href={`/products/${item.variant.product.slug}`}
            productSlug={item.variant.product.slug}
            navigationSeed={productNavigationSeed}
            onClick={onNavigate}
            className="line-clamp-2 text-sm font-semibold text-marco-black hover:text-marco-text dark:text-white"
          >
            {item.variant.product.title}
          </ProductPdpPrefetchLink>

          {showSku ? (
            <p className="mt-1 text-[10px] text-[var(--app-text-muted)]">
              {t('common.messages.sku')} - {item.variant.sku}
            </p>
          ) : null}

          <div className="mt-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                disabled={updating}
                className="flex h-8 w-8 items-center justify-center rounded border border-marco-border bg-white text-marco-black transition-colors hover:bg-marco-gray disabled:opacity-50 dark:border-white/15 dark:bg-zinc-800 dark:text-white"
                aria-label={t('common.ariaLabels.decreaseQuantity')}
              >
                <span aria-hidden>−</span>
              </button>
              <span className="min-w-[1.5rem] text-center text-sm font-semibold tabular-nums text-marco-black dark:text-white">
                {item.quantity}
              </span>
              <button
                type="button"
                onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                disabled={
                  updating ||
                  (item.variant.stock !== undefined && item.quantity >= item.variant.stock)
                }
                className="flex h-8 w-8 items-center justify-center rounded border border-marco-border bg-white text-marco-black transition-colors hover:bg-marco-gray disabled:opacity-50 dark:border-white/15 dark:bg-zinc-800 dark:text-white"
                aria-label={t('common.ariaLabels.increaseQuantity')}
              >
                <span aria-hidden>+</span>
              </button>
            </div>

            <span className="text-base font-bold tabular-nums text-marco-black dark:text-white">
              {formatMoneyInCurrency(
                cartLineSubtotal(item.price, item.quantity),
                amountCurrency,
                currency,
              )}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
