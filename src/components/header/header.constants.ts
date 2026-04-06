/** Default external target for “Reels” nav until CMS/social URLs are wired */
export const HEADER_REELS_EXTERNAL_HREF = 'https://www.instagram.com/reels/';

/**
 * Horizontal page padding — Figma 111:4293 uses `px-[151px]` on very wide frames.
 * Scales down on smaller desktops so layout matches “roomy” 80% zoom at 100% browser zoom.
 */
export const HEADER_FIGMA_PADDING_X_CLASS =
  'px-3 sm:px-5 md:px-7 lg:px-10 xl:px-16 2xl:px-24 min-[1800px]:px-[128px]';

/** Top row vertical padding — compact vs full Figma */
export const HEADER_FIGMA_PADDING_Y_CLASS = 'py-1';

/** Gap between logo / nav / social / contact — slightly tighter than Figma max */
export const HEADER_FIGMA_CLUSTER_GAP_CLASS =
  'gap-x-2.5 sm:gap-x-3 md:gap-x-4 lg:gap-x-6 xl:gap-x-8 2xl:gap-x-10 min-[1800px]:gap-x-[46px]';

/** Horizontal gap between primary nav links */
export const HEADER_FIGMA_NAV_LINK_GAP_CLASS =
  'gap-x-2 sm:gap-x-2.5 md:gap-x-3 lg:gap-x-5 xl:gap-x-7 2xl:gap-x-9 min-[1800px]:gap-x-[38px]';

/** Gap between phone and addresses */
export const HEADER_FIGMA_CONTACT_CLUSTER_GAP_CLASS =
  'gap-x-2.5 md:gap-x-3 lg:gap-x-5 min-[1800px]:gap-x-6';

/** Second header row (categories + search + pill + actions) */
export const HEADER_FIGMA_ROW2_GAP_X_CLASS =
  'gap-x-2.5 sm:gap-x-3 md:gap-x-4 lg:gap-x-6 xl:gap-x-8 2xl:gap-x-10 min-[1800px]:gap-x-[46px]';

/** Search bar outer height — compact */
export const HEADER_SEARCH_BAR_HEIGHT_CLASS = 'h-[52px]';

/** Gap between search icon and placeholder */
export const HEADER_SEARCH_ICON_TEXT_GAP_CLASS = 'gap-1.5';

/** Horizontal padding from frame edge to icon row */
export const HEADER_SEARCH_INPUT_PADDING_LEFT_CLASS = 'pl-5';

/** Yellow submit width — compact */
export const HEADER_SEARCH_SUBMIT_WIDTH_CLASS = 'w-[140px] shrink-0';

/**
 * Yellow submit: left edge rounded into the gray track; right edge follows outer pill via form overflow clip.
 */
export const HEADER_SEARCH_SUBMIT_CLASS =
  'h-full min-h-0 shrink-0 overflow-clip rounded-l-full rounded-r-none bg-marco-yellow text-marco-black';

/** Language + currency pill — compact, aligned with search bar */
export const HEADER_LOCALE_PILL_HEIGHT_CLASS = 'h-[52px]';

/** Full capsule radius */
export const HEADER_LOCALE_PILL_RADIUS_CLASS = 'rounded-[72px]';

/** Horizontal rhythm between globe, labels, icons */
export const HEADER_LOCALE_PILL_INNER_GAP_CLASS = 'gap-2.5 sm:gap-3';

/** Row 2 vertical padding — slightly tighter */
export const HEADER_FIGMA_ROW2_PADDING_Y_CLASS = 'py-2';

/** Category trigger — width / padding compact */
export const HEADER_CATEGORY_BUTTON_CLASS =
  'gap-2.5 rounded-[26px] px-5 py-2.5 text-sm font-normal md:w-[228px] md:justify-between md:px-6 md:py-0 md:h-[50px]';

/** Toolbar icon hit targets — compact */
export const HEADER_TOOLBAR_ICON_BUTTON_CLASS = 'h-10 w-10';

/** Cart pill — compact */
export const HEADER_CART_BUTTON_CLASS = 'min-w-[108px] gap-1.5 rounded-[60px] px-4 py-2 text-sm font-bold';
