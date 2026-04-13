/**
 * Home «Special offers» strip — layout and Figma-aligned tokens.
 */

/** Horizontal gap between product cards in the carousel. */
export const SPECIAL_OFFERS_CARD_GAP_PX = 16;

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

/** Design reference: max card width (carousel slot may be narrower on lg). */
export const SPECIAL_OFFERS_CARD_MAX_WIDTH_PX = 360;

/** Design reference: fixed card height. */
export const SPECIAL_OFFERS_CARD_HEIGHT_PX = 480;

/**
 * Bottom-right scallop — circle diameter. Larger circle = fuller, rounder arc at the corner.
 */
export const SPECIAL_OFFERS_CARD_CORNER_MASK_SIZE_PX = 112;

/**
 * Corner mask `translate(x%, y%)` — offset as percent of the circle’s own size (centers the bite).
 */
export const SPECIAL_OFFERS_CARD_CORNER_MASK_TRANSLATE_PERCENT = 25;

/**
 * Corner mask fill — must match `HomeSpecialOffersSection` surface (`bg-white`).
 */
export const SPECIAL_OFFERS_CARD_CORNER_MASK_BG = '#ffffff';

/**
 * Floating cart — inset from card inner bottom (`position: absolute` on the control).
 * Does not change card height.
 */
export const SPECIAL_OFFERS_CART_BUTTON_INSET_BOTTOM_PX = 1;

/** Floating cart — inset from card inner right (shifted toward the edge). */
export const SPECIAL_OFFERS_CART_BUTTON_INSET_RIGHT_PX = 1;

/** Floating add-to-cart circle (edge length). */
export const SPECIAL_OFFERS_CART_BUTTON_SIZE_PX = 58;

/** Inner Figma cart icon — scaled with `SPECIAL_OFFERS_CART_BUTTON_SIZE_PX`. */
export const SPECIAL_OFFERS_CART_FIGMA_ICON_WIDTH_PX = 24;

/** Inner Figma cart icon — scaled with `SPECIAL_OFFERS_CART_BUTTON_SIZE_PX`. */
export const SPECIAL_OFFERS_CART_FIGMA_ICON_HEIGHT_PX = 24;

/** Loading spinner inside the cart control. */
export const SPECIAL_OFFERS_CART_BUTTON_SPINNER_PX = 22;

/**
 * Width reserved beside price text — cart size + small gap so text does not overlap.
 */
export const SPECIAL_OFFERS_PRICE_ROW_END_PADDING_PX =
  SPECIAL_OFFERS_CART_BUTTON_SIZE_PX + 10;

/** Image well height inside special-offer card (Figma). */
export const SPECIAL_OFFERS_IMAGE_WELL_HEIGHT_PX = 212;

/**
 * Image well corner radius — rounder inner frame (card shell uses 32px; was `rounded-lg` ~8px).
 */
export const SPECIAL_OFFERS_IMAGE_WELL_RADIUS_PX = 24;

/** Top padding under card shell before image well (Figma ~17). */
export const SPECIAL_OFFERS_CARD_PADDING_TOP_PX = 8;

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
