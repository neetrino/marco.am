'use client';

import { montserratArm } from '@/fonts/montserrat-arm';
import { useTranslation } from '@/lib/i18n-client';
import {
  PRODUCT_WARRANTY_BADGE_ACCENT,
  PRODUCT_WARRANTY_BADGE_BG,
  PRODUCT_WARRANTY_BADGE_RADIUS_PX,
  PRODUCT_WARRANTY_SUFFIX_CLASSNAME,
  type ProductWarrantyYears,
} from '@/lib/constants/product-warranty';

type ProductWarrantyBadgeSize = 'catalog' | 'promo';

interface ProductWarrantyBadgeProps {
  years: ProductWarrantyYears;
  size?: ProductWarrantyBadgeSize;
  className?: string;
}

const SIZE_STYLES: Record<
  ProductWarrantyBadgeSize,
  { number: string; label: string; minWidth: number }
> = {
  catalog: {
    number: 'text-[22px] leading-none',
    label: 'text-[10px] leading-[15px]',
    minWidth: 58,
  },
  promo: {
    number: 'text-[28px] leading-none md:text-[32px]',
    label: 'text-[10px] leading-[15px] md:text-[11px]',
    minWidth: 64,
  },
};

/**
 * Figma MARCO warranty pill (`1180:3483`) — year count + «years» row, yellow «warranty» strip.
 */
export function ProductWarrantyBadge({
  years,
  size = 'catalog',
  className = '',
}: ProductWarrantyBadgeProps) {
  const { t } = useTranslation();
  const styles = SIZE_STYLES[size];

  return (
    <div
      className={`${montserratArm.className} pointer-events-none flex flex-col overflow-hidden text-center not-italic ${className}`}
      style={{
        minWidth: styles.minWidth,
        borderRadius: PRODUCT_WARRANTY_BADGE_RADIUS_PX,
        backgroundColor: PRODUCT_WARRANTY_BADGE_BG,
      }}
      aria-label={t('products.warranty.badge_aria').replace('{years}', String(years))}
    >
      <div className="flex items-end justify-center gap-0.5 px-2 pb-1 pt-1.5">
        <span
          className={`font-bold uppercase ${styles.number}`}
          style={{ color: PRODUCT_WARRANTY_BADGE_ACCENT }}
        >
          {years}
        </span>
        <span className={PRODUCT_WARRANTY_SUFFIX_CLASSNAME}>
          {t('products.warranty.years_suffix')}
        </span>
      </div>
      <div
        className="px-2 py-0.5"
        style={{ backgroundColor: PRODUCT_WARRANTY_BADGE_ACCENT }}
      >
        <span
          className={`block font-bold uppercase ${styles.label}`}
          style={{ color: PRODUCT_WARRANTY_BADGE_BG }}
        >
          {t('products.warranty.label')}
        </span>
      </div>
    </div>
  );
}
