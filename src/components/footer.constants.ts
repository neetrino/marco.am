/**
 * MARCO home footer (Figma 101:2835) — layout tokens and nav specs.
 */

/** Footer surface: matches the site page surface in dark mode. */
export const FOOTER_SURFACE_CLASS = 'bg-[#f2f2f2] dark:bg-[var(--app-surface)]';

/** Inner wrapper — `.marco-footer-inner` in `globals.css` (tablet shell; 1367+ same `max-w-7xl` as hero / header). */
export const FOOTER_INNER_CONTAINER_CLASS = 'marco-footer-inner';

/** Footer secondary text. */
export const FOOTER_MUTED_TEXT_CLASS = 'text-[#6b7280] dark:text-[#cfcfcf]';

/** Footer heading text. */
export const FOOTER_HEADING_TEXT_CLASS = 'text-[#181111] dark:text-white';

/**
 * Company / Support column titles — no extra letter-spacing (see default `tracking-[0.05em]` on Contacts).
 */
export const FOOTER_NAV_COLUMN_HEADING_TRACK_CLASS = 'tracking-normal';

/**
 * Tighter word spacing in Company / Support link labels (Armenian multi-word lines).
 */
export const FOOTER_NAV_COLUMN_LINK_WORD_SPACING_CLASS = '[word-spacing:-0.06em]';

/** Compact vertical rhythm: heading → list and between list rows (was gap-3 / gap-2). */
export const FOOTER_NAV_COLUMN_HEADING_LIST_GAP_CLASS = 'gap-2';
export const FOOTER_NAV_COLUMN_LIST_ITEM_GAP_CLASS = 'gap-1';

/** Tighter line-height for Company / Support heading + links (shorter column). */
export const FOOTER_NAV_COLUMN_HEADING_LEADING_CLASS = 'leading-tight';
export const FOOTER_NAV_COLUMN_LINK_LEADING_CLASS = 'leading-tight';

export const FOOTER_COMPANY_LINKS = [
  { href: '/about', labelKey: 'common.footer.marco.links.companyAbout' },
  { href: '/contact', labelKey: 'common.footer.marco.links.companyFeedback' },
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
export const FOOTER_GRID_NAV_COLUMNS_PAD_TOP_CLASS = 'lg:pt-9';

/**
 * Company / Support grid cells: centered on iPad Pro band; flush right + nudge only on wide desktop.
 */
export const FOOTER_GRID_COMPANY_SUPPORT_WRAPPER_CLASS =
  `lg:flex lg:h-full lg:w-full lg:min-h-0 ${FOOTER_GRID_NAV_COLUMNS_PAD_TOP_CLASS} min-[1024px]:max-[1366px]:translate-x-0 min-[1024px]:max-[1366px]:justify-center min-[1367px]:justify-end min-[1367px]:-translate-x-[16px]`;

/** Contacts column: centered on iPad Pro band; aligned to cell end on wide desktop. */
export const FOOTER_GRID_CONTACTS_WRAPPER_CLASS =
  `lg:flex lg:h-full lg:w-full lg:min-h-0 ${FOOTER_GRID_NAV_COLUMNS_PAD_TOP_CLASS} min-[1024px]:max-[1366px]:justify-center min-[1367px]:justify-end`;

/** Space between main footer grid and the copyright separator bar. */
export const FOOTER_COPYRIGHT_STRIP_MARGIN_TOP_CLASS = 'mt-4';
/** Padding under the rule, above social / copyright / payments. */
export const FOOTER_COPYRIGHT_STRIP_PADDING_TOP_CLASS = 'pt-3';
/** Vertical gap between stacked copyright-row blocks on small screens. */
export const FOOTER_COPYRIGHT_STRIP_STACK_GAP_CLASS = 'gap-5';

/**
 * Main footer columns grid — iPad Pro (1024–1366): centered cells; 1367+ Figma stretch alignment.
 * `lg:items-stretch` + brand `self-start`: nav/contact cells share row height; brand keeps intrinsic height.
 */
export const FOOTER_MAIN_GRID_CLASS =
  'grid grid-cols-1 items-start gap-8 md:grid-cols-2 md:max-[1023px]:justify-items-center lg:grid-cols-4 lg:items-stretch min-[1024px]:max-[1366px]:justify-items-center min-[1367px]:justify-items-stretch lg:gap-x-4 lg:gap-y-6';

/**
 * Brand logo frame — larger than legacy 91×81; same ~91:81 aspect.
 * Blurb overlays the lower area via {@link FOOTER_BRAND_DESCRIPTION_OVERLAP_CLASS} (logo position unchanged).
 */
export const FOOTER_BRAND_LOGO_BOX_CLASS =
  'relative z-0 h-[285px] w-[320px] shrink-0';

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

/** Smaller than `text-xs` so the blurb stays subtle over the logo. */
export const FOOTER_BRAND_DESCRIPTION_TEXT_CLASS =
  'text-[10px] leading-snug sm:text-[11px]';
