/**
 * Home «Special offers» strip — layout and Figma-aligned tokens.
 */

/** Local JPEG — one «nature» photo for every tile when unified mode is on. */
export const SPECIAL_OFFERS_UNIFIED_NATURE_IMAGE_SRC =
  '/images/home/special-offers-unified-nature.jpg';

/**
 * When true, product thumbnails from the API are ignored and
 * {@link SPECIAL_OFFERS_UNIFIED_NATURE_IMAGE_SRC} is used instead (same look on every card).
 * On by default in development; production uses real images unless `NEXT_PUBLIC_SPECIAL_OFFERS_UNIFIED_IMAGE=1`.
 */
export const SPECIAL_OFFERS_USE_UNIFIED_NATURE_IMAGE =
  process.env.NODE_ENV !== 'production' ||
  process.env.NEXT_PUBLIC_SPECIAL_OFFERS_UNIFIED_IMAGE === '1';

/** Horizontal gap between product cards in the carousel (wider gap → slightly narrower slots, still 4-up). */
export const SPECIAL_OFFERS_CARD_GAP_PX = 24;

/** Product cards visible at once in the rail (lg+), aligned with Figma strip. */
export const SPECIAL_OFFERS_VISIBLE_COLUMNS = 4;

/**
 * Mobile (`max-md`): 2×2 grid per horizontal slide — four product cards per page.
 */
export const SPECIAL_OFFERS_MOBILE_GRID_PAGE_SIZE = 4;

/** Dots under the rail — three segments (same pattern as REELS). */
export const SPECIAL_OFFERS_MOBILE_PAGINATION_PAGE_COUNT = 3;

/** Horizontal gap between the two columns in the mobile 2×2 grid (tighter than rail for wider tiles). */
export const SPECIAL_OFFERS_MOBILE_GRID_COLUMN_GAP_PX = 12;

/** Vertical gap between the two rows in the mobile grid (px). */
export const SPECIAL_OFFERS_MOBILE_GRID_ROW_GAP_PX = 60;

/**
 * Bottom padding inside the horizontal scroller on mobile 2×2 slides — reserves space for the
 * floating cart below the card shell so the strip does not gain a vertical scroll (`overflow-y`).
 */
export const SPECIAL_OFFERS_MOBILE_GRID_SCROLLER_PADDING_BOTTOM_PX = 32;

/** Horizontal scroller bottom padding on `md+` (former `pb-1`). */
export const SPECIAL_OFFERS_SCROLLER_PADDING_BOTTOM_DESKTOP_PX = 4;

/** Portion of scroller width to move per arrow tap. */
export const SPECIAL_OFFERS_SCROLL_FRACTION = 0.85;

/** Section title (Montserrat Bold) — «Հատուկ առաջարկներ» / special offers heading. */
export const SPECIAL_OFFERS_TITLE_FONT_SIZE_CLAMP = 'clamp(17px, 3vw, 42px)';

/** Stacked mobile heading — larger type than `SPECIAL_OFFERS_TITLE_FONT_SIZE_CLAMP` minimum. */
export const SPECIAL_OFFERS_TITLE_FONT_SIZE_CLAMP_MOBILE =
  'clamp(22px, 5vw, 42px)';

/** Title tracking from Figma. */
export const SPECIAL_OFFERS_TITLE_LETTER_SPACING_PX = -0.6;

/** Space between heading row (yellow title line) and card rail. */
export const SPECIAL_OFFERS_TITLE_TO_RAIL_GAP_PX = 59;

/** Horizontal inset of the title block from the section content edge (px). */
export const SPECIAL_OFFERS_TITLE_INSET_LEFT_PX = 17;

/**
 * Yellow underline under the highlighted title segment — narrower than the word (`border-b-4` width).
 */
export const SPECIAL_OFFERS_TITLE_HIGHLIGHT_UNDERLINE_WIDTH_PERCENT = 48;

/** Same thickness as former `border-b-4`. */
export const SPECIAL_OFFERS_TITLE_HIGHLIGHT_UNDERLINE_HEIGHT_PX = 4;

/** Space between baseline and the yellow bar. */
export const SPECIAL_OFFERS_TITLE_HIGHLIGHT_UNDERLINE_GAP_PX = 12;

/** Card shell — Figma Product2 fill. */
export const SPECIAL_OFFERS_CARD_BG = '#f6f6f6';

/** Outer rounded corners of the special-offer card (`overflow-hidden` + bottom-right scallop). */
export const SPECIAL_OFFERS_CARD_SHELL_RADIUS_PX = 34;

/**
 * Card width cap — centered in the rail slot (`mx-auto`) so four slots stay aligned but tiles look narrower.
 * Mobile: same cap via `min(100%, …)` on the slide.
 */
export const SPECIAL_OFFERS_CARD_MAX_WIDTH_PX = 252;

/** Design reference: fixed card height. */
export const SPECIAL_OFFERS_CARD_HEIGHT_PX = 400;

/** Figma `101:3350` — warranty pill background. */
export const SPECIAL_OFFERS_WARRANTY_BADGE_BG = '#1e1e1e';

/** Figma `101:3350` — top line (e.g. «3 ՏԱՐԻ»). */
export const SPECIAL_OFFERS_WARRANTY_BADGE_ACCENT = '#FFCA03';

/** Figma `101:3350` — pill minimum size (scaled with compact card). */
export const SPECIAL_OFFERS_WARRANTY_BADGE_MIN_WIDTH_PX = 58;

/** Figma `101:3350` — pill minimum size (scaled with compact card). */
export const SPECIAL_OFFERS_WARRANTY_BADGE_MIN_HEIGHT_PX = 35;

/** Figma `101:3350` — corner radius (`rounded-[16px]`). */
export const SPECIAL_OFFERS_WARRANTY_BADGE_RADIUS_PX = 14;

/** Warranty pill inset from card top — matches former `top-3`. */
export const SPECIAL_OFFERS_WARRANTY_BADGE_TOP_INSET_PX = 12;

/** Warranty pill inset from card left — default rail / desktop (`left-3`). */
export const SPECIAL_OFFERS_WARRANTY_BADGE_LEFT_INSET_PX = 12;

/** Tighter left inset on mobile 2×2 grid (e.g. «3 տարի երաշխիք»). */
export const SPECIAL_OFFERS_WARRANTY_BADGE_LEFT_INSET_MOBILE_GRID_PX = 6;

/**
 * Bottom-right scallop — circle diameter. Larger circle = fuller, rounder arc at the corner.
 */
export const SPECIAL_OFFERS_CARD_CORNER_MASK_SIZE_PX = 96;

/**
 * Corner mask `translate(x%, y%)` — offset as percent of the circle’s own size (centers the bite).
 */
export const SPECIAL_OFFERS_CARD_CORNER_MASK_TRANSLATE_PERCENT = 24;

/**
 * Mobile (`max-md`): centered bottom notch — white “tab” (see reference `.card::after`).
 */
export const SPECIAL_OFFERS_CARD_MOBILE_NOTCH_WIDTH_PX = 76;

export const SPECIAL_OFFERS_CARD_MOBILE_NOTCH_HEIGHT_PX = 38;

/** Top radii of the notch (half-circle cap). */
export const SPECIAL_OFFERS_CARD_MOBILE_NOTCH_TOP_RADIUS_PX = 38;

/**
 * Corner mask fill — must match `HomeSpecialOffersSection` surface (`bg-white`).
 */
export const SPECIAL_OFFERS_CARD_CORNER_MASK_BG = '#ffffff';

/**
 * Wishlist, compare, discount pill — inset from card top-right (smaller or negative `right` = farther right).
 */
export const SPECIAL_OFFERS_ACTIONS_STACK_INSET_TOP_PX = 16;

export const SPECIAL_OFFERS_ACTIONS_STACK_INSET_RIGHT_PX = -8;

/**
 * Floating cart — inset from card inner bottom (`position: absolute` on the control).
 * Does not change card height.
 */
export const SPECIAL_OFFERS_CART_BUTTON_INSET_BOTTOM_PX = 5;

/** Floating cart — inset from card inner right (shifted toward the edge). */
export const SPECIAL_OFFERS_CART_BUTTON_INSET_RIGHT_PX = 4;

/** Mobile: cart centered on the notch — protrudes below the shell (reference `.card__button`). */
export const SPECIAL_OFFERS_CART_BUTTON_MOBILE_BOTTOM_PX = -22;

/** Floating add-to-cart circle (edge length). */
export const SPECIAL_OFFERS_CART_BUTTON_SIZE_PX = 48;

/** Inner Figma cart icon — scaled with `SPECIAL_OFFERS_CART_BUTTON_SIZE_PX`. */
export const SPECIAL_OFFERS_CART_FIGMA_ICON_WIDTH_PX = 19;

/** Inner Figma cart icon — scaled with `SPECIAL_OFFERS_CART_BUTTON_SIZE_PX`. */
export const SPECIAL_OFFERS_CART_FIGMA_ICON_HEIGHT_PX = 19;

/** Loading spinner inside the cart control. */
export const SPECIAL_OFFERS_CART_BUTTON_SPINNER_PX = 18;

/**
 * Width reserved beside price text — cart size + small gap so text does not overlap.
 */
export const SPECIAL_OFFERS_PRICE_ROW_END_PADDING_PX =
  SPECIAL_OFFERS_CART_BUTTON_SIZE_PX + 10;

/** Main price line — Montserrat Black on special-offer cards. */
export const SPECIAL_OFFERS_PRICE_FONT_SIZE_PX = 15;

/** Strikethrough compare-at price below main price. */
export const SPECIAL_OFFERS_OLD_PRICE_FONT_SIZE_PX = 10;

/** Line height for main price (px). */
export const SPECIAL_OFFERS_PRICE_LINE_HEIGHT_PX = 21;

/**
 * Lifts the price row (`mt-auto`) slightly off the card bottom — visual breathing room.
 */
export const SPECIAL_OFFERS_PRICE_BLOCK_LIFT_FROM_BOTTOM_PX = 33;

/** Image well height inside special-offer card (Figma). */
export const SPECIAL_OFFERS_IMAGE_WELL_HEIGHT_PX = 177;

/**
 * Image well corner radius — rounder inner frame (see `SPECIAL_OFFERS_CARD_SHELL_RADIUS_PX`).
 */
export const SPECIAL_OFFERS_IMAGE_WELL_RADIUS_PX = 19;

/** Horizontal optical nudge — shift product image left inside the well. */
export const SPECIAL_OFFERS_IMAGE_NUDGE_LEFT_PX = 4;

/**
 * Vertical offset for product image in the well (`translateY`; positive = down).
 */
export const SPECIAL_OFFERS_IMAGE_TRANSLATE_Y_PX = 7;

/** On mobile 2×2 cards — extra downward nudge for product photo (add to translateY). */
export const SPECIAL_OFFERS_IMAGE_TRANSLATE_Y_MOBILE_EXTRA_PX = 3;

/** Gallery pagination — flex gap between dot hit targets (often 0; use overlap for tighter pips). */
export const SPECIAL_OFFERS_GALLERY_DOTS_GAP_PX = 0;

/**
 * Pull dot buttons together so visible pips sit closer (flex gap applies to 20px hit boxes).
 */
export const SPECIAL_OFFERS_GALLERY_DOTS_OVERLAP_PX = 6;

/**
 * How far the gallery dot row sits below the image well bottom (CSS `bottom: -value`).
 */
export const SPECIAL_OFFERS_GALLERY_DOTS_BELOW_WELL_PX = 30;

/** On mobile 2×2 cards — gallery pips sit slightly lower under the image well. */
export const SPECIAL_OFFERS_GALLERY_DOTS_BELOW_WELL_MOBILE_EXTRA_PX = 3;

/** Pip diameter — visible circle size. */
export const SPECIAL_OFFERS_GALLERY_PIP_SIZE_PX = 8;

/** Minimum tap target — keeps pips readable while overlap tightens spacing. */
export const SPECIAL_OFFERS_GALLERY_DOT_HIT_PX = 20;

/** Inactive gallery pip fill. */
export const SPECIAL_OFFERS_GALLERY_PIP_INACTIVE = '#d1d5db';

/** Active gallery pip fill (matches warranty accent). */
export const SPECIAL_OFFERS_GALLERY_PIP_ACTIVE = '#FFCA03';

/** Top padding under card shell before image well (Figma ~17). */
export const SPECIAL_OFFERS_CARD_PADDING_TOP_PX = 8;

/** Inner horizontal padding — matches `px-4` on the card content column. */
export const SPECIAL_OFFERS_CARD_PADDING_X_PX = 16;

/**
 * Wishlist / compare / discount — `top` from the **outer** card wrapper (stack is outside `overflow:hidden`).
 */
export const SPECIAL_OFFERS_ACTIONS_STACK_TOP_FROM_CARD_OUTER_PX =
  SPECIAL_OFFERS_CARD_PADDING_TOP_PX + SPECIAL_OFFERS_ACTIONS_STACK_INSET_TOP_PX;

/**
 * Wishlist / compare / discount — `right` from the **outer** card wrapper’s right edge.
 */
export const SPECIAL_OFFERS_ACTIONS_STACK_RIGHT_FROM_CARD_OUTER_PX =
  SPECIAL_OFFERS_CARD_PADDING_X_PX + SPECIAL_OFFERS_ACTIONS_STACK_INSET_RIGHT_PX;

/**
 * Pull the actions stack past the card border so icons can sit outside the rounded shell.
 */
export const SPECIAL_OFFERS_ACTIONS_STACK_OUTSET_TOP_PX = 4;

export const SPECIAL_OFFERS_ACTIONS_STACK_OUTSET_RIGHT_PX = 22;

/** Positive = shift wishlist/compare/discount stack left (adds to CSS `right`). */
export const SPECIAL_OFFERS_ACTIONS_STACK_SHIFT_LEFT_PX = 3;

/**
 * Extra CSS `right` on mobile 2×2 grid — shifts heart / compare / discount column left
 * (under each other, same as desktop, but not flush to the card edge).
 */
export const SPECIAL_OFFERS_ACTIONS_STACK_MOBILE_GRID_EXTRA_RIGHT_PX = 14;

/** Vertical space between the product image well and the brand/title text block. */
export const SPECIAL_OFFERS_IMAGE_TO_TEXT_GAP_PX = 31;

/** On mobile 2×2 cards — shift brand/title/stars/price block down (translateY). */
export const SPECIAL_OFFERS_CARD_TEXT_SHIFT_DOWN_MOBILE_PX = 2;

/** Color variant swatches beside brand — Figma `305:2171` (Slide). */
export const SPECIAL_OFFERS_COLOR_SWATCH_SIZE_PX = 11;

/** Gap between swatch circles — slightly looser than 1px. */
export const SPECIAL_OFFERS_COLOR_SWATCH_GAP_PX = 2;

/** Padding-top on swatch column — aligns swatches below brand line (Figma `305:2171`). */
export const SPECIAL_OFFERS_COLOR_SWATCH_COLUMN_PADDING_TOP_PX = 12;

/**
 * Space between title block and rating row — Figma `101:3637` (`top-[81px]` vs title end ~64px).
 */
export const SPECIAL_OFFERS_TITLE_TO_STARS_MARGIN_TOP_PX = 18;

/** Outlined star size — Figma Product1 star frames `h-[13px]`. */
export const SPECIAL_OFFERS_STAR_SIZE_PX = 9;

/** Thin stroke for outlined stars (Figma dev). */
export const SPECIAL_OFFERS_STAR_STROKE_WIDTH = 1.25;

/** Horizontal gap between star icons. */
export const SPECIAL_OFFERS_STAR_GAP_PX = 12;

/** Gap between the star group and the review count `(n)`. */
export const SPECIAL_OFFERS_STAR_TO_REVIEW_COUNT_GAP_PX = 8;

/** Review count — Figma `101:3648` uses 14px (Product1). */
export const SPECIAL_OFFERS_REVIEW_COUNT_FONT_SIZE_PX = 14;

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
export const SPECIAL_OFFERS_PAGINATION_DOT_GAP_PX = 6;
export const SPECIAL_OFFERS_RAIL_TO_PAGINATION_GAP_PX = 42;

/** Extra space above dot row on `max-md` (2×2 grid + floating cart needs more air). */
export const SPECIAL_OFFERS_RAIL_TO_PAGINATION_GAP_MOBILE_PX = 58;

/** Space between dot row and «Տեսնել ավելին» CTA (px) — shared with featured strip. */
export const SPECIAL_OFFERS_PAGINATION_TO_CTA_GAP_PX = 30;

/**
 * «Հատուկ առաջարկներ» section only — tighter rail → dots → CTA stack than featured strip.
 */
export const SPECIAL_OFFERS_SECTION_RAIL_TO_PAGINATION_GAP_PX = 18;
export const SPECIAL_OFFERS_SECTION_RAIL_TO_PAGINATION_GAP_MOBILE_PX = 24;
export const SPECIAL_OFFERS_SECTION_PAGINATION_TO_CTA_GAP_PX = 24;

/**
 * Shared «See more» pill — slightly smaller than legacy min-w-[200px] px-10 py-4 text-base.
 */
export const SPECIAL_OFFERS_CTA_LINK_CLASS =
  'inline-flex min-w-[176px] items-center justify-center rounded-full bg-marco-black px-8 py-3 text-sm font-bold text-white transition-transform hover:-translate-y-0.5';

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
