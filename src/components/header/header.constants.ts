/** Default external target for “Reels” nav until CMS/social URLs are wired */
export const HEADER_REELS_EXTERNAL_HREF = 'https://www.instagram.com/reels/';

/**
 * Shared width + horizontal padding for both header rows — `.marco-header-container` in `globals.css`.
 * Wide desktop (1367px+): same `max-w-7xl` column as hero (no extra 1920px / 135px inset).
 */
export const HEADER_CONTAINER_CLASS = 'marco-header-container';

/** Top row vertical padding — Figma 111:4293 `py-[6px]` */
export const HEADER_FIGMA_PADDING_Y_CLASS = 'py-1.5';

/** Gap between logo / nav / social / contact — scales down on smaller desktop to avoid horizontal scroll */
export const HEADER_FIGMA_CLUSTER_GAP_CLASS =
  'md:gap-x-4 lg:gap-x-6 xl:gap-x-10 2xl:gap-x-[54px]';

/** Horizontal gap between primary nav links — full Figma spacing only on wide screens */
export const HEADER_FIGMA_NAV_LINK_GAP_CLASS =
  'gap-x-3 md:gap-x-4 lg:gap-x-6 xl:gap-x-8 2xl:gap-x-[45px]';

/** Gap between phone and addresses — tight cluster */
export const HEADER_FIGMA_CONTACT_CLUSTER_GAP_CLASS =
  'gap-x-1 md:gap-x-1.5 lg:gap-x-2.5 xl:gap-x-3 2xl:gap-x-4';

/** Categories + search — 22px gap (row on `sm+`, column on narrow) */
export const HEADER_FIGMA_ROW2_LEFT_INNER_GAP_CLASS =
  'gap-y-[22px] gap-x-[22px] sm:gap-y-0';

/** Horizontal gap (px) between search cluster and right toolbar — row 2 when `md:flex-row`. */
export const HEADER_ROW2_SEARCH_TO_LOCALE_GAP_PX = 52;

/**
 * Between (categories+search) and right toolbar.
 * Must stay in sync with `HEADER_ROW2_SEARCH_TO_LOCALE_GAP_PX` (Tailwind JIT needs a static arbitrary value).
 */
export const HEADER_FIGMA_ROW2_MAIN_GAP_CLASS = 'md:gap-x-[52px]';

/**
 * Locale / theme / icons / cart — Figma 214:1054 `gap-[23px]`; reduced for denser toolbar.
 */
export const HEADER_FIGMA_ROW2_RIGHT_INNER_GAP_CLASS =
  'gap-x-0.5 md:gap-x-0.5 lg:gap-x-1 xl:gap-x-1.5 min-[1800px]:gap-x-2';

/**
 * Additional space between locale/currency pill and theme toggle (row-2 toolbar).
 */
export const HEADER_LOCALE_TO_THEME_MARGIN_CLASS =
  'ml-2 md:ml-2.5 lg:ml-3 xl:ml-3.5 min-[1800px]:ml-4';

/**
 * Profile + compare + wishlist — single flex row; only these three share this gap.
 */
export const HEADER_TOOLBAR_ICON_CLUSTER_CLASS =
  'flex shrink-0 flex-nowrap items-center gap-0.5';

/**
 * Categories bar + yellow search CTA — symmetric pill (same radius on left and right edges).
 */
export const HEADER_FIGMA_PILL_RADIUS_CLASS = 'rounded-[89px]';

/**
 * Row-2 navbar strip — one height for categories, search track, locale pill, toolbar icons, cart.
 */
export const HEADER_ROW2_BAR_HEIGHT_CLASS = 'h-10';

/**
 * Gray search track — matches `HEADER_ROW2_BAR_HEIGHT_CLASS`.
 */
export const HEADER_SEARCH_BAR_HEIGHT_CLASS = HEADER_ROW2_BAR_HEIGHT_CLASS;

/** Yellow «Search» button — same height as gray search track */
export const HEADER_SEARCH_SUBMIT_HEIGHT_CLASS = HEADER_ROW2_BAR_HEIGHT_CLASS;

/**
 * Search pill spans the flex slot between categories and the right toolbar (full width).
 */
export const HEADER_SEARCH_BAR_INNER_CLASS = 'w-full min-w-0';

/** Gap between search icon and placeholder */
export const HEADER_SEARCH_ICON_TEXT_GAP_CLASS = 'gap-1.5';

/** Horizontal padding from track edge to icon */
export const HEADER_SEARCH_INPUT_PADDING_LEFT_CLASS = 'pl-4';

/** Yellow CTA — narrower below lg so the input gains width; full width from lg upward */
export const HEADER_SEARCH_SUBMIT_WIDTH_CLASS =
  'w-[118px] max-w-[118px] shrink-0 px-2.5 sm:px-3 lg:w-[132px] lg:max-w-[132px] lg:px-3.5';

/**
 * Yellow submit — centered in `HEADER_SEARCH_BAR_HEIGHT_CLASS` track; radius matches pill track.
 */
export const HEADER_SEARCH_SUBMIT_CLASS = `flex items-center justify-center self-center ${HEADER_SEARCH_SUBMIT_HEIGHT_CLASS} shrink-0 bg-marco-yellow text-xs font-semibold leading-normal text-marco-black transition-[filter] hover:brightness-95 active:brightness-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marco-black/15 ${HEADER_FIGMA_PILL_RADIUS_CLASS}`;

/** Language + currency pill — height matches `HEADER_ROW2_BAR_HEIGHT_CLASS` */
export const HEADER_LOCALE_PILL_HEIGHT_CLASS = HEADER_ROW2_BAR_HEIGHT_CLASS;

/** Language + currency pill — compact width in row-2 toolbar */
export const HEADER_LOCALE_PILL_MIN_WIDTH_CLASS = 'min-w-[128px]';

/** Figma 111:4306 pill radius */
export const HEADER_LOCALE_PILL_RADIUS_CLASS = 'rounded-[80px]';

export const HEADER_LOCALE_PILL_PADDING_X_CLASS = 'px-3';

/** Tight rhythm between globe, labels, currency, chevron */
export const HEADER_LOCALE_PILL_INNER_GAP_CLASS = 'gap-1';

/** Row 2 vertical padding — space above/below the toolbar strip (controls unchanged) */
export const HEADER_FIGMA_ROW2_PADDING_Y_CLASS = 'py-2';

/**
 * Category trigger — fixed md+ width; height matches `HEADER_ROW2_BAR_HEIGHT_CLASS`.
 */
export const HEADER_CATEGORY_BUTTON_CLASS = `gap-1.5 px-3 py-2 text-xs font-normal transition-[opacity,filter] hover:opacity-95 active:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 ${HEADER_FIGMA_PILL_RADIUS_CLASS} md:h-10 md:w-[184px] md:max-w-[184px] md:shrink-0 md:px-4 md:py-0 md:text-xs md:font-medium`;

/** Toolbar icon hit targets — same outer size as `HEADER_ROW2_BAR_HEIGHT_CLASS` */
export const HEADER_TOOLBAR_ICON_BUTTON_CLASS = 'h-10 w-10 shrink-0';

/** Cart pill — same height as row-2 strip; wider pill for icon + price */
export const HEADER_CART_BUTTON_CLASS =
  'flex h-10 min-w-[124px] items-center justify-center gap-1.5 rounded-[68px] pl-4 pr-3.5 text-xs font-bold leading-tight transition-[opacity,filter] hover:opacity-95 active:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/25';

/**
 * Mobile header top row — round dark controls (Figma 314:2501 search, 314:2503 menu).
 * Compact: `p-2.5` (10px), inner glyph 24×24px (`h-6 w-6`); fill `#050401`.
 */
export const HEADER_MOBILE_HEADER_ROUND_CONTROL_CLASS =
  'flex shrink-0 items-center justify-center rounded-full bg-[#050401] p-2.5 text-white shadow-sm transition-[opacity,filter] hover:opacity-95 active:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marco-black/25';

/** Figma 314:2501 — mobile search FAB (same shell as {@link HEADER_MOBILE_HEADER_ROUND_CONTROL_CLASS}). */
export const HEADER_MOBILE_SEARCH_FAB_CLASS = HEADER_MOBILE_HEADER_ROUND_CONTROL_CLASS;
