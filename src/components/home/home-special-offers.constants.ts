/**
 * Home «Special offers» strip — layout and Figma-aligned tokens.
 */

/** Horizontal gap between product cards in the carousel. */
export const SPECIAL_OFFERS_CARD_GAP_PX = 16;

/** Min width of each card column (carousel tile below lg — horizontal scroll). */
export const SPECIAL_OFFERS_CARD_MIN_WIDTH_PX = 260;

/** Product cards visible at once in the rail (lg+), aligned with Figma strip. */
export const SPECIAL_OFFERS_VISIBLE_COLUMNS = 4;

/** Portion of scroller width to move per arrow tap. */
export const SPECIAL_OFFERS_SCROLL_FRACTION = 0.85;

/** Section title (Montserrat Bold) — matches Figma scale. */
export const SPECIAL_OFFERS_TITLE_FONT_SIZE_CLAMP = 'clamp(22px, 4vw, 54px)';

/** Title tracking from Figma. */
export const SPECIAL_OFFERS_TITLE_LETTER_SPACING_PX = -0.6;

/** Space between heading row and card rail (Figma breathing room). */
export const SPECIAL_OFFERS_TITLE_TO_RAIL_GAP_PX = 48;

/** Card shell — Figma Product2 fill. */
export const SPECIAL_OFFERS_CARD_BG = '#f6f6f6';

/** Image well height inside special-offer card (Figma). */
export const SPECIAL_OFFERS_IMAGE_WELL_HEIGHT_PX = 248;

/** Top padding under card shell before image well (Figma ~17). */
export const SPECIAL_OFFERS_CARD_PADDING_TOP_PX = 17;

/** Vertical space between the product image well and the brand/title text block. */
export const SPECIAL_OFFERS_IMAGE_TO_TEXT_GAP_PX = 24;

/** Match Tailwind `lg` — fixed four-column rail uses pixel widths from ResizeObserver. */
export const SPECIAL_OFFERS_RAIL_LG_MIN_WIDTH_PX = 1024;

/**
 * Prev/next carousel controls — same compact pill as REELS (ratio ~1.28).
 */
export const SPECIAL_OFFERS_CAROUSEL_NAV_BUTTON_WIDTH_PX = 32;
export const SPECIAL_OFFERS_CAROUSEL_NAV_BUTTON_HEIGHT_PX = 25;

/** Inset prev/next controls from the section’s right edge (matches REELS). */
export const SPECIAL_OFFERS_CAROUSEL_NAV_INSET_RIGHT_PX = 32;

/** Dot pagination below the rail. */
export const SPECIAL_OFFERS_PAGINATION_DOT_SIZE_PX = 8;
export const SPECIAL_OFFERS_PAGINATION_DOT_GAP_PX = 10;
export const SPECIAL_OFFERS_RAIL_TO_PAGINATION_GAP_PX = 20;

/**
 * Brand line — Tailwind text classes (Figma reference).
 * Match first substring hit on `brandName.toLowerCase()`.
 */
const SPECIAL_OFFERS_BRAND_TEXT_CLASS_BY_KEY: Readonly<
  Record<string, string>
> = {
  samsung: 'text-[#354ae6]',
  apple: 'text-[#0f0f0f]',
  bosch: 'text-[#af1b1b]',
  lg: 'text-[#d51212]',
};

/**
 * @returns Tailwind classes for brand label color.
 */
export function getSpecialOfferBrandTextClass(
  brandName: string | null | undefined,
): string {
  if (!brandName) {
    return 'text-marco-black';
  }
  const n = brandName.toLowerCase();
  const keys = Object.keys(SPECIAL_OFFERS_BRAND_TEXT_CLASS_BY_KEY);
  for (const key of keys) {
    if (n.includes(key)) {
      return SPECIAL_OFFERS_BRAND_TEXT_CLASS_BY_KEY[key] ?? 'text-marco-black';
    }
  }
  return 'text-marco-black';
}
