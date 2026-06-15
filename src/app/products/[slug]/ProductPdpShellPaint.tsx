'use client';

import Image from 'next/image';

import { ProductImagePlaceholder } from '@/components/ProductImagePlaceholder';
import { formatCatalogPrice, getStoredCurrency, type CurrencyCode } from '@/lib/currency';
import { getProductText, t } from '@/lib/i18n';
import { getStoredLanguage } from '@/lib/language';
import { shouldBypassNextImageOptimizer } from '@/lib/utils/should-bypass-next-image-optimizer';

import { useProductImages } from './hooks/useProductImages';
import { ProductInfoPrimarySkeleton } from './ProductInfoPrimarySkeleton';
import type { Product } from './types';

type ProductPdpShellPaintProps = {
  shell: Product | null;
};

/**
 * Instant PDP paint from PLP/card shell — image, brand, title, price without network.
 */
export function ProductPdpShellPaint({ shell }: ProductPdpShellPaintProps) {
  const language = getStoredLanguage();
  const currency = getStoredCurrency();
  const images = useProductImages(shell);
  const heroImage = images[0] ?? null;
  const price = shell?.currentPrice ?? shell?.pricing?.currentPrice ?? 0;
  const oldPrice = shell?.oldPrice ?? shell?.pricing?.oldPrice ?? null;
  const hasDisplayPrice = Number.isFinite(price) && price > 0;

  if (!shell) {
    return (
      <div className="marco-header-container py-12">
        <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-[minmax(0,11fr)_minmax(0,9fr)]">
          <div className="mx-auto w-full max-w-[420px] md:mx-0 md:max-w-none md:flex-1">
            <div
              className="relative aspect-square w-full animate-pulse rounded-lg bg-gray-100 dark:bg-white/[0.06]"
              aria-hidden
            />
          </div>
          <ProductInfoPrimarySkeleton />
        </div>
      </div>
    );
  }

  const title = getProductText(language, shell.id, 'title') || shell.title;

  return (
    <div className="marco-header-container py-12">
      <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-[minmax(0,11fr)_minmax(0,9fr)]">
        <div className="mx-auto w-full max-w-[420px] md:mx-0 md:max-w-none md:flex-1">
          <div className="relative aspect-square overflow-hidden rounded-lg bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
            {heroImage ? (
              <Image
                src={heroImage}
                alt={title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 420px"
                priority
                fetchPriority="high"
                loading="eager"
                unoptimized={shouldBypassNextImageOptimizer(heroImage)}
              />
            ) : (
              <ProductImagePlaceholder
                className="h-full w-full"
                aria-label={t(language, 'common.messages.noImage')}
              />
            )}
          </div>
        </div>

        <div className="min-w-0">
          {shell.brand ? (
            <div className="mb-5">
              {shell.brand.logo ? (
                <div className="relative h-7 w-full max-w-[min(100%,140px)] shrink-0 overflow-hidden md:h-8 md:max-w-[min(100%,160px)]">
                  <Image
                    src={shell.brand.logo}
                    alt={shell.brand.name}
                    fill
                    className="object-contain object-left"
                    sizes="(max-width: 768px) 140px, 160px"
                    priority
                  />
                </div>
              ) : (
                <p className="text-sm text-gray-500">{shell.brand.name}</p>
              )}
            </div>
          ) : null}

          <h1 className="mb-5 text-2xl font-bold text-marco-black sm:text-3xl md:text-4xl">{title}</h1>

          <div className="mb-6">
            {hasDisplayPrice ? (
              <div className="flex flex-col gap-1">
                <p className="text-3xl font-bold text-marco-black">
                  {formatCatalogPrice(price, currency as CurrencyCode)}
                </p>
                {oldPrice != null && oldPrice > price ? (
                  <p className="mt-1 ml-px text-xl text-gray-500 line-through decoration-gray-400">
                    {formatCatalogPrice(oldPrice, currency as CurrencyCode)}
                  </p>
                ) : null}
              </div>
            ) : (
              <span className="inline-flex w-fit rounded-full bg-[#f4f4f4] px-3 py-1 text-sm font-semibold text-[#383838]">
                {t(language, 'products.noPrice.label')}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
