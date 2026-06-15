export type ProductCardBrandLogoSize = 'grid' | 'gridCompact' | 'list' | 'specialOffer';

export type ProductCardBrandLogoSizeConfig = {
  rowClassName: string;
  /** Fixed-height box for `Image` `fill` — avoids width/height attribute vs CSS mismatch warnings. */
  logoCellClassName: string;
  logoSizes: string;
  imageClassName: string;
  wordmarkClassName: string;
};

/**
 * Height-first logo sizing: every mark renders at the same visual height; width follows aspect ratio.
 */
export const PRODUCT_CARD_BRAND_LOGO_SIZES: Record<
  ProductCardBrandLogoSize,
  ProductCardBrandLogoSizeConfig
> = {
  grid: {
    rowClassName: 'flex min-h-7 max-w-[120px] items-center overflow-visible',
    logoCellClassName: 'relative h-7 w-full max-w-[120px] shrink-0',
    logoSizes: '120px',
    imageClassName: 'object-contain object-left origin-left',
    wordmarkClassName:
      'truncate text-sm font-semibold uppercase leading-none tracking-wide text-gray-500 dark:text-[#383838]',
  },
  gridCompact: {
    rowClassName: 'flex min-h-6 max-w-[96px] items-center overflow-visible',
    logoCellClassName: 'relative h-6 w-full max-w-[96px] shrink-0',
    logoSizes: '96px',
    imageClassName: 'object-contain object-left origin-left',
    wordmarkClassName:
      'truncate text-xs font-semibold uppercase leading-none tracking-wide text-gray-500 dark:text-[#383838]',
  },
  list: {
    rowClassName: 'flex min-h-7 max-w-[120px] items-center overflow-visible sm:min-h-8 sm:max-w-[132px]',
    logoCellClassName:
      'relative h-7 w-full max-w-[120px] shrink-0 sm:h-8 sm:max-w-[132px]',
    logoSizes: '(max-width: 640px) 120px, 132px',
    imageClassName: 'object-contain object-left origin-left',
    wordmarkClassName:
      'truncate text-sm font-semibold uppercase leading-none tracking-wide text-gray-500 dark:text-[#383838] sm:text-base',
  },
  specialOffer: {
    rowClassName: 'flex min-h-6 max-w-[96px] items-center overflow-visible md:min-h-7 md:max-w-[108px]',
    logoCellClassName:
      'relative h-6 w-full max-w-[96px] shrink-0 md:h-7 md:max-w-[108px]',
    logoSizes: '(max-width: 768px) 96px, 108px',
    imageClassName: 'object-contain object-left origin-left',
    wordmarkClassName:
      'truncate text-xs font-semibold uppercase leading-none tracking-wide text-gray-500 dark:text-[#383838] md:text-sm',
  },
};

/** @deprecated Use `PRODUCT_CARD_BRAND_LOGO_SIZES.grid.rowClassName` via `size="grid"`. */
export const PRODUCT_CARD_BRAND_LOGO_BOX_CLASS =
  PRODUCT_CARD_BRAND_LOGO_SIZES.grid.rowClassName;

/** @deprecated Use `size="gridCompact"`. */
export const PRODUCT_CARD_BRAND_LOGO_BOX_COMPACT_CLASS =
  PRODUCT_CARD_BRAND_LOGO_SIZES.gridCompact.rowClassName;

/** @deprecated Use `size="list"`. */
export const PRODUCT_CARD_BRAND_LOGO_BOX_LIST_CLASS =
  PRODUCT_CARD_BRAND_LOGO_SIZES.list.rowClassName;

/** @deprecated Use `size="specialOffer"`. */
export const PRODUCT_CARD_BRAND_LOGO_BOX_SPECIAL_OFFER_CLASS =
  PRODUCT_CARD_BRAND_LOGO_SIZES.specialOffer.rowClassName;
