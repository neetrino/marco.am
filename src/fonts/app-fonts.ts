import { Inter } from 'next/font/google';

/**
 * Primary UI font — self-hosted by Next.js at build time (no fonts.googleapis.com runtime requests).
 */
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  adjustFontFallback: true,
  preload: true,
});

/** Apply on `<html>` — exposes `--font-inter` for Tailwind and global CSS. */
export const appHtmlFontClassName = inter.variable;

/** Apply on `<body>` — activates Inter via next/font class (pairs with `variable` on `<html>`). */
export const appBodyFontClassName = inter.className;
