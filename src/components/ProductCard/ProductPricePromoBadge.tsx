'use client';

import { useTranslation } from '@/lib/i18n-client';

interface ProductPricePromoBadgeProps {
  discountPercent?: number | null;
  isSpecialPrice?: boolean;
  isCompact?: boolean;
  className?: string;
}

/** Catalog / card promo label: «հատուկ գին» or «-N%». */
export function ProductPricePromoBadge({
  discountPercent,
  isSpecialPrice = false,
  isCompact = false,
  className = '',
}: ProductPricePromoBadgeProps) {
  const { t } = useTranslation();
  const sizeClass = isCompact ? 'text-[11px]' : 'text-sm';

  if (isSpecialPrice) {
    return (
      <span
        className={`rounded-full bg-blue-50 px-2 py-0.5 ${sizeClass} font-semibold leading-none text-blue-600 ${className}`}
      >
        {t('products.pricing.special_price')}
      </span>
    );
  }

  if (discountPercent && discountPercent > 0) {
    return (
      <span
        className={`rounded-full bg-blue-50 px-2 py-0.5 ${sizeClass} font-semibold leading-none text-blue-600 ${className}`}
      >
        -{discountPercent}%
      </span>
    );
  }

  return null;
}
