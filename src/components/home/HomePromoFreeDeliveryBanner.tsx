'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Montserrat } from 'next/font/google';
import type { CSSProperties } from 'react';
import { useTranslation } from '../../lib/i18n-client';
import {
  HERO_FREE_DELIVERY_BANNER_IMAGE_SRC,
  HERO_FREE_DELIVERY_TILE_CTA_ANCHOR_FROM_TOP_FRAC,
  HERO_FREE_DELIVERY_TILE_CTA_BORDER_RADIUS_PX,
  HERO_FREE_DELIVERY_TILE_CTA_NUDGE_UP_PX,
  HERO_FREE_DELIVERY_TILE_CTA_HEIGHT_PX,
  HERO_FREE_DELIVERY_TILE_CTA_WIDTH_PX,
  HERO_FREE_DELIVERY_TILE_MASK_BITE_RADIUS_PX,
  HERO_FREE_DELIVERY_TILE_MASK_CORNER_RADIUS_PX,
  HERO_SIDE_PROMO_TILE_ASPECT_CLASSNAME,
  HERO_SIDE_PROMO_TILE_WIDTH_CLASSNAME,
} from '../hero.constants';

/** CTA label — Montserrat 700; `text-xs` mobile, `sm:text-sm` up */
const montserratFreeDeliveryCta = Montserrat({
  weight: '700',
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
});

/**
 * Figma 101:4037 — rounded TL / BL / BR; concave circular TR bite (radius `MASK_BITE_RADIUS_PX`).
 */
function buildFreeDeliveryTileMaskClipPath(): string {
  const r = HERO_FREE_DELIVERY_TILE_MASK_CORNER_RADIUS_PX;
  const bite = HERO_FREE_DELIVERY_TILE_MASK_BITE_RADIUS_PX;
  const d = [
    `M 0 ${r}`,
    `Q 0 0 ${r} 0`,
    `H calc(100% - ${bite}px)`,
    `A ${bite} ${bite} 0 0 1 100% ${bite}px`,
    `V calc(100% - ${r}px)`,
    `A ${r} ${r} 0 0 1 calc(100% - ${r}px) 100%`,
    `H ${r}`,
    `A ${r} ${r} 0 0 1 0 calc(100% - ${r}px)`,
    `V ${r}`,
    'Z',
  ].join(' ');
  return `path('${d}')`;
}

const freeDeliveryTileMaskClipPath = buildFreeDeliveryTileMaskClipPath();

const freeDeliveryCtaButtonStyle: CSSProperties = {
  width: `min(${HERO_FREE_DELIVERY_TILE_CTA_WIDTH_PX}px, calc(100% - 2rem))`,
  minHeight: HERO_FREE_DELIVERY_TILE_CTA_HEIGHT_PX,
  borderRadius: HERO_FREE_DELIVERY_TILE_CTA_BORDER_RADIUS_PX,
  left: '50%',
  top: `${HERO_FREE_DELIVERY_TILE_CTA_ANCHOR_FROM_TOP_FRAC * 100}%`,
  transform: `translate(-50%, calc(-50% - ${HERO_FREE_DELIVERY_TILE_CTA_NUDGE_UP_PX}px))`,
};

/**
 * Free delivery promo tile — beside `HomePromoStackedProductCard`.
 * Shape: Figma `101:4037` mask + full-bleed delivery banner raster + Figma `305:2110` CTA.
 */
export function HomePromoFreeDeliveryBanner() {
  const { t } = useTranslation();

  return (
    <div
      className={`relative isolate shrink-0 bg-transparent ${HERO_SIDE_PROMO_TILE_WIDTH_CLASSNAME}`}
    >
      <div
        className={`relative overflow-hidden bg-transparent ${HERO_SIDE_PROMO_TILE_ASPECT_CLASSNAME}`}
        style={{ clipPath: freeDeliveryTileMaskClipPath }}
      >
        <Image
          src={HERO_FREE_DELIVERY_BANNER_IMAGE_SRC}
          alt=""
          fill
          className="pointer-events-none z-0 bg-transparent object-cover object-center"
          sizes="(max-width: 640px) 42vw, (max-width: 768px) 38vw, (max-width: 1024px) 30vw, 280px"
          priority
        />
        <Link
          href="/products"
          className={`${montserratFreeDeliveryCta.className} absolute z-[2] flex items-center justify-center bg-black px-2.5 text-center text-xs font-bold leading-4 text-white transition hover:brightness-110 sm:text-sm sm:leading-5`}
          style={freeDeliveryCtaButtonStyle}
          aria-label={t('home.promo_free_delivery_banner_aria')}
        >
          {t('home.promo_free_delivery_banner_cta')}
        </Link>
      </div>
    </div>
  );
}
