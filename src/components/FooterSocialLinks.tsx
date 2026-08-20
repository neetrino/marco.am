'use client';

import Image from 'next/image';
import { useTranslation } from '../lib/i18n-client';
import {
  FOOTER_SOCIAL_TILE_PX,
  FOOTER_SOCIAL_TILE_PX_COMPACT,
  FOOTER_SOCIAL_TILE_SPECS,
  FOOTER_SOCIAL_VIBER_GLYPH_HEIGHT_PX,
  FOOTER_SOCIAL_VIBER_GLYPH_HEIGHT_PX_COMPACT,
  FOOTER_SOCIAL_VIBER_GLYPH_WIDTH_PX,
  FOOTER_SOCIAL_VIBER_GLYPH_WIDTH_PX_COMPACT,
  FOOTER_SOCIAL_VIBER_SURFACE_CLASS,
  type FooterSocialTileSpec,
} from './footer-social.constants';
import { HeaderSocialAccountsDropdown } from './header/HeaderSocialAccountsDropdown';
import {
  HEADER_FACEBOOK_ACCOUNTS,
  HEADER_INSTAGRAM_ACCOUNTS,
  type HeaderSocialAccount,
} from './header/header-social-accounts.constants';

const FOOTER_SOCIAL_LINK_BASE =
  'inline-flex shrink-0 items-center justify-center rounded-full transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--marco-slate)] dark:focus-visible:outline-white';

const FOOTER_SOCIAL_ACCOUNT_MENUS: Record<
  string,
  { readonly accounts: readonly HeaderSocialAccount[]; readonly ariaKey: string }
> = {
  'contact.social.instagram': {
    accounts: HEADER_INSTAGRAM_ACCOUNTS,
    ariaKey: 'common.ariaLabels.instagramChooseAccount',
  },
  'contact.social.facebook': {
    accounts: HEADER_FACEBOOK_ACCOUNTS,
    ariaKey: 'common.ariaLabels.facebookChooseAccount',
  },
};

type FooterSocialLinksDensity = 'default' | 'compact';

type FooterSocialApiLink = {
  readonly platform: 'instagram' | 'facebook' | 'telegram' | 'whatsapp' | 'viber';
  readonly href: string;
};

type FooterSocialLinksProps = {
  density?: FooterSocialLinksDensity;
  /** CMS-driven URLs; when set and non-empty, overrides i18n `contact.social.*` URLs. */
  apiLinks?: readonly FooterSocialApiLink[];
};

type TileRenderCtx = {
  tileClass: string;
  fullSizePx: number;
  viberW: number;
  viberH: number;
  viberImgClass: string;
};

function buildFooterSocialInner(spec: FooterSocialTileSpec, ctx: TileRenderCtx) {
  const { tileClass, fullSizePx, viberW, viberH, viberImgClass } = ctx;
  if (spec.kind === 'full') {
    return (
      <Image
        src={spec.src}
        alt=""
        width={fullSizePx}
        height={fullSizePx}
        className={`block ${tileClass} max-h-none max-w-none shrink-0`}
        aria-hidden
        loading="lazy"
        unoptimized
      />
    );
  }
  return (
    <Image
      src={spec.src}
      alt=""
      width={viberW}
      height={viberH}
      className={viberImgClass}
      aria-hidden
      loading="lazy"
      unoptimized
    />
  );
}

function footerSocialSurfaceClass(spec: FooterSocialTileSpec, tileClass: string): string {
  if (spec.kind === 'full') {
    return `${FOOTER_SOCIAL_LINK_BASE} ${tileClass} overflow-hidden`;
  }
  return `${FOOTER_SOCIAL_LINK_BASE} flex ${tileClass} items-center justify-center ${FOOTER_SOCIAL_VIBER_SURFACE_CLASS}`;
}

type FooterSocialTileControlProps = {
  spec: FooterSocialTileSpec;
  href: string;
  hasHref: boolean;
  name: string;
  ctx: TileRenderCtx;
};

function FooterSocialTileControl({ spec, href, hasHref, name, ctx }: FooterSocialTileControlProps) {
  const { t } = useTranslation();
  const surfaceClass = footerSocialSurfaceClass(spec, ctx.tileClass);
  const inner = buildFooterSocialInner(spec, ctx);
  const accountMenu = FOOTER_SOCIAL_ACCOUNT_MENUS[spec.translationKey];

  if (accountMenu) {
    return (
      <HeaderSocialAccountsDropdown
        triggerClassName={surfaceClass}
        accounts={accountMenu.accounts}
        ariaLabel={t(accountMenu.ariaKey)}
        menuPlacement="above-start"
      >
        {inner}
      </HeaderSocialAccountsDropdown>
    );
  }

  if (!hasHref) {
    return (
      <span role="listitem" className={`${surfaceClass} opacity-50`} aria-label={name}>
        {inner}
      </span>
    );
  }

  return (
    <a
      role="listitem"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={surfaceClass}
      aria-label={name}
    >
      {inner}
    </a>
  );
}

function specForPlatform(
  platform: FooterSocialApiLink['platform'],
): FooterSocialTileSpec | undefined {
  const key = `contact.social.${platform}`;
  return FOOTER_SOCIAL_TILE_SPECS.find((s) => s.translationKey === key);
}

/**
 * Social row — Figma tiles (black on #FACC15). Use `compact` beside a single-line copyright.
 */
export function FooterSocialLinks({
  density = 'default',
  apiLinks,
}: FooterSocialLinksProps) {
  const { t } = useTranslation();
  const isCompact = density === 'compact';
  const tileClass = isCompact ? 'h-7 w-7' : 'h-8 w-8';
  const gapClass = isCompact ? 'gap-2' : 'gap-3';
  const ctx: TileRenderCtx = {
    tileClass,
    fullSizePx: isCompact ? FOOTER_SOCIAL_TILE_PX_COMPACT : FOOTER_SOCIAL_TILE_PX,
    viberW: isCompact ? FOOTER_SOCIAL_VIBER_GLYPH_WIDTH_PX_COMPACT : FOOTER_SOCIAL_VIBER_GLYPH_WIDTH_PX,
    viberH: isCompact ? FOOTER_SOCIAL_VIBER_GLYPH_HEIGHT_PX_COMPACT : FOOTER_SOCIAL_VIBER_GLYPH_HEIGHT_PX,
    viberImgClass: isCompact
      ? 'h-4 w-4 shrink-0 object-contain'
      : 'h-5 w-[18px] shrink-0 object-contain',
  };

  const useApi = apiLinks !== undefined && apiLinks.length > 0;

  return (
    <div
      className={`flex flex-wrap items-center ${gapClass}`}
      role="list"
      aria-label={t('common.ariaLabels.socialLinks')}
    >
      {useApi
        ? apiLinks.map((link) => {
            const spec = specForPlatform(link.platform);
            if (!spec) {
              return null;
            }
            const name = t(spec.ariaKey);
            return (
              <FooterSocialTileControl
                key={`${link.platform}-${link.href}`}
                spec={spec}
                href={link.href}
                hasHref
                name={name}
                ctx={ctx}
              />
            );
          })
        : FOOTER_SOCIAL_TILE_SPECS.map((spec) => {
            const href = t(spec.translationKey)?.trim();
            const hasHref = href.length > 0 && href !== '#';
            const name = t(spec.ariaKey);

            return (
              <FooterSocialTileControl
                key={spec.translationKey}
                spec={spec}
                href={href}
                hasHref={hasHref}
                name={name}
                ctx={ctx}
              />
            );
          })}
    </div>
  );
}
