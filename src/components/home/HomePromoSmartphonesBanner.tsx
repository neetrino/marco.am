'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Montserrat } from 'next/font/google';
import type { CSSProperties } from 'react';
import { useTranslation } from '../../lib/i18n-client';
import {
  HERO_PROMO_SMARTPHONES_BANNER_IMAGE_SRC,
  HERO_PROMO_SMARTPHONES_TILE_CTA_ANCHOR_FROM_TOP_FRAC,
  HERO_PROMO_SMARTPHONES_TILE_CTA_BORDER_RADIUS_PX,
  HERO_PROMO_SMARTPHONES_TILE_CTA_ICON_SRC,
  HERO_PROMO_SMARTPHONES_TILE_CTA_LEFT_FRAC,
  HERO_PROMO_SMARTPHONES_TILE_CTA_MIN_WIDTH_PX,
  HERO_PROMO_SMARTPHONES_TILE_CTA_NUDGE_DOWN_PX,
  HERO_PROMO_SMARTPHONES_TILE_CTA_NUDGE_X_PX,
  HERO_PROMO_SMARTPHONES_TILE_CTA_PADDING_X_PX,
  HERO_PROMO_SMARTPHONES_TILE_CTA_PADDING_Y_PX,
  HERO_PROMO_SMARTPHONES_TILE_HEIGHT_PX,
  HERO_PROMO_SMARTPHONES_TILE_WIDTH_PX,
} from '../hero.constants';

/** Figma 101:4057 — white pill, Montserrat 700 16 / 24 on black 80% tile */
const montserratSmartphonesCta = Montserrat({
  weight: '700',
  subsets: ['cyrillic', 'latin'],
  display: 'swap',
});

const smartphonesTileFrameStyle = {
  width: HERO_PROMO_SMARTPHONES_TILE_WIDTH_PX,
  height: HERO_PROMO_SMARTPHONES_TILE_HEIGHT_PX,
} as const;

const SMARTPHONES_BANNER_IMAGE_SIZES = `${HERO_PROMO_SMARTPHONES_TILE_WIDTH_PX}px`;

const smartphonesCtaPillStyle: CSSProperties = {
  left: `${HERO_PROMO_SMARTPHONES_TILE_CTA_LEFT_FRAC * 100}%`,
  top: `${HERO_PROMO_SMARTPHONES_TILE_CTA_ANCHOR_FROM_TOP_FRAC * 100}%`,
  minWidth: HERO_PROMO_SMARTPHONES_TILE_CTA_MIN_WIDTH_PX,
  paddingLeft: HERO_PROMO_SMARTPHONES_TILE_CTA_PADDING_X_PX,
  paddingRight: HERO_PROMO_SMARTPHONES_TILE_CTA_PADDING_X_PX,
  paddingTop: HERO_PROMO_SMARTPHONES_TILE_CTA_PADDING_Y_PX,
  paddingBottom: HERO_PROMO_SMARTPHONES_TILE_CTA_PADDING_Y_PX,
  transform: `translate(calc(-50% + ${HERO_PROMO_SMARTPHONES_TILE_CTA_NUDGE_X_PX}px), calc(-50% + ${HERO_PROMO_SMARTPHONES_TILE_CTA_NUDGE_DOWN_PX}px))`,
  borderRadius: HERO_PROMO_SMARTPHONES_TILE_CTA_BORDER_RADIUS_PX,
};

/**
 * Smartphones / 80% promo tile — raster; fixed-size frame beside free-delivery banner.
 */
export function HomePromoSmartphonesBanner() {
  const { t } = useTranslation();

  return (
    <div className="block shrink-0">
      <div className="relative isolate shrink-0" style={smartphonesTileFrameStyle}>
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
          className={`${montserratSmartphonesCta.className} absolute z-[2] flex items-center justify-center bg-white text-center text-sm font-bold leading-snug text-black shadow-sm transition hover:opacity-95`}
          style={smartphonesCtaPillStyle}
          aria-label={t('home.promo_smartphones_banner_aria')}
        >
          {t('home.promo_smartphones_banner_cta')}
        </Link>
        <div
          aria-hidden
          className="pointer-events-none absolute -right-2 -top-3 z-20 aspect-square w-[20%] sm:-right-2.5 sm:-top-4"
        >
          <Image
            src={HERO_PROMO_SMARTPHONES_TILE_CTA_ICON_SRC}
            alt=""
            fill
            className="object-contain"
            sizes="72px"
          />
        </div>
      </div>
    </div>
  );
}
