/**
 * Row-2 compact toolbar (narrow categories pill, tight search pill, etc.) from `md` through this width — includes iPad Pro 12.9″ landscape (~1366px). Full Figma desktop row-2 from 1367px.
 * Tailwind: `md:max-[1366px]:…` / `min-[1367px]:…` (keep literals static for JIT).
 */
export const HEADER_TABLET_ROW2_MAX_WIDTH_PX = 1366;

/**
 * Primary nav row switches to the compact (hamburger) top bar at or below this width — e.g. iPad mini portrait (~744px) and tight tablets before the bar overlaps.
 */
export const HEADER_COMPACT_PRIMARY_NAV_MAX_WIDTH_PX = 820;

/**
 * Shared width + horizontal padding for both header rows — `.marco-header-container` in `globals.css`.
 * Wide desktop (1367px+): same `max-w-7xl` column as hero (no extra 1920px / 135px inset).
 */
export const HEADER_CONTAINER_CLASS = 'marco-header-container';

/** Top row vertical padding — same as row 2 so both header stripes match height */
export const HEADER_FIGMA_PADDING_Y_CLASS = 'py-2';

/**
 * Gap between main cluster and contact block (row 1).
 * Slightly tighter so a larger phone↔addresses gap fits without horizontal overflow.
 */
export const HEADER_FIGMA_CLUSTER_GAP_CLASS = 'gap-x-2';

/** Space from MARCO logo to first primary nav link (row 1) */
export const HEADER_LOGO_TO_NAV_GAP_CLASS = 'ml-[54px]';

/** Horizontal gap between primary nav links — fixed (45px) */
export const HEADER_FIGMA_NAV_LINK_GAP_CLASS = 'gap-x-[45px]';

/** Space from last primary nav link (e.g. Reels) to social icons (row 1) */
export const HEADER_NAV_TO_SOCIAL_GAP_CLASS = 'ml-[54px]';

/** Gap between phone block and addresses block (row 1) — Figma 214:1051 */
export const HEADER_FIGMA_CONTACT_CLUSTER_GAP_CLASS = 'gap-x-[29px]';

/** Handset icon ↔ phone number (tighter than Figma spec — UX) */
export const HEADER_FIGMA_CONTACT_PHONE_ICON_TEXT_GAP_CLASS = 'gap-2';

/** Pin icon ↔ address label (matches phone row tightness) */
export const HEADER_FIGMA_CONTACT_ADDRESS_ICON_TEXT_GAP_CLASS = 'gap-2';

/** Categories + search — 22px gap (row on `sm+`, column on narrow); tighter between categories and search on tablet (iPad / iPad Pro) */
export const HEADER_FIGMA_ROW2_LEFT_INNER_GAP_CLASS =
  'gap-y-[22px] gap-x-[22px] sm:gap-y-0 md:max-[1366px]:gap-x-3 min-[1367px]:gap-x-[22px]';

/** Horizontal gap (px) between search cluster and right toolbar — row 2 when `md:flex-row`. */
export const HEADER_ROW2_SEARCH_TO_LOCALE_GAP_PX = 52;

/**
 * Between (categories+search) and right toolbar.
 * Tablet (through iPad Pro landscape): slightly looser than 16px so search ↔ theme breathes; wide desktop: Figma 52px.
 * Must stay in sync with `HEADER_ROW2_SEARCH_TO_LOCALE_GAP_PX` (Tailwind JIT needs a static arbitrary value).
 */
export const HEADER_FIGMA_ROW2_MAIN_GAP_CLASS = 'md:max-[1366px]:gap-x-5 min-[1367px]:gap-x-[52px]';

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
 * Search row-2 pill radius — full Figma oval on wide desktop; slightly smaller radius on tablet (iPad / iPad Pro).
 */
export const HEADER_SEARCH_FORM_RADIUS_CLASS =
  `${HEADER_FIGMA_PILL_RADIUS_CLASS} md:max-[1366px]:rounded-[64px]`;

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
 * Row-2 «tablet» density: viewport ≤ {@link HEADER_TABLET_ROW2_MAX_WIDTH_PX}, or **any width** on iPadOS
 * (so iPad Pro in wide split / Stage Manager still matches iPad, not the 1367px+ desktop strip).
 */
export function isHeaderRow2TabletLike(
  viewportWidth: number | null,
  isIpadOs: boolean
): boolean {
  if (isIpadOs) {
    return true;
  }
  if (viewportWidth === null) {
    return false;
  }
  return viewportWidth <= HEADER_TABLET_ROW2_MAX_WIDTH_PX;
}

export function getHeaderFigmaRow2LeftInnerGapClass(tabletLike: boolean): string {
  return tabletLike
    ? 'gap-y-[22px] gap-x-[22px] sm:gap-y-0'
    : 'gap-y-[22px] gap-x-[22px] sm:gap-y-0 min-[1367px]:gap-x-[22px]';
}

export function getHeaderFigmaRow2MainGapClass(tabletLike: boolean): string {
  if (tabletLike) {
    return 'md:gap-x-5';
  }
  return 'md:max-[1366px]:gap-x-5 min-[1367px]:gap-x-[52px]';
}

export function getHeaderSearchFormRadiusClass(tabletLike: boolean): string {
  return tabletLike
    ? `${HEADER_FIGMA_PILL_RADIUS_CLASS} md:rounded-[64px]`
    : HEADER_FIGMA_PILL_RADIUS_CLASS;
}

export function getHeaderSearchIconTextGapClass(tabletLike: boolean): string {
  return tabletLike
    ? 'gap-1.5 md:gap-1'
    : 'gap-1.5 min-[1367px]:gap-1.5';
}

export function getHeaderSearchInputPaddingLeftClass(tabletLike: boolean): string {
  return tabletLike ? 'pl-4 md:pl-3' : 'pl-4 min-[1367px]:pl-4';
}

export function getHeaderSearchInputInnerEndPadClass(tabletLike: boolean): string {
  return tabletLike ? 'pr-2 md:pr-1.5' : 'pr-2 min-[1367px]:pr-2';
}

export function getHeaderSearchSubmitWidthClass(tabletLike: boolean): string {
  return tabletLike
    ? 'w-[118px] max-w-[118px] shrink-0 px-2.5 sm:px-3 md:w-[88px] md:max-w-[88px] md:px-1.5'
    : 'w-[118px] max-w-[118px] shrink-0 px-2.5 sm:px-3 min-[1367px]:w-[132px] min-[1367px]:max-w-[132px] min-[1367px]:px-3.5';
}

export function getHeaderSearchSubmitClass(tabletLike: boolean): string {
  const radius = getHeaderSearchFormRadiusClass(tabletLike);
  const textShrink = tabletLike ? 'md:text-[11px]' : '';
  return `flex items-center justify-center self-center ${HEADER_SEARCH_SUBMIT_HEIGHT_CLASS} shrink-0 bg-marco-yellow text-xs font-semibold leading-normal text-marco-black transition-[filter] hover:brightness-95 active:brightness-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marco-black/15 ${textShrink} ${radius}`.trim();
}

export function getHeaderCategoryButtonClass(tabletLike: boolean, ipadDesktopRow2Like = false): string {
  const base = `gap-1 px-3 py-2 text-xs font-normal transition-[opacity,filter] hover:opacity-95 active:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 ${HEADER_FIGMA_PILL_RADIUS_CLASS} md:h-10 md:shrink-0 md:py-0 md:text-xs md:font-medium`;
  if (tabletLike && ipadDesktopRow2Like) {
    return `${base} md:w-[172px] md:max-w-[172px] md:pl-2.5 md:pr-[18px] md:gap-1`;
  }
  return tabletLike
    ? `${base} md:w-[140px] md:max-w-[140px] md:pl-2.5 md:pr-[18px] md:gap-1`
    : `${base} min-[1367px]:w-[184px] min-[1367px]:max-w-[184px] min-[1367px]:px-4 min-[1367px]:gap-1.5`;
}

/**
 * Search pill spans the flex slot between categories and the right toolbar (full width).
 */
export const HEADER_SEARCH_BAR_INNER_CLASS = 'w-full min-w-0';

/** Gap between search icon and placeholder — tighter on tablet */
export const HEADER_SEARCH_ICON_TEXT_GAP_CLASS =
  'gap-1.5 md:max-[1366px]:gap-1 min-[1367px]:gap-1.5';

/** Horizontal padding from track edge to icon — tighter on tablet */
export const HEADER_SEARCH_INPUT_PADDING_LEFT_CLASS =
  'pl-4 md:max-[1366px]:pl-3 min-[1367px]:pl-4';

/** Right padding inside gray track before yellow CTA — tighter on tablet */
export const HEADER_SEARCH_INPUT_INNER_END_PAD_CLASS =
  'pr-2 md:max-[1366px]:pr-1.5 min-[1367px]:pr-2';

/** Yellow CTA — compact on tablet (iPad / iPad Pro); full width on wide desktop */
export const HEADER_SEARCH_SUBMIT_WIDTH_CLASS =
  'w-[118px] max-w-[118px] shrink-0 px-2.5 sm:px-3 md:max-[1366px]:w-[88px] md:max-[1366px]:max-w-[88px] md:max-[1366px]:px-1.5 min-[1367px]:w-[132px] min-[1367px]:max-w-[132px] min-[1367px]:px-3.5';

/**
 * Yellow submit — centered in `HEADER_SEARCH_BAR_HEIGHT_CLASS` track; radius matches search pill.
 */
export const HEADER_SEARCH_SUBMIT_CLASS = `flex items-center justify-center self-center ${HEADER_SEARCH_SUBMIT_HEIGHT_CLASS} shrink-0 bg-marco-yellow text-xs font-semibold leading-normal text-marco-black transition-[filter] hover:brightness-95 active:brightness-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marco-black/15 md:max-[1366px]:text-[11px] ${HEADER_SEARCH_FORM_RADIUS_CLASS}`;

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
 * Category trigger — compact on tablet (iPad / iPad Pro); full Figma width on wide desktop.
 */
export const HEADER_CATEGORY_BUTTON_CLASS = `gap-1 px-3 py-2 text-xs font-normal transition-[opacity,filter] hover:opacity-95 active:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 ${HEADER_FIGMA_PILL_RADIUS_CLASS} md:h-10 md:shrink-0 md:py-0 md:text-xs md:font-medium md:max-[1366px]:max-w-[140px] md:max-[1366px]:w-[140px] md:max-[1366px]:px-2.5 md:max-[1366px]:gap-1 min-[1367px]:w-[184px] min-[1367px]:max-w-[184px] min-[1367px]:px-4 min-[1367px]:gap-1.5`;

/** Toolbar icon hit targets — same outer size as `HEADER_ROW2_BAR_HEIGHT_CLASS` */
export const HEADER_TOOLBAR_ICON_BUTTON_CLASS = 'h-10 w-10 shrink-0';

/** Cart pill — same height as row-2 strip; wider pill for icon + price (Figma 111:4281 — gap 11px icon ↔ price) */
export const HEADER_CART_BUTTON_CLASS =
  'flex h-10 min-w-[124px] items-center justify-center gap-[11px] rounded-[68px] pl-4 pr-3.5 text-xs font-bold leading-tight transition-[opacity,filter] hover:opacity-95 active:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/25';

/**
 * Mobile header top row — round dark controls (Figma 314:2501 search, 314:2503 menu).
 * Compact: `p-2.5` (10px), inner glyph 24×24px (`h-6 w-6`); fill `#050401`.
 */
export const HEADER_MOBILE_HEADER_ROUND_CONTROL_CLASS =
  'flex shrink-0 items-center justify-center rounded-full bg-[#050401] p-2.5 text-white shadow-sm transition-[opacity,filter] hover:opacity-95 active:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marco-black/25';

/** Figma 314:2501 — mobile search FAB (same shell as {@link HEADER_MOBILE_HEADER_ROUND_CONTROL_CLASS}). */
export const HEADER_MOBILE_SEARCH_FAB_CLASS = HEADER_MOBILE_HEADER_ROUND_CONTROL_CLASS;

