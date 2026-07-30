/** Allowed warranty durations for storefront badge (years). */
export const PRODUCT_WARRANTY_YEAR_OPTIONS = [1, 2, 3] as const;

export type ProductWarrantyYears = (typeof PRODUCT_WARRANTY_YEAR_OPTIONS)[number];

/** Figma warranty pill — slate shell (`1180:3483`, R63 G84 B102). */
export const PRODUCT_WARRANTY_BADGE_BG = '#3f5466';

/** Figma warranty pill — accent (`1180:3483`). */
export const PRODUCT_WARRANTY_BADGE_ACCENT = '#ffca03';

/** Figma warranty pill corner radius. */
export const PRODUCT_WARRANTY_BADGE_RADIUS_PX = 12;

/**
 * Figma warranty pill — «Տարի» / years suffix: 0.875rem / 0.9375rem, weight 400, #FFF.
 * Montserrat arm is applied on {@link ProductWarrantyBadge} root.
 */
export const PRODUCT_WARRANTY_SUFFIX_CLASSNAME =
  'text-[0.875rem] font-normal leading-[0.9375rem] uppercase text-white';

/**
 * Normalizes admin/API input to 1 | 2 | 3, or null when absent or "none".
 */
export function normalizeProductWarrantyYears(
  value: unknown,
): ProductWarrantyYears | null {
  if (value === null || value === undefined || value === '' || value === 'none') {
    return null;
  }
  const numeric = typeof value === 'string' ? Number.parseInt(value, 10) : value;
  if (numeric === 1 || numeric === 2 || numeric === 3) {
    return numeric;
  }
  return null;
}
