/** Default external target for “Reels” nav until CMS/social URLs are wired */
export const HEADER_REELS_EXTERNAL_HREF = 'https://www.instagram.com/reels/';

/**
 * Shared width + horizontal padding for both header rows — `.marco-header-container` in `globals.css`.
 * Keeps nav and search aligned with the hero gutters; do not add separate px-* on those rows.
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

/** Gap between phone and addresses — tight on md, full when space allows */
export const HEADER_FIGMA_CONTACT_CLUSTER_GAP_CLASS =
  'gap-x-2 md:gap-x-2.5 lg:gap-x-4 xl:gap-x-5 2xl:gap-x-[29px]';

/** Categories + search — tighter than Figma 214:1053 `gap-[25px]` */
export const HEADER_FIGMA_ROW2_LEFT_INNER_GAP_CLASS =
  'gap-x-1.5 sm:gap-x-2 md:gap-x-3 lg:gap-x-3.5 min-[1800px]:gap-x-4';

/** Between (categories+search) and right toolbar — tighter than Figma 214:1055 `gap-[66px]` */
export const HEADER_FIGMA_ROW2_MAIN_GAP_CLASS =
  'gap-x-2 sm:gap-x-3 md:gap-x-4 lg:gap-x-5 xl:gap-x-6 min-[1800px]:gap-x-8';

/**
 * Locale / theme / icons / cart — Figma 214:1054 `gap-[23px]`; reduced for denser toolbar.
 */
export const HEADER_FIGMA_ROW2_RIGHT_INNER_GAP_CLASS =
  'gap-x-1 md:gap-x-1.5 lg:gap-x-2 xl:gap-x-2.5 min-[1800px]:gap-x-3';

/**
 * Profile + compare + wishlist — single flex row; only these three share this gap.
 */
export const HEADER_TOOLBAR_ICON_CLUSTER_CLASS =
  'flex shrink-0 flex-nowrap items-center gap-1';

/**
 * Categories bar + yellow search CTA — symmetric pill (same radius on left and right edges).
 */
export const HEADER_FIGMA_PILL_RADIUS_CLASS = 'rounded-[89px]';

/**
 * Row-2 navbar strip — one height for categories, search track, locale pill, toolbar icons, cart.
 */
export const HEADER_ROW2_BAR_HEIGHT_CLASS = 'h-11';

/**
 * Gray search track — matches `HEADER_ROW2_BAR_HEIGHT_CLASS`.
 */
export const HEADER_SEARCH_BAR_HEIGHT_CLASS = HEADER_ROW2_BAR_HEIGHT_CLASS;

/** Yellow «Search» button — inset in track (42px in 44px bar). */
export const HEADER_SEARCH_SUBMIT_HEIGHT_CLASS = 'h-[42px]';

/**
 * Search pill spans the flex slot between categories and the right toolbar (full width).
 */
export const HEADER_SEARCH_BAR_INNER_CLASS = 'w-full min-w-0';

/** Gap between search icon and placeholder — Figma 98:1370 `gap-[8px]` */
export const HEADER_SEARCH_ICON_TEXT_GAP_CLASS = 'gap-2';

/** Horizontal padding from track edge to icon — Figma 98:1370 `left-[24px]` */
export const HEADER_SEARCH_INPUT_PADDING_LEFT_CLASS = 'pl-6';

/** Figma 98:1423 — fixed width yellow CTA */
export const HEADER_SEARCH_SUBMIT_WIDTH_CLASS = 'w-[155px] max-w-[155px] shrink-0 px-4 sm:px-5';

/**
 * Yellow submit — centered in `HEADER_SEARCH_BAR_HEIGHT_CLASS` track; radius matches pill track.
 */
export const HEADER_SEARCH_SUBMIT_CLASS = `flex items-center justify-center self-center ${HEADER_SEARCH_SUBMIT_HEIGHT_CLASS} shrink-0 bg-marco-yellow text-sm font-semibold leading-normal text-marco-black transition-[filter] hover:brightness-95 active:brightness-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marco-black/15 ${HEADER_FIGMA_PILL_RADIUS_CLASS}`;

/** Language + currency pill — height matches `HEADER_ROW2_BAR_HEIGHT_CLASS` */
export const HEADER_LOCALE_PILL_HEIGHT_CLASS = HEADER_ROW2_BAR_HEIGHT_CLASS;

/** Slightly under Figma 212px — compact language pill */
export const HEADER_LOCALE_PILL_MIN_WIDTH_CLASS = 'min-w-[188px]';

/** Figma 111:4306 pill radius */
export const HEADER_LOCALE_PILL_RADIUS_CLASS = 'rounded-[80px]';

export const HEADER_LOCALE_PILL_PADDING_X_CLASS = 'px-5';

/** Tight rhythm for smaller pill */
export const HEADER_LOCALE_PILL_INNER_GAP_CLASS = 'gap-1';

/** Row 2 vertical padding — Figma 111:4273 `py-[14px]` */
export const HEADER_FIGMA_ROW2_PADDING_Y_CLASS = 'py-3.5';

/**
 * Category trigger — narrower than Figma 251px so the search bar gets more flex space; height matches `HEADER_ROW2_BAR_HEIGHT_CLASS`.
 */
export const HEADER_CATEGORY_BUTTON_CLASS = `gap-2.5 px-5 py-2.5 text-sm font-normal transition-[opacity,filter] hover:opacity-95 active:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 ${HEADER_FIGMA_PILL_RADIUS_CLASS} md:h-11 md:w-[200px] md:max-w-[200px] md:shrink-0 md:px-6 md:py-0 md:text-sm md:font-normal`;

/** Toolbar icon hit targets — same outer size as `HEADER_ROW2_BAR_HEIGHT_CLASS` */
export const HEADER_TOOLBAR_ICON_BUTTON_CLASS = 'h-11 w-11 shrink-0';

/** Cart pill — same height as row-2 strip; rounded-[68px], ~122px min */
export const HEADER_CART_BUTTON_CLASS =
  'flex h-11 min-w-[122px] items-center justify-center gap-[11px] rounded-[68px] pl-[25px] pr-5 text-sm font-bold leading-5 transition-[opacity,filter] hover:opacity-95 active:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/25';
