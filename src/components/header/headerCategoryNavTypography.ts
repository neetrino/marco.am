import { Montserrat } from 'next/font/google';

/** Figma 218:4894 — category nav labels (Montserrat Regular 16 / Bold when active; Armenian copy). */
export const headerCategoryNavFont = Montserrat({
  weight: ['400', '700'],
  subsets: ['latin', 'latin-ext', 'cyrillic'],
});
