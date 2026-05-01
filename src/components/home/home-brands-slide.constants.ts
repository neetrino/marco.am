/**
 * Home brand logo rail — Figma node 101:4108 («Brand slide»).
 */

/** Gap between brand logo cards in the grid. */
export const HOME_BRANDS_SLIDE_GAP_PX = 12;

/** Card shell height — extra vertical padding inside needs headroom. */
export const HOME_BRANDS_SLIDE_CARD_MIN_HEIGHT_PX = 96;

export const HOME_BRANDS_SLIDE_CORNER_RADIUS_PX = 20;

export const HOME_BRANDS_SLIDE_SURFACE_HEX = '#f6f6f6';

/** Admin/API hint — rail UI uses a single uniform logo cell for all entries. */
export type HomeBrandLogoScale = 'default' | 'large';

export type HomeBrandSlideEntry = {
  id: string;
  src: string;
  width: number;
  height: number;
  alt: string;
  logoScale?: HomeBrandLogoScale;
};

/**
 * Every logo is scaled inside this fixed box so mixed SVG/raster assets read at similar visual weight.
 */
export const HOME_BRANDS_RAIL_LOGO_CELL_HEIGHT_PX = 56;
export const HOME_BRANDS_RAIL_LOGO_CELL_MAX_WIDTH_PX = 152;

/** Equal padding on every brand card (logo scale no longer changes inset). */
export const HOME_BRANDS_SLIDE_CARD_PADDING_CLASS =
  'px-3 py-3 sm:px-4 sm:py-3.5';

export const HOME_BRANDS_RAIL_LOGO_IMAGE_CLASS =
  'max-h-full max-w-full object-contain';

/** Brand logo assets under `public/assets/brands/`. */
export const HOME_BRAND_SLIDE_ENTRIES: readonly HomeBrandSlideEntry[] = [
  {
    id: 'hisense',
    src: '/assets/brands/hisense.svg',
    width: 487,
    height: 78,
    alt: 'Hisense',
  },
  {
    id: 'samsung',
    src: '/assets/brands/samsung.svg',
    width: 422,
    height: 140,
    alt: 'Samsung',
    logoScale: 'large',
  },
  {
    id: 'lg',
    src: '/assets/brands/lg-figma.png',
    width: 351,
    height: 161,
    alt: 'LG',
    logoScale: 'large',
  },
  {
    id: 'panasonic',
    src: '/assets/brands/panasonic-figma.png',
    width: 495,
    height: 79,
    alt: 'Panasonic',
  },
  {
    id: 'toshiba',
    src: '/assets/brands/toshiba.svg',
    width: 800,
    height: 122,
    alt: 'TOSHIBA',
  },
  {
    id: 'midea',
    src: '/assets/brands/midea.svg',
    width: 114,
    height: 44,
    alt: 'MIDEA',
    logoScale: 'large',
  },
  {
    id: 'braun',
    src: '/assets/brands/braun.svg',
    width: 399,
    height: 169,
    alt: 'BRAUN',
    logoScale: 'large',
  },
  {
    id: 'bosch',
    src: '/assets/brands/bosch.svg',
    width: 500,
    height: 114,
    alt: 'BOSCH',
  },
];
