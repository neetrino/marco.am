/**
 * Home brand logo rail — Figma node 101:4108 («Brand slide»).
 */

/** Gap between brand logo cards in the grid. */
export const HOME_BRANDS_SLIDE_GAP_PX = 12;

/** Card shell height — extra vertical padding inside needs headroom. */
export const HOME_BRANDS_SLIDE_CARD_MIN_HEIGHT_PX = 152;

export const HOME_BRANDS_SLIDE_CORNER_RADIUS_PX = 20;

export const HOME_BRANDS_SLIDE_SURFACE_HEX = '#f6f6f6';

/**
 * Every logo is scaled inside this fixed box so mixed SVG/raster assets read at similar visual weight.
 */
export const HOME_BRANDS_RAIL_LOGO_CELL_HEIGHT_PX = 96;
export const HOME_BRANDS_RAIL_LOGO_CELL_MAX_WIDTH_PX = 264;

/** Equal padding on every brand card (logo scale no longer changes inset). */
export const HOME_BRANDS_SLIDE_CARD_PADDING_CLASS =
  'px-3 py-2 sm:px-4 sm:py-3';

export const HOME_BRANDS_RAIL_LOGO_IMAGE_CLASS =
  'max-h-full max-w-full object-contain';
