/**
 * MARCO home footer (Figma 101:2835) — layout tokens and nav specs.
 */

import { MARCO_SLATE_TEXT_CLASS } from '@/lib/constants/marco-brand-colors';

/** Footer surface: matches the site page surface in dark mode. */
export const FOOTER_SURFACE_CLASS = 'bg-[#f2f2f2] dark:bg-[var(--app-surface)]';

/** Footer top edge — slate tint in light mode. */
export const FOOTER_BORDER_TOP_CLASS =
  'border-t border-[var(--marco-slate)]/10 dark:border-white/10';

/** Copyright strip separator — slate tint in light mode. */
export const FOOTER_COPYRIGHT_BORDER_CLASS =
  'border-t border-[var(--marco-slate)]/15 dark:border-white/10';

/** Footer secondary / legal fine print — slate at reduced strength. */
export const FOOTER_MUTED_TEXT_CLASS =
  'text-[var(--marco-slate)]/75 dark:text-[#cfcfcf]';

/** Footer body copy and links — brand slate in light mode (default, not hover-only). */
export const FOOTER_INK_TEXT_CLASS = `${MARCO_SLATE_TEXT_CLASS} dark:text-[#cfcfcf]`;

/** Footer heading text — brand slate in light mode. */
export const FOOTER_HEADING_TEXT_CLASS = `${MARCO_SLATE_TEXT_CLASS} dark:text-white`;

/** Optional link emphasis on hover — opacity only; color stays slate. */
export const FOOTER_LINK_HOVER_CLASS = 'hover:opacity-80 dark:hover:opacity-90';

/** Nav / contacts column titles — slightly above legacy `text-xs` (12px). */
export const FOOTER_NAV_HEADING_TEXT_CLASS =
  'text-[13px] sm:text-sm font-bold uppercase';

/** Nav links, contact lines — brand slate by default in light mode. */
export const FOOTER_NAV_BODY_TEXT_CLASS = 'text-[13px] sm:text-[14px]';

/**
 * Company / Support column titles — no extra letter-spacing (see default `tracking-[0.05em]` on Contacts).
 */
export const FOOTER_NAV_COLUMN_HEADING_TRACK_CLASS = 'tracking-normal';

/**
 * Tighter word spacing in Company / Support link labels (Armenian multi-word lines).
 */
export const FOOTER_NAV_COLUMN_LINK_WORD_SPACING_CLASS = '[word-spacing:-0.06em]';

/** Tight vertical rhythm: heading → list; list rows kept close. */
export const FOOTER_NAV_COLUMN_HEADING_LIST_GAP_CLASS = 'gap-1.5';
export const FOOTER_NAV_COLUMN_LIST_ITEM_GAP_CLASS = 'gap-0.5';

/** Tighter line-height for Company / Support heading + links (shorter column). */
export const FOOTER_NAV_COLUMN_HEADING_LEADING_CLASS = 'leading-tight';
export const FOOTER_NAV_COLUMN_LINK_LEADING_CLASS = 'leading-tight';

/** First footer nav column (heading: Navigation / Նավիգացիա) — shop + info links. */
export const FOOTER_COMPANY_LINKS = [
  { href: '/products', labelKey: 'common.navigation.shop' },
  { href: '/about', labelKey: 'common.footer.marco.links.companyAbout' },
  { href: '/contact', labelKey: 'common.navigation.contact' },
  { href: '/brands', labelKey: 'common.navigation.brands' },
  { href: '/reels', labelKey: 'common.navigation.reels' },
] as const;

export const FOOTER_SUPPORT_LINKS = [
  {
    href: '/delivery-return',
    labelKey: 'common.footer.marco.links.supportShipping',
  },
  {
    href: '/privacy',
    labelKey: 'common.footer.marco.links.supportInstallment',
  },
  {
    href: '/terms',
    labelKey: 'common.footer.marco.links.supportWarranty',
  },
  { href: '/refund-policy', labelKey: 'common.footer.marco.links.supportService' },
] as const;

export const NEETRINO_STUDIO_HREF = 'https://neetrino.com/';

/**
 * iPad / iPad Pro (through 1366px): center column copy in the cell (not flush to gutters).
 * Wide desktop (1367+): left-aligned columns again.
 */
export const FOOTER_TABLET_COLUMN_CENTER_CLASS =
  'md:max-[1023px]:items-center md:max-[1023px]:text-center min-[1024px]:max-[1366px]:items-center min-[1024px]:max-[1366px]:text-center';

/**
 * Nudges Company / Support / Contacts down vs. the brand column (4-col footer).
 */
const FOOTER_GRID_NAV_COLUMNS_PAD_TOP_CLASS = 'lg:pt-9';

/**
 * Company / Support cells: centered on iPad Pro; wide desktop left-aligned.
 * `w-full` below `lg` fills grid cells; `lg:w-auto` keeps intrinsic width inside the nav flex row (`justify-between`).
 */
export const FOOTER_GRID_COMPANY_SUPPORT_WRAPPER_CLASS =
  `lg:flex lg:h-full lg:min-h-0 w-full lg:w-auto lg:shrink-0 ${FOOTER_GRID_NAV_COLUMNS_PAD_TOP_CLASS} min-[1024px]:max-[1366px]:translate-x-0 min-[1024px]:max-[1366px]:justify-center min-[1367px]:justify-start min-[1367px]:translate-x-0`;

/** Contacts: same rhythm; `lg:min-w-0` allows wrapping when the flex row is narrow. */
export const FOOTER_GRID_CONTACTS_WRAPPER_CLASS =
  `lg:flex lg:h-full lg:min-h-0 w-full lg:w-auto lg:min-w-0 lg:shrink ${FOOTER_GRID_NAV_COLUMNS_PAD_TOP_CLASS} min-[1024px]:max-[1366px]:justify-center min-[1367px]:justify-start`;

/**
 * Pipe column between nav blocks — `lg+` only (see `Footer`); hidden below `lg` so `md` 2-col flow stays 4 cells.
 * `self-stretch` + inner bar `flex-1` draws a tall vertical rule (not a single glyph).
 */
export const FOOTER_COLUMN_PIPE_CLASS = `hidden shrink-0 select-none lg:flex lg:min-h-0 lg:flex-col lg:items-center lg:self-stretch ${FOOTER_GRID_NAV_COLUMNS_PAD_TOP_CLASS}`;

/** Vertical rule inside {@link FOOTER_COLUMN_PIPE_CLASS}; `min-h-60` keeps a minimum length in short rows. */
export const FOOTER_COLUMN_PIPE_BAR_CLASS =
  'w-px flex-1 min-h-60 bg-[var(--marco-slate)]/25 dark:bg-white/25';

/**
 * lg+: wraps Navigation, pipes, Support, Contacts in one flex row so free space splits evenly
 * between adjacent items (`justify-between` + `gap-x-5`). `contents` keeps the same grid flow below `lg`.
 */
export const FOOTER_NAV_THREE_COLUMN_ROW_CLASS =
  'contents lg:flex lg:min-h-0 lg:w-full lg:items-start lg:justify-between lg:gap-x-5 lg:self-stretch';

/** Space between main footer grid and the copyright separator bar. */
export const FOOTER_COPYRIGHT_STRIP_MARGIN_TOP_CLASS = 'mt-4';
/** Padding under the rule, above social / copyright / payments. */
export const FOOTER_COPYRIGHT_STRIP_PADDING_TOP_CLASS = 'pt-3';
/**
 * Main footer grid — below `lg`: brand + four nav cells (pipes hidden). `lg+`: brand | one flex row
 * (see {@link FOOTER_NAV_THREE_COLUMN_ROW_CLASS}) so gutters between Nav, pipes, Support, Contacts stay even.
 */
export const FOOTER_MAIN_GRID_CLASS =
  'grid grid-cols-1 items-start gap-6 md:grid-cols-2 md:max-[1023px]:justify-items-center lg:grid-cols-[minmax(0,26rem)_1fr] lg:items-start min-[1024px]:max-[1366px]:justify-items-center min-[1367px]:justify-items-stretch lg:gap-x-5 lg:gap-y-4';

/** Footer MARCO GROUP logo frame (91:81 aspect). */
export const FOOTER_BRAND_LOGO_WIDTH_PX = 380;
/**
 * Brand logo frame — larger than legacy 91×81; same ~91:81 aspect.
 * Blurb overlays the lower area via {@link FOOTER_BRAND_DESCRIPTION_OVERLAP_CLASS} (logo position unchanged).
 */
export const FOOTER_BRAND_LOGO_BOX_CLASS =
  'relative z-0 h-[340px] w-[380px] shrink-0';

/**
 * Lifts the MARCO mark: stronger from `md` so its top lines up with the Company column heading;
 * single-column layout keeps a smaller nudge. `-translate-x-*` moves only the logo frame.
 * `md:max-[1023px]` / `min-[1024px]:max-[1366px]` — iPad / iPad Pro: logo centered; 1367+ restores Figma nudge.
 */
export const FOOTER_BRAND_LOGO_SHIFT_CLASS =
  '-translate-x-[38px] max-md:-translate-y-[25px] md:-translate-y-[48px] md:max-[1023px]:translate-x-0 min-[1024px]:max-[1366px]:translate-x-0 min-[1367px]:-translate-x-[38px]';

/** No flex gap — blurb is absolutely positioned over the lower part of the logo frame. */
export const FOOTER_BRAND_COLUMN_GAP_CLASS = 'gap-0';

/**
 * Brand tagline: anchored above the bottom of the logo column (`bottom-[21px]`).
 * `whitespace-pre` — only `\n` from locale line breaks (no extra wraps like `pre-line`).
 * `overflow-x-auto` — on very narrow columns, horizontal scroll instead of breaking lines.
 * `scrollbar-hide` — suppresses the visible scrollbar track under the text (same utility as copyright row).
 */
export const FOOTER_BRAND_DESCRIPTION_OVERLAP_CLASS =
  'absolute bottom-[21px] left-0 z-10 max-w-full overflow-x-auto whitespace-pre scrollbar-hide md:max-[1023px]:left-1/2 md:max-[1023px]:-translate-x-1/2 md:max-[1023px]:text-center min-[1024px]:max-[1366px]:left-1/2 min-[1024px]:max-[1366px]:-translate-x-1/2 min-[1024px]:max-[1366px]:text-center';

/** Blurb over logo — one step up from legacy 10/11px, still secondary to nav. */
export const FOOTER_BRAND_DESCRIPTION_TEXT_CLASS =
  'text-[11px] leading-snug sm:text-[12px]';
