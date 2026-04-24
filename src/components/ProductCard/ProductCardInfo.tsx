'use client';

import Link from 'next/link';
import { montserratArm } from '../../fonts/montserrat-arm';
import { formatPrice } from '../../lib/currency';
import { useTranslation } from '../../lib/i18n-client';
import { ProductColors } from './ProductColors';
import type { CurrencyCode } from '../../lib/currency';

interface ProductCardInfoProps {
  slug: string;
  title: string;
  brandName?: string | null;
  price: number;
  originalPrice?: number | null;
  compareAtPrice?: number | null;
  discountPercent?: number | null;
  currency: CurrencyCode;
  colors?: Array<{ value: string; imageUrl?: string | null; colors?: string[] | null }>;
  isCompact?: boolean;
}

/**
 * Component for displaying product information (title, brand, price, colors)
 */
export function ProductCardInfo({
  slug,
  title,
  brandName,
  price,
  originalPrice,
  compareAtPrice,
  discountPercent,
  currency,
  colors,
  isCompact = false,
}: ProductCardInfoProps) {
  const { t } = useTranslation();

  return (
    <div className={isCompact ? 'p-2.5' : 'p-4'}>
      <Link href={`/products/${slug}`} className="block">
        {/* Product Title */}
        <h3 className={`${isCompact ? 'text-base' : 'text-xl'} font-medium text-gray-900 ${isCompact ? 'mb-0.5' : 'mb-1'} line-clamp-2`}>
          {title}
        </h3>
        
        {/* Category - Using brand name as category or default */}
        <p className={`${isCompact ? 'text-sm' : 'text-lg'} text-gray-500 dark:text-[#050505] ${isCompact ? 'mb-1' : 'mb-2'}`}>
          {brandName || t('common.defaults.category')}
        </p>
      </Link>

      {/* Available Colors */}
      {colors && colors.length > 0 && (
        <ProductColors colors={colors} isCompact={isCompact} />
      )}

      {/* Price */}
      <div className={`mt-2 flex items-center justify-between ${isCompact ? 'gap-2' : 'gap-4'}`}>
        <div className="flex flex-col">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span
              className={`${montserratArm.className} ${
                isCompact ? 'text-[18px] leading-[24px]' : 'text-[20px] leading-[28px]'
              } font-black text-[#181111]`}
            >
              {formatPrice(price || 0, currency)}
            </span>
            {discountPercent && discountPercent > 0 ? (
              <span className={`rounded-full bg-blue-50 px-2 py-0.5 ${isCompact ? 'text-[11px]' : 'text-sm'} font-semibold leading-none text-blue-600`}>
                -{discountPercent}%
              </span>
            ) : null}
          </div>
          {(originalPrice && originalPrice > price) || 
           (compareAtPrice && compareAtPrice > price) ? (
            <span className={`${isCompact ? 'text-xs' : 'text-sm'} mt-1 font-medium text-gray-400 line-through decoration-gray-300`}>
              {formatPrice(
                (originalPrice && originalPrice > price) 
                  ? originalPrice 
                  : (compareAtPrice || 0), 
                currency
              )}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}




