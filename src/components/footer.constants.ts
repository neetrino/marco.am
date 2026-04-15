/**
 * MARCO home footer (Figma 101:2835) — layout tokens and nav specs.
 */

/** Figma fill: #f2f2f2 */
export const FOOTER_SURFACE_CLASS = 'bg-[#f2f2f2]';

/** Figma secondary text #6b7280 */
export const FOOTER_MUTED_TEXT_CLASS = 'text-[#6b7280]';

/** Figma heading text #181111 */
export const FOOTER_HEADING_TEXT_CLASS = 'text-[#181111]';

/**
 * Company / Support column titles — no extra letter-spacing (see default `tracking-[0.05em]` on Contacts).
 */
export const FOOTER_NAV_COLUMN_HEADING_TRACK_CLASS = 'tracking-normal';

export const NEETRINO_STUDIO_HREF = 'https://neetrino.com/';

/**
 * Brand logo frame — larger than legacy 91×81; same ~91:81 aspect.
 * Blurb overlays the lower area via {@link FOOTER_BRAND_DESCRIPTION_OVERLAP_CLASS} (logo position unchanged).
 */
export const FOOTER_BRAND_LOGO_BOX_CLASS =
  'relative z-0 h-[178px] w-[200px] shrink-0';

/**
 * Lifts the MARCO mark: stronger from `md` so its top lines up with the Company column heading;
 * single-column layout keeps a smaller nudge.
 * `-translate-x-*` moves only the logo frame; brand copy stays column-left (`absolute left-0`).
 */
export const FOOTER_BRAND_LOGO_SHIFT_CLASS =
  '-translate-x-[38px] max-md:-translate-y-[25px] md:-translate-y-[48px]';

/** No flex gap — blurb is absolutely positioned over the lower part of the logo frame. */
export const FOOTER_BRAND_COLUMN_GAP_CLASS = 'gap-0';

/**
 * Brand tagline: anchored to the bottom of the logo frame (`bottom-0`), above the mark (`z-10`).
 * `whitespace-pre` — only `\n` from locale line breaks (no extra wraps like `pre-line`).
 * `overflow-x-auto` — on very narrow columns, horizontal scroll instead of breaking lines.
 */
export const FOOTER_BRAND_DESCRIPTION_OVERLAP_CLASS =
  'absolute bottom-0 left-0 z-10 max-w-full overflow-x-auto whitespace-pre';

/** Smaller than `text-xs` so the blurb stays subtle over the logo. */
export const FOOTER_BRAND_DESCRIPTION_TEXT_CLASS =
  'text-[10px] leading-snug sm:text-[11px]';

export type FooterNavItem = {
  readonly href: string;
  readonly labelKey: string;
};

export const FOOTER_COMPANY_LINKS: readonly FooterNavItem[] = [
  { href: '/about', labelKey: 'common.footer.marco.links.companyAbout' },
  { href: '/stores', labelKey: 'common.footer.marco.links.companyStores' },
  { href: '/contact', labelKey: 'common.footer.marco.links.companyCareers' },
  { href: '/about', labelKey: 'common.footer.marco.links.companyNews' },
  { href: '/contact', labelKey: 'common.footer.marco.links.companyFeedback' },
];

export const FOOTER_SUPPORT_LINKS: readonly FooterNavItem[] = [
  { href: '/delivery', labelKey: 'common.footer.marco.links.supportDelivery' },
  { href: '/delivery-terms', labelKey: 'common.footer.marco.links.supportInstallment' },
  { href: '/support', labelKey: 'common.footer.marco.links.supportWarranty' },
  { href: '/faq', labelKey: 'common.footer.marco.links.supportFaq' },
  { href: '/stores', labelKey: 'common.footer.marco.links.supportService' },
];
