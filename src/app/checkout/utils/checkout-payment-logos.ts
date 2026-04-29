/**
 * Paths served from `public/payment/` (Next.js `/payment/...`).
 * Display order: ArCa, then international brands (matches checkout UI).
 */
export const CHECKOUT_ARCA_CARD_LOGOS = [
  '/payment/Arca_logo_wiki.svg',
  '/payment/Mastercard-logo.svg',
  '/payment/Visa_logo_wiki.svg',
] as const;

export const CHECKOUT_IDRAM_LOGOS = ['/payment/Idram_logo_wiki.svg'] as const;
