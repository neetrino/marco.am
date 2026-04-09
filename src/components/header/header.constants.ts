/** Default external target for “Reels” nav until CMS/social URLs are wired */
export const HEADER_REELS_EXTERNAL_HREF = 'https://www.instagram.com/reels/';

/**
 * Shared width + horizontal padding for both header rows — `.marco-header-container` in `globals.css`.
 * Keeps nav and search aligned with the hero gutters; do not add separate px-* on those rows.
 */
export const HEADER_CONTAINER_CLASS = 'marco-header-container';

/**
 * Row 2 only — caps toolbar width so categories, search, and actions sit on a narrower band (centered).
 * Outer shell still uses `HEADER_CONTAINER_CLASS` for the same horizontal gutters as the rest of the site.
 */
export const HEADER_ROW2_CONTENT_MAX_WIDTH_CLASS =
  'mx-auto w-full max-w-[min(100%,900px)] sm:max-w-[min(100%,980px)] md:max-w-[min(100%,1020px)] lg:max-w-[min(100%,1080px)] xl:max-w-[min(100%,1140px)] min-[1800px]:max-w-[min(100%,1180px)]';

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

/** Categories + search — compact row-2 rhythm */
export const HEADER_FIGMA_ROW2_LEFT_INNER_GAP_CLASS =
  'gap-x-1 sm:gap-x-1.5 md:gap-x-2 lg:gap-x-2.5 min-[1800px]:gap-x-3';

/** Between (categories+search) and right toolbar */
export const HEADER_FIGMA_ROW2_MAIN_GAP_CLASS =
  'gap-x-1 sm:gap-x-1.5 md:gap-x-2 lg:gap-x-3 xl:gap-x-3.5 min-[1800px]:gap-x-5';

/**
 * Locale / theme / icons / cart — Figma 214:1054 `gap-[23px]`; reduced for denser toolbar.
 */
export const HEADER_FIGMA_ROW2_RIGHT_INNER_GAP_CLASS =
  'gap-x-0.5 md:gap-x-0.5 lg:gap-x-1 xl:gap-x-1.5 min-[1800px]:gap-x-2';

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

/** Yellow «Search» button — inset in `HEADER_ROW2_BAR_HEIGHT_CLASS` track */
export const HEADER_SEARCH_SUBMIT_HEIGHT_CLASS = 'h-9';

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

/** Compact language pill — matches narrowed row-2 toolbar */
export const HEADER_LOCALE_PILL_MIN_WIDTH_CLASS = 'min-w-[132px]';

/** Figma 111:4306 pill radius */
export const HEADER_LOCALE_PILL_RADIUS_CLASS = 'rounded-[80px]';

export const HEADER_LOCALE_PILL_PADDING_X_CLASS = 'px-3';

/** Tight rhythm for smaller pill */
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
