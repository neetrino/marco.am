export type HeaderSocialAccount = {
  readonly id: string;
  readonly href: string;
  readonly labelKey: string;
  /** Optional secondary line (e.g. phone for messenger branches). */
  readonly subtitle?: string;
};

export const HEADER_INSTAGRAM_GROUP_HREF = 'https://www.instagram.com/_marcogroup_/';
export const HEADER_INSTAGRAM_ELECTRONICS_HREF = 'https://www.instagram.com/marco_electronics/';
export const HEADER_FACEBOOK_ELECTRONICS_HREF = 'https://www.facebook.com/marcoelectronicss';
export const HEADER_FACEBOOK_FURNITURE_HREF = 'https://www.facebook.com/marcofurniture';

export const HEADER_INSTAGRAM_ACCOUNTS: readonly HeaderSocialAccount[] = [
  {
    id: 'group',
    href: HEADER_INSTAGRAM_GROUP_HREF,
    labelKey: 'contact.social.instagramAccounts.group',
  },
  {
    id: 'electronics',
    href: HEADER_INSTAGRAM_ELECTRONICS_HREF,
    labelKey: 'contact.social.instagramAccounts.electronics',
  },
];

export const HEADER_FACEBOOK_ACCOUNTS: readonly HeaderSocialAccount[] = [
  {
    id: 'electronics',
    href: HEADER_FACEBOOK_ELECTRONICS_HREF,
    labelKey: 'contact.social.facebookAccounts.electronics',
  },
  {
    id: 'furniture',
    href: HEADER_FACEBOOK_FURNITURE_HREF,
    labelKey: 'contact.social.facebookAccounts.furniture',
  },
];

export const HEADER_SOCIAL_MENU_MIN_WIDTH_CLASS = 'min-w-[12rem]';
