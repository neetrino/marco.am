/**
 * Footer social row — Figma 101:2836 (`5:257`), scaled down for layout.
 */

/** Display size for circular tiles (intrinsic SVGs remain 40×40; scaled via CSS). */
export const FOOTER_SOCIAL_TILE_PX = 32;

/** Narrow footer bar — room for single-line copyright. */
export const FOOTER_SOCIAL_TILE_PX_COMPACT = 28;

/** Viber glyph — proportional to `FOOTER_SOCIAL_TILE_PX` vs Figma 40. */
export const FOOTER_SOCIAL_VIBER_GLYPH_WIDTH_PX = 18;
export const FOOTER_SOCIAL_VIBER_GLYPH_HEIGHT_PX = 20;

/** Compact row — smaller glyph inside Viber circle. */
export const FOOTER_SOCIAL_VIBER_GLYPH_WIDTH_PX_COMPACT = 16;
export const FOOTER_SOCIAL_VIBER_GLYPH_HEIGHT_PX_COMPACT = 16;

/** Viber tile uses explicit fill; glyphs match exported `viber-glyph.svg`. */
export const FOOTER_SOCIAL_VIBER_SURFACE_CLASS = 'bg-[#FACC15]';

export type FooterSocialTileKind = 'full' | 'viberGlyph';

export type FooterSocialTileSpec = {
  readonly translationKey: string;
  readonly ariaKey: string;
  readonly src: string;
  readonly kind: FooterSocialTileKind;
};

/** Order and assets match Figma node `I101:2836;5:257`. */
export const FOOTER_SOCIAL_TILE_SPECS: readonly FooterSocialTileSpec[] = [
  {
    translationKey: 'contact.social.instagram',
    ariaKey: 'common.ariaLabels.instagram',
    src: '/icons/footer-social/instagram.svg',
    kind: 'full',
  },
  {
    translationKey: 'contact.social.facebook',
    ariaKey: 'common.ariaLabels.facebook',
    src: '/icons/footer-social/facebook.svg',
    kind: 'full',
  },
  {
    translationKey: 'contact.social.telegram',
    ariaKey: 'common.ariaLabels.telegram',
    src: '/icons/footer-social/telegram.svg',
    kind: 'full',
  },
  {
    translationKey: 'contact.social.whatsapp',
    ariaKey: 'common.ariaLabels.whatsapp',
    src: '/icons/footer-social/whatsapp.svg',
    kind: 'full',
  },
  {
    translationKey: 'contact.social.viber',
    ariaKey: 'common.ariaLabels.viber',
    src: '/icons/footer-social/viber-glyph.svg',
    kind: 'viberGlyph',
  },
];

export const FOOTER_CONTACT_PHONE_ICON_SRC = '/icons/footer-social/contact-phone.svg';
export const FOOTER_CONTACT_MAIL_ICON_SRC = '/icons/footer-social/contact-mail.svg';

/** Contact column icons — compact (12px / 11px height). */
export const FOOTER_CONTACT_PHONE_ICON_CLASS = 'mt-0.5 h-3 w-auto shrink-0';
export const FOOTER_CONTACT_MAIL_ICON_CLASS = 'mt-0.5 h-[11px] w-auto shrink-0';
