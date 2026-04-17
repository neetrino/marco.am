import { Montserrat } from 'next/font/google';

/** Figma MARCO 448:2681 — filter section headings (Montserrat SemiBold 16px) */
export const productsFiltersSectionFont = Montserrat({
  weight: '600',
  subsets: ['latin', 'latin-ext', 'cyrillic'],
});

const PRODUCTS_FILTER_SECTION_SHELL_BASE =
  'border-b border-solid border-[#e2e8f0] mb-4 pb-4 max-lg:mb-8 max-lg:pb-5';

/** Divider + padding under section content; extra gap below line before next title on mobile drawer (`max-lg`). */
export const PRODUCTS_FILTER_SECTION_SHELL_CLASS = PRODUCTS_FILTER_SECTION_SHELL_BASE;

/** Last block in a stack — no bottom border/margin (e.g. size filter). */
export const PRODUCTS_FILTER_SECTION_SHELL_LAST_CLASS = `${PRODUCTS_FILTER_SECTION_SHELL_BASE} last:mb-0 last:border-b-0`;
