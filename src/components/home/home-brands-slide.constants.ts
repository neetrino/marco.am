/**
 * Home brand logo rail — Figma node 101:4108 («Brand slide»).
 */

/** Gap between brand logo cards in the grid. */
export const HOME_BRANDS_SLIDE_GAP_PX = 12;

/** Card shell height — extra vertical padding inside needs headroom. */
export const HOME_BRANDS_SLIDE_CARD_MIN_HEIGHT_PX = 88;

export const HOME_BRANDS_SLIDE_CORNER_RADIUS_PX = 20;

export const HOME_BRANDS_SLIDE_SURFACE_HEX = '#f6f6f6';

/** Larger logo inside the same card shell (Hisense / Panasonic stay default). */
export type HomeBrandLogoScale = 'default' | 'large';

export type HomeBrandSlideEntry = {
  id: string;
  src: string;
  width: number;
  height: number;
  alt: string;
  logoScale?: HomeBrandLogoScale;
};

/** Shared Tailwind for logo `<Image>` — card `minHeight` unchanged. */
export const HOME_BRAND_LOGO_CLASS_DEFAULT =
  'h-auto max-h-5 w-auto max-w-full object-contain sm:max-h-6 md:max-h-7';

/** Samsung / LG — larger glyph; card shell (`minHeight`, padding) unchanged. */
export const HOME_BRAND_LOGO_CLASS_LARGE =
  'h-auto max-h-11 w-auto max-w-full object-contain sm:max-h-12 md:max-h-14';

/** Raster exports from Figma (PNG); paths under `public/assets/brands/`. */
export const HOME_BRAND_SLIDE_ENTRIES: readonly HomeBrandSlideEntry[] = [
  {
    id: 'hisense',
    src: '/assets/brands/hisense.png',
    width: 487,
    height: 78,
    alt: 'Hisense',
  },
  {
    id: 'samsung',
    src: '/assets/brands/samsung.png',
    width: 422,
    height: 140,
    alt: 'Samsung',
    logoScale: 'large',
  },
  {
    id: 'lg',
    src: '/assets/brands/lg.png',
    width: 351,
    height: 161,
    alt: 'LG',
    logoScale: 'large',
  },
  {
    id: 'panasonic',
    src: '/assets/brands/panasonic.png',
    width: 495,
    height: 79,
    alt: 'Panasonic',
  },
];
