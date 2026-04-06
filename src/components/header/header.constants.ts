/** Default external target for “Reels” nav until CMS/social URLs are wired */
export const HEADER_REELS_EXTERNAL_HREF = 'https://www.instagram.com/reels/';

/**
 * Horizontal page padding — Figma 111:4293 uses `px-[151px]` on very wide frames.
 * Scales down on smaller desktops so layout matches “roomy” 80% zoom at 100% browser zoom.
 */
export const HEADER_FIGMA_PADDING_X_CLASS =
  'px-4 sm:px-6 md:px-8 lg:px-12 xl:px-20 2xl:px-28 min-[1800px]:px-[151px]';

/** Figma 111:4293 — frame padding `py-[6px]` */
export const HEADER_FIGMA_PADDING_Y_CLASS = 'py-[6px]';

/** Gap between logo / nav / social / contact — Figma 214:1052 `54px` at max width */
export const HEADER_FIGMA_CLUSTER_GAP_CLASS =
  'gap-x-3 sm:gap-x-4 md:gap-x-5 lg:gap-x-8 xl:gap-x-10 2xl:gap-x-12 min-[1800px]:gap-x-[54px]';

/** Horizontal gap between primary nav links — Figma 111:4294 `45px` at max width */
export const HEADER_FIGMA_NAV_LINK_GAP_CLASS =
  'gap-x-2 sm:gap-x-3 md:gap-x-4 lg:gap-x-6 xl:gap-x-8 2xl:gap-x-10 min-[1800px]:gap-x-[45px]';

/** Gap between phone and addresses — Figma 214:1051 `29px` */
export const HEADER_FIGMA_CONTACT_CLUSTER_GAP_CLASS =
  'gap-x-3 md:gap-x-4 lg:gap-x-6 min-[1800px]:gap-x-[29px]';

/** Second header row (categories + search + pill + actions) — aligns with cluster rhythm */
export const HEADER_FIGMA_ROW2_GAP_X_CLASS =
  'gap-x-3 sm:gap-x-4 md:gap-x-5 lg:gap-x-8 xl:gap-x-10 2xl:gap-x-12 min-[1800px]:gap-x-[54px]';

/** Figma 111:4274 — outer search frame `700×56`; yellow `111:4279` fills row height and shares the pill outline. */
export const HEADER_SEARCH_BAR_HEIGHT_CLASS = 'h-[56px]';

/** Inner track + submit pill height inside the 56px bar (`py-1` × 2 + 48px). */
export const HEADER_SEARCH_INNER_HEIGHT_CLASS = 'h-12';

/** Figma 111:4275 — gap between search icon and placeholder text (`gap-[8px]`) */
export const HEADER_SEARCH_ICON_TEXT_GAP_CLASS = 'gap-2';

/** Figma 111:4274 — horizontal padding from frame edge to icon row (`pl-[24px]`) */
export const HEADER_SEARCH_INPUT_PADDING_LEFT_CLASS = 'pl-6';

/** Figma 111:4279 — yellow submit width `w-[155px]` (same at all breakpoints) */
export const HEADER_SEARCH_SUBMIT_WIDTH_CLASS = 'w-[155px] shrink-0';

/**
 * Yellow submit: pill shape (rounded on both sides), inset within the 56px bar via row padding in Header.
 */
export const HEADER_SEARCH_SUBMIT_CLASS = `${HEADER_SEARCH_INNER_HEIGHT_CLASS} shrink-0 overflow-clip rounded-full bg-marco-yellow text-marco-black`;

/** Figma 111:4306 — language + currency pill (row 2, aligns with search bar outer height) */
export const HEADER_LOCALE_PILL_HEIGHT_CLASS = 'h-[56px]';

/** Figma 111:4306 — full capsule radius */
export const HEADER_LOCALE_PILL_RADIUS_CLASS = 'rounded-[80px]';

/** Figma 111:4306 — horizontal rhythm between globe, labels, icons */
export const HEADER_LOCALE_PILL_INNER_GAP_CLASS = 'gap-3 sm:gap-[13px]';
