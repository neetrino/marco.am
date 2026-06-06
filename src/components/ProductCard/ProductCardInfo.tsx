'use client';

import type { ProductListingBrand } from '@/lib/types/product-listing-brand';
import { ProductPdpPrefetchLink } from '../ProductPdpPrefetchLink';
import { montserratArm } from '../../fonts/montserrat-arm';
import { formatCatalogPrice, type CurrencyCode } from '../../lib/currency';
import { useTranslation } from '../../lib/i18n-client';
import { ProductCardBrandMark } from './ProductCardBrandMark';
import { ProductColors } from './ProductColors';
import { ProductPricePromoBadge } from './ProductPricePromoBadge';

interface ProductCardInfoProps {
  slug: string;
  title: string;
  brand: ProductListingBrand | null;
  price: number;
  originalPrice?: number | null;
  compareAtPrice?: number | null;
  discountPercent?: number | null;
  isSpecialPrice?: boolean;
  currency: CurrencyCode;
  colors?: Array<{ value: string; imageUrl?: string | null; colors?: string[] | null }>;
  isCompact?: boolean;
  /**
   * When true, title/brand are not wrapped in PDP link (parent provides navigation).
   */
  omitPdpLink?: boolean;
}

/**
 * Component for displaying product information (title, brand, price, colors)
 */
export function ProductCardInfo({
  slug,
  title,
  brand,
  price,
  originalPrice,
  compareAtPrice,
  discountPercent,
  isSpecialPrice = false,
  currency,
  colors,
  isCompact = false,
  omitPdpLink = false,
}: ProductCardInfoProps) {
  const { t } = useTranslation();
  const hasDisplayPrice = price > 0;

  const brandRow =
    brand != null ? (
      <div className={isCompact ? 'mb-1' : 'mb-2'}>
        <ProductCardBrandMark
          name={brand.name}
          slug={brand.slug}
          logoUrl={brand.logoUrl}
          size={isCompact ? 'gridCompact' : 'grid'}
        />
      </div>
    ) : (
      <p
        className={`${isCompact ? 'text-sm' : 'text-lg'} text-gray-500 dark:text-[#383838] ${isCompact ? 'mb-1' : 'mb-2'}`}
      >
        {t('common.defaults.category')}
      </p>
    );

  const titleBlock = (
    <>
      <h3
        className={`${isCompact ? 'text-base' : 'text-xl'} font-medium text-gray-900 ${isCompact ? 'mb-0.5' : 'mb-1'} line-clamp-2`}
      >
        {title}
      </h3>
      {brandRow}
    </>
  );

  return (
    <div className={isCompact ? 'p-2.5' : 'p-4'}>
      {omitPdpLink ? (
        titleBlock
      ) : (
        <ProductPdpPrefetchLink href={`/products/${slug}`} productSlug={slug} className="block">
          {titleBlock}
        </ProductPdpPrefetchLink>
      )}

      {colors && colors.length > 0 && (
        <ProductColors colors={colors} isCompact={isCompact} />
      )}

      {hasDisplayPrice ? (
        <div className={`mt-2 flex items-center justify-between ${isCompact ? 'gap-2' : 'gap-4'}`}>
          <div className="flex flex-col">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span
                className={`${montserratArm.className} ${
                  isCompact ? 'text-[22px] leading-[30px]' : 'text-[24px] leading-[32px]'
                } font-black text-[#181111]`}
              >
                {formatCatalogPrice(price, currency)}
              </span>
              <ProductPricePromoBadge
                discountPercent={discountPercent}
                isSpecialPrice={isSpecialPrice}
                isCompact={isCompact}
              />
            </div>
            {(originalPrice && originalPrice > price) || (compareAtPrice && compareAtPrice > price) ? (
              <span
                className={`${isCompact ? 'text-xs' : 'text-sm'} mt-1 font-medium text-gray-400 line-through decoration-gray-300`}
              >
                {formatCatalogPrice(
                  originalPrice && originalPrice > price ? originalPrice : (compareAtPrice || 0),
                  currency,
                )}
              </span>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="mt-2">
          <span className="inline-flex rounded-full bg-[#f4f4f4] px-3 py-1 text-xs font-semibold text-[#383838]">
            {t('products.noPrice.label')}
          </span>
        </div>
      )}
    </div>
  );
}
