/**
 * Some bundled brand files have large transparent margins; only this brand gets a larger logo cell.
 */
const OVERSIZED_LOGO_CELL_SLUG = 'geepas';

export function isBrandLogoCellOversizedSlug(slug: string, displayName?: string): boolean {
  if (slug.trim().toLowerCase() === OVERSIZED_LOGO_CELL_SLUG) {
    return true;
  }
  const n = displayName?.trim().toLowerCase();
  return n === OVERSIZED_LOGO_CELL_SLUG;
}

/** `/brands` — larger logo box only for {@link OVERSIZED_LOGO_CELL_SLUG}. */
export const BRANDS_DIRECTORY_LOGO_OVERSIZED_CELL_HEIGHT_PX = 168;

export const BRANDS_DIRECTORY_LOGO_OVERSIZED_CELL_MAX_WIDTH_PX = 480;

export const BRANDS_DIRECTORY_CARD_OVERSIZED_MIN_HEIGHT_PX = 264;

/** Home brand rail — same slug; bump kept moderate so 4-across still fits. */
export const HOME_BRANDS_RAIL_LOGO_OVERSIZED_CELL_HEIGHT_PX = 128;

export const HOME_BRANDS_RAIL_LOGO_OVERSIZED_CELL_MAX_WIDTH_PX = 320;

export const HOME_BRANDS_SLIDE_CARD_OVERSIZED_MIN_HEIGHT_PX = 184;
