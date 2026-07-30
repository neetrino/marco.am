/**
 * Featured products strip — Figma «ՆՈՐՈՒՅԹՆԵՐ» header (node 101:2818): Montserrat title + yellow bar + round nav.
 */

/**
 * Section top padding — larger `max-md` value adds space after «Հատուկ առաջարկներ» on mobile.
 */
export const FEATURED_SECTION_PADDING_TOP_CLASS = 'pt-12 md:pt-8';

/** Space below featured section (above footer / mobile bottom nav). */
export const FEATURED_SECTION_PADDING_BOTTOM_CLASS = 'pb-[21px] md:pb-[31px]';

/** Vertical breathing room around app + gradient banners (`md+` top nudged for tighter gap after brands). */
export const FEATURED_HOME_BANNERS_BLOCK_PADDING_Y_CLASS = 'pt-16 pb-2 md:pt-8 md:pb-10';

/** Title — slightly smaller than original Figma 54px cap. */
export const FEATURED_PRODUCTS_TITLE_FONT_SIZE_CLAMP = 'clamp(22px, 3.6vw, 40px)';

export const FEATURED_PRODUCTS_TITLE_LINE_HEIGHT = '1.02';

/** Vertical gap between glyphs and yellow bar. */
export const FEATURED_PRODUCTS_TITLE_TEXT_TO_BAR_GAP_PX = 8;

/** Bar thickness (Figma 4px). */
export const FEATURED_PRODUCTS_TITLE_BAR_THICKNESS_PX = 4;

/**
 * Yellow accent width as % of the title line box — shorter than full text (Figma-style stub).
 */
export const FEATURED_PRODUCTS_TITLE_BAR_WIDTH_PERCENT = 28;

/** Figma title tracking. */
export const FEATURED_PRODUCTS_TITLE_LETTER_SPACING_PX = -0.6;

/** Space below heading row before product grid. */
export const FEATURED_PRODUCTS_TITLE_TO_GRID_GAP_PX = 42;

/** Nudge «նորույթներ» heading right from the content edge (px). */
export const FEATURED_PRODUCTS_TITLE_INSET_LEFT_PX = 16;

/**
 * Mobile «Նորույթներ»: one horizontal snap page = 1 row × 2 columns (two cards).
 */
export const FEATURED_NEW_ARRIVALS_MOBILE_RAIL_CARDS_PER_PAGE = 2;

/** Column gap between the two mobile cards (matches special-offers mobile rail). */
export const FEATURED_NEW_ARRIVALS_MOBILE_ROW_COLUMN_GAP_PX = 12;

/**
 * Desktop «Նորույթներ»: one horizontal page = 1 row × 4 columns (matches special offers rail).
 */
export const FEATURED_PRODUCTS_DESKTOP_PAGE_SIZE = 4;

/**
 * «Նորույթներ» visible cards — one row of four on screen; weekly shuffle picks this many from the pool.
 */
export const FEATURED_PRODUCTS_VISIBLE_COUNT = 8;

/** Max desktop horizontal pages (dots + scroll segments) — two rows of four when eight products. */
export const FEATURED_PRODUCTS_FOOTER_DOT_COUNT_DESKTOP = 2;
