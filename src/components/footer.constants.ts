/**
 * MARCO home footer (Figma 101:2835) — layout tokens and nav specs.
 */

/** Figma fill: #f2f2f2 */
export const FOOTER_SURFACE_CLASS = 'bg-[#f2f2f2]';

/** Figma secondary text #6b7280 */
export const FOOTER_MUTED_TEXT_CLASS = 'text-[#6b7280]';

/** Figma heading text #181111 */
export const FOOTER_HEADING_TEXT_CLASS = 'text-[#181111]';

export const NEETRINO_STUDIO_HREF = 'https://neetrino.com/';

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
