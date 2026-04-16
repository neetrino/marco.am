'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { Montserrat } from 'next/font/google';
import type { CSSProperties } from 'react';
import { useTranslation } from '../../lib/i18n-client';
import {
  HERO_FREE_DELIVERY_TILE_TRANSLATE_X_PX,
  HERO_FREE_DELIVERY_TILE_TRANSLATE_Y_PX,
  HERO_PROMO_SMARTPHONES_BANNER_IMAGE_SRC,
  HERO_PROMO_SMARTPHONES_TILE_CTA_BORDER_RADIUS_PX,
  HERO_PROMO_SMARTPHONES_TILE_CTA_BOTTOM_PX,
  HERO_PROMO_SMARTPHONES_TILE_CTA_LEFT_PX,
  HERO_PROMO_SMARTPHONES_TILE_CTA_PADDING_X_PX,
  HERO_PROMO_SMARTPHONES_TILE_CTA_PADDING_Y_PX,
  HERO_PROMO_SMARTPHONES_TILE_TR_ICON_FRAME_PX,
  HERO_PROMO_SMARTPHONES_TILE_TR_ICON_GLYPH_PX,
  HERO_PROMO_SMARTPHONES_TILE_TR_ICON_RIGHT_PX,
  HERO_PROMO_SMARTPHONES_TILE_ROW_WIDTH_CLASSNAME,
  HERO_PROMO_SMARTPHONES_TILE_TR_ICON_TOP_PX,
  HERO_SIDE_PROMO_TILE_ASPECT_CLASSNAME,
} from '../hero.constants';

/** Figma 305:2159 — Montserrat Bold 14 / leading 20 */
const montserratSmartphonesBottomCta = Montserrat({
  weight: '700',
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
});

const SMARTPHONES_BANNER_IMAGE_SIZES =
  '(max-width: 640px) 50vw, (max-width: 768px) 46vw, (max-width: 1024px) 40vw, 368px';

const smartphonesTrIconLinkStyle: CSSProperties = {
  width: `${HERO_PROMO_SMARTPHONES_TILE_TR_ICON_FRAME_PX}px`,
  height: `${HERO_PROMO_SMARTPHONES_TILE_TR_ICON_FRAME_PX}px`,
  top: HERO_PROMO_SMARTPHONES_TILE_TR_ICON_TOP_PX,
  right: HERO_PROMO_SMARTPHONES_TILE_TR_ICON_RIGHT_PX,
  left: 'auto',
};

const smartphonesBottomCtaStyle: CSSProperties = {
  bottom: HERO_PROMO_SMARTPHONES_TILE_CTA_BOTTOM_PX,
  left: HERO_PROMO_SMARTPHONES_TILE_CTA_LEFT_PX,
  right: 'auto',
  paddingLeft: HERO_PROMO_SMARTPHONES_TILE_CTA_PADDING_X_PX,
  paddingRight: HERO_PROMO_SMARTPHONES_TILE_CTA_PADDING_X_PX,
  paddingTop: HERO_PROMO_SMARTPHONES_TILE_CTA_PADDING_Y_PX,
  paddingBottom: HERO_PROMO_SMARTPHONES_TILE_CTA_PADDING_Y_PX,
  borderRadius: HERO_PROMO_SMARTPHONES_TILE_CTA_BORDER_RADIUS_PX,
};

type HomePromoSmartphonesBannerProps = {
  /**
   * `row` — same translate as free-delivery tile (bottom promo row).
   * `corner` — no translate; place inside top-right wrapper in `HeroCarousel`.
   */
  layout?: 'row' | 'corner';
};

/**
 * Desktop hero — 80% promo tile (Figma 305:2154).
 * Wider than van tile ({@link HERO_PROMO_SMARTPHONES_TILE_ROW_WIDTH_CLASSNAME}); aspect {@link HERO_SIDE_PROMO_TILE_ASPECT_CLASSNAME}.
 */
export function HomePromoSmartphonesBanner({ layout = 'row' }: HomePromoSmartphonesBannerProps = {}) {
  const { t } = useTranslation();
  const rootStyle: CSSProperties | undefined =
    layout === 'corner'
      ? undefined
      : {
          transform: `translate(${HERO_FREE_DELIVERY_TILE_TRANSLATE_X_PX}px, ${HERO_FREE_DELIVERY_TILE_TRANSLATE_Y_PX}px)`,
        };

  const widthClassName =
    layout === 'corner' ? 'w-[368px]' : HERO_PROMO_SMARTPHONES_TILE_ROW_WIDTH_CLASSNAME;

  return (
    <div className={`relative isolate shrink-0 bg-transparent ${widthClassName}`} style={rootStyle}>
      <div className={`relative isolate w-full overflow-hidden ${HERO_SIDE_PROMO_TILE_ASPECT_CLASSNAME}`}>
        <Image
          src={HERO_PROMO_SMARTPHONES_BANNER_IMAGE_SRC}
          alt=""
          fill
          className="pointer-events-none object-contain object-bottom"
          sizes={SMARTPHONES_BANNER_IMAGE_SIZES}
          priority
        />
        <Link
          href="/products"
          className={`${montserratSmartphonesBottomCta.className} absolute z-[2] flex max-w-[calc(100%-2rem)] shrink-0 items-center justify-center bg-white text-center text-sm font-bold leading-5 text-black shadow-sm ring-1 ring-black/10 transition hover:brightness-95`}
          style={smartphonesBottomCtaStyle}
        >
          {t('home.promo_smartphones_banner_cta')}
        </Link>
        <Link
          href="/products"
          className="absolute z-[3] flex shrink-0 items-center justify-center rounded-full bg-white text-marco-black shadow-md ring-1 ring-black/10 transition hover:brightness-95"
          style={smartphonesTrIconLinkStyle}
          aria-label={t('home.promo_smartphones_banner_aria')}
        >
          <ArrowUpRight
            width={HERO_PROMO_SMARTPHONES_TILE_TR_ICON_GLYPH_PX}
            height={HERO_PROMO_SMARTPHONES_TILE_TR_ICON_GLYPH_PX}
            strokeWidth={2.5}
            className="shrink-0"
            aria-hidden
          />
        </Link>
      </div>
    </div>
  );
}
