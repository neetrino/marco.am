import { Mulish } from 'next/font/google';

/**
 * Tidio chat accent face — loaded only when chat activates (see TidioDeferredLoader).
 * Kept out of root layout so Mulish woff2 files do not compete with Inter on first paint.
 */
const mulish = Mulish({
  subsets: ['latin'],
  weight: ['400', '600'],
  display: 'swap',
  variable: '--font-mulish',
  adjustFontFallback: true,
  preload: false,
});

/** Registers `--font-mulish` on `<html>` for Tidio selectors in globals.css. */
export function applyMulishFontVariable(): void {
  if (typeof document === 'undefined') {
    return;
  }
  document.documentElement.classList.add(mulish.variable);
}
