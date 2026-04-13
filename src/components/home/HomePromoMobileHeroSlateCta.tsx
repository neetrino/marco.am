'use client';

import type { CSSProperties } from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { Montserrat } from 'next/font/google';
import { useTranslation } from '../../lib/i18n-client';
import {
  HERO_MOBILE_SLATE_CTA_ARROW_ICON_PX,
  HERO_MOBILE_SLATE_CTA_HEIGHT_PX,
  HERO_MOBILE_SLATE_CTA_ICON_CIRCLE_PX,
  HERO_MOBILE_SLATE_CTA_ICON_PULL_LEFT_PX,
  HERO_MOBILE_SLATE_CTA_LABEL_ICON_GAP_PX,
  HERO_MOBILE_SLATE_CTA_NUDGE_RIGHT_PX,
  HERO_MOBILE_SLATE_CTA_NUDGE_UP_PX,
  HERO_MOBILE_SLATE_CTA_PADDING_LEFT_PX,
  HERO_MOBILE_SLATE_CTA_PADDING_RIGHT_PX,
  HERO_MOBILE_SLATE_CTA_PILL_RADIUS_PX,
  HERO_MOBILE_SLATE_CTA_WIDTH_PX,
  HERO_MOBILE_SLATE_PANEL_BOX_STYLE,
} from '../hero.constants';

const montserratSlateCta = Montserrat({
  weight: '700',
  subsets: ['cyrillic', 'latin'],
  display: 'swap',
});

const slateCtaLinkStyle: CSSProperties = {
  height: HERO_MOBILE_SLATE_CTA_HEIGHT_PX,
  minHeight: HERO_MOBILE_SLATE_CTA_HEIGHT_PX,
  maxWidth: HERO_MOBILE_SLATE_CTA_WIDTH_PX,
  width: '100%',
  borderRadius: HERO_MOBILE_SLATE_CTA_PILL_RADIUS_PX,
  paddingLeft: HERO_MOBILE_SLATE_CTA_PADDING_LEFT_PX,
  paddingRight: HERO_MOBILE_SLATE_CTA_PADDING_RIGHT_PX,
  gap: HERO_MOBILE_SLATE_CTA_LABEL_ICON_GAP_PX,
};

const slateCtaIconFrameStyle: CSSProperties = {
  width: HERO_MOBILE_SLATE_CTA_ICON_CIRCLE_PX,
  height: HERO_MOBILE_SLATE_CTA_ICON_CIRCLE_PX,
  marginLeft: -HERO_MOBILE_SLATE_CTA_ICON_PULL_LEFT_PX,
};

/**
 * Figma 314:2394 — yellow pill + black arrow chip; `z-[12]` under chair (`z-[13]`) so legs overlap CTA.
 */
export function HomePromoMobileHeroSlateCta() {
  const { t } = useTranslation();

  return (
    <div
      className="pointer-events-none absolute z-[12] box-border flex flex-col justify-end md:hidden"
      style={HERO_MOBILE_SLATE_PANEL_BOX_STYLE}
    >
      <div
        className="pointer-events-none flex w-full justify-center px-2 pb-1.5 pt-0"
        style={{
          transform: `translate(${HERO_MOBILE_SLATE_CTA_NUDGE_RIGHT_PX}px, -${HERO_MOBILE_SLATE_CTA_NUDGE_UP_PX}px)`,
        }}
      >
        <Link
          href="/products"
          className={`${montserratSlateCta.className} group pointer-events-auto flex w-full max-w-full shrink-0 items-center bg-marco-yellow text-base font-bold leading-6 text-marco-black transition hover:-translate-y-0.5 hover:bg-red-700 hover:text-white active:translate-y-px`}
          style={slateCtaLinkStyle}
          aria-label={`${t('home.promo_featured_cta')}. ${t('home.promo_featured_title')}`}
        >
          <span className="min-w-0 shrink whitespace-nowrap text-left">{t('home.promo_featured_cta')}</span>
          <span
            className="flex shrink-0 items-center justify-center rounded-full bg-marco-black text-white transition group-hover:bg-white group-hover:text-red-700"
            style={slateCtaIconFrameStyle}
            aria-hidden
          >
            <ArrowUpRight
              width={HERO_MOBILE_SLATE_CTA_ARROW_ICON_PX}
              height={HERO_MOBILE_SLATE_CTA_ARROW_ICON_PX}
              strokeWidth={2.5}
            />
          </span>
        </Link>
      </div>
    </div>
  );
}
