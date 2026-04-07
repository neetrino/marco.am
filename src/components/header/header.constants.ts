/** Default external target for “Reels” nav until CMS/social URLs are wired */
export const HEADER_REELS_EXTERNAL_HREF = 'https://www.instagram.com/reels/';

/**
 * Row 1 horizontal padding — Figma 111:4293 `px-[151px]` at max width.
 */
export const HEADER_FIGMA_PADDING_X_CLASS =
  'px-3 sm:px-5 md:px-7 lg:px-10 xl:px-16 2xl:px-24 min-[1800px]:px-[151px]';

/**
 * Row 2 horizontal padding — Figma 111:4273 `px-[150px]` at max width (even side inset).
 */
export const HEADER_FIGMA_ROW2_PADDING_X_CLASS =
  'px-3 sm:px-5 md:px-7 lg:px-10 xl:px-16 2xl:px-24 min-[1800px]:px-[150px]';

/** Top row vertical padding — Figma 111:4293 `py-[6px]` */
export const HEADER_FIGMA_PADDING_Y_CLASS = 'py-1.5';

/** Gap between logo / nav / social / contact — Figma 214:1052 `gap-[54px]` (desktop header row) */
export const HEADER_FIGMA_CLUSTER_GAP_CLASS = 'md:gap-x-[54px]';

/** Horizontal gap between primary nav links — Figma 111:4294 `gap-[45px]` (uniform between items) */
export const HEADER_FIGMA_NAV_LINK_GAP_CLASS = 'gap-x-[45px]';

/** Gap between phone and addresses — Figma 214:1051 `gap-[29px]` */
export const HEADER_FIGMA_CONTACT_CLUSTER_GAP_CLASS =
  'gap-x-2.5 md:gap-x-3 lg:gap-x-5 min-[1800px]:gap-x-[29px]';

/** Categories + search — Figma 214:1053 `gap-[25px]` */
export const HEADER_FIGMA_ROW2_LEFT_INNER_GAP_CLASS =
  'gap-x-2 sm:gap-x-3 md:gap-x-4 lg:gap-x-5 min-[1800px]:gap-x-[25px]';

/** Between (categories+search) and (locale+actions) — Figma 214:1055 `gap-[66px]` */
export const HEADER_FIGMA_ROW2_MAIN_GAP_CLASS =
  'gap-x-2.5 sm:gap-x-4 md:gap-x-6 lg:gap-x-8 xl:gap-x-10 min-[1800px]:gap-x-[66px]';

/** Locale + theme + profile + compare + wishlist + cart — Figma 214:1054 `gap-[23px]` */
export const HEADER_FIGMA_ROW2_RIGHT_INNER_GAP_CLASS =
  'gap-x-2 sm:gap-x-3 md:gap-x-4 lg:gap-x-5 min-[1800px]:gap-x-[23px]';

/** Search bar outer height — Figma 111:4274 outer `h-[56px]` */
export const HEADER_SEARCH_BAR_HEIGHT_CLASS = 'h-[56px]';

/** Gap between search icon and placeholder */
export const HEADER_SEARCH_ICON_TEXT_GAP_CLASS = 'gap-1.5';

/** Horizontal padding from frame edge to icon row */
export const HEADER_SEARCH_INPUT_PADDING_LEFT_CLASS = 'pl-5';

/** Yellow submit — Figma 111:4279 `w-[155px]` */
export const HEADER_SEARCH_SUBMIT_WIDTH_CLASS =
  'w-[120px] shrink-0 sm:w-[130px] md:w-[140px] min-[1800px]:w-[155px]';

/**
 * Yellow submit: left edge rounded into the gray track; right edge follows outer pill via form overflow clip.
 */
export const HEADER_SEARCH_SUBMIT_CLASS =
  'h-full min-h-0 shrink-0 overflow-clip rounded-l-full rounded-r-none bg-marco-yellow text-marco-black';

/** Language + currency pill — Figma 111:4306 `h-[48px]` */
export const HEADER_LOCALE_PILL_HEIGHT_CLASS = 'h-[48px]';

/** Full capsule radius */
export const HEADER_LOCALE_PILL_RADIUS_CLASS = 'rounded-[72px]';

/** Horizontal rhythm between globe, labels, icons */
export const HEADER_LOCALE_PILL_INNER_GAP_CLASS = 'gap-2.5 sm:gap-3';

/** Row 2 vertical padding — Figma 111:4273 `py-[14px]` */
export const HEADER_FIGMA_ROW2_PADDING_Y_CLASS = 'py-3.5';

/** Category trigger — Figma 111:4290 `w-[251px]` `h-[54px]` */
export const HEADER_CATEGORY_BUTTON_CLASS =
  'gap-2.5 rounded-[26px] px-5 py-2.5 text-sm font-normal md:h-[54px] md:w-[251px] md:justify-between md:px-[42px] md:py-0';

/** Toolbar icon hit targets — compact */
export const HEADER_TOOLBAR_ICON_BUTTON_CLASS = 'h-10 w-10';

/** Cart pill — compact */
export const HEADER_CART_BUTTON_CLASS = 'min-w-[108px] gap-1.5 rounded-[60px] px-4 py-2 text-sm font-bold';
