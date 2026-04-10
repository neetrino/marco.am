'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import type { CSSProperties } from 'react';
import { useTranslation } from '../../lib/i18n-client';
import {
  HERO_PROMO_SMARTPHONES_BANNER_IMAGE_SRC,
  HERO_PROMO_SMARTPHONES_TILE_HEIGHT_PX,
  HERO_PROMO_SMARTPHONES_TILE_TR_ICON_FRAME_PX,
  HERO_PROMO_SMARTPHONES_TILE_TR_ICON_GLYPH_PX,
  HERO_PROMO_SMARTPHONES_TILE_TR_ICON_RIGHT_PX,
  HERO_PROMO_SMARTPHONES_TILE_TR_ICON_TOP_PX,
  HERO_PROMO_SMARTPHONES_TILE_WIDTH_PX,
} from '../hero.constants';

const smartphonesTileFrameStyle = {
  width: HERO_PROMO_SMARTPHONES_TILE_WIDTH_PX,
  height: HERO_PROMO_SMARTPHONES_TILE_HEIGHT_PX,
} as const;

const SMARTPHONES_BANNER_IMAGE_SIZES = `${HERO_PROMO_SMARTPHONES_TILE_WIDTH_PX}px`;

const smartphonesTrIconLinkStyle: CSSProperties = {
  width: `${HERO_PROMO_SMARTPHONES_TILE_TR_ICON_FRAME_PX}px`,
  height: `${HERO_PROMO_SMARTPHONES_TILE_TR_ICON_FRAME_PX}px`,
  top: HERO_PROMO_SMARTPHONES_TILE_TR_ICON_TOP_PX,
  right: HERO_PROMO_SMARTPHONES_TILE_TR_ICON_RIGHT_PX,
  left: 'auto',
};

/**
 * Smartphones / 80% promo tile — Figma 305:2154 raster; TR control Figma 305:2130 (`Group 9208`).
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
