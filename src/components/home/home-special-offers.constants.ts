/**
 * Home «Special offers» strip — layout and Figma-aligned tokens.
 */

/** Horizontal gap between product cards in the carousel. */
export const SPECIAL_OFFERS_CARD_GAP_PX = 16;

/** Min width of each card column (carousel tile). */
export const SPECIAL_OFFERS_CARD_MIN_WIDTH_PX = 260;

/** Portion of scroller width to move per arrow tap. */
export const SPECIAL_OFFERS_SCROLL_FRACTION = 0.85;

/** Section title (Montserrat Bold) — matches Figma scale. */
export const SPECIAL_OFFERS_TITLE_FONT_SIZE_CLAMP = 'clamp(22px, 4vw, 54px)';

/** Title tracking from Figma. */
export const SPECIAL_OFFERS_TITLE_LETTER_SPACING_PX = -0.6;

/** Space between heading row and card rail. */
export const SPECIAL_OFFERS_TITLE_TO_RAIL_GAP_PX = 24;

/** Prev/next control sizing (circular, Figma-aligned). */
export const SPECIAL_OFFERS_NAV_BUTTON_PX = 40;

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
