/** @deprecated Oversize cells removed — all brands use standard logo cells. */
export function isBrandLogoCellOversizedSlug(_slug: string, _displayName?: string): boolean {
  return false;
}

/** Kept for import stability; unused while {@link isBrandLogoCellOversizedSlug} is always false. */
export const BRANDS_DIRECTORY_LOGO_OVERSIZED_CELL_HEIGHT_PX = 168;
export const BRANDS_DIRECTORY_LOGO_OVERSIZED_CELL_MAX_WIDTH_PX = 480;
export const BRANDS_DIRECTORY_CARD_OVERSIZED_MIN_HEIGHT_PX = 264;
export const HOME_BRANDS_RAIL_LOGO_OVERSIZED_CELL_HEIGHT_PX = 128;
export const HOME_BRANDS_RAIL_LOGO_OVERSIZED_CELL_MAX_WIDTH_PX = 320;
export const HOME_BRANDS_SLIDE_CARD_OVERSIZED_MIN_HEIGHT_PX = 184;
