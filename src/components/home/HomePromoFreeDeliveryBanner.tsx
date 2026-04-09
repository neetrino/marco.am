'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useTranslation } from '../../lib/i18n-client';
import {
  HERO_FREE_DELIVERY_BANNER_IMAGE_SRC,
  HERO_FREE_DELIVERY_TILE_CTA_ICON_SRC,
  HERO_FREE_DELIVERY_TILE_MASK_BITE_RADIUS_PX,
  HERO_FREE_DELIVERY_TILE_MASK_CORNER_RADIUS_PX,
  HERO_SIDE_PROMO_TILE_ASPECT_CLASSNAME,
  HERO_SIDE_PROMO_TILE_WIDTH_CLASSNAME,
} from '../hero.constants';

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

/**
 * Free delivery promo tile — beside `HomePromoStackedProductCard`.
 * Shape: Figma `101:4037` / `101:4041` (mask + warehouse raster).
 */
export function HomePromoFreeDeliveryBanner() {
  const { t } = useTranslation();

  return (
    <Link
      href="/delivery"
      className="block shrink-0 bg-transparent transition hover:opacity-95"
      aria-label={t('home.promo_free_delivery_banner_aria')}
    >
      <div
        className={`relative isolate shrink-0 overflow-hidden bg-transparent ${HERO_SIDE_PROMO_TILE_ASPECT_CLASSNAME} ${HERO_SIDE_PROMO_TILE_WIDTH_CLASSNAME}`}
        style={{ clipPath: freeDeliveryTileMaskClipPath }}
      >
        <Image
          src={HERO_FREE_DELIVERY_BANNER_IMAGE_SRC}
          alt=""
          fill
          className="bg-transparent object-contain object-center"
          sizes="(max-width: 640px) 42vw, (max-width: 768px) 38vw, (max-width: 1024px) 30vw, 280px"
          priority
        />
        {/* Icon centered in TR bite — circle center `(100% - bite, bite)` */}
        <div
          aria-hidden
          className="pointer-events-none absolute z-20 aspect-square max-h-[min(72px,55%)] max-w-[min(72px,55%)] min-h-[26px] min-w-[26px] -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `calc(100% - ${HERO_FREE_DELIVERY_TILE_MASK_BITE_RADIUS_PX}px)`,
            top: `${HERO_FREE_DELIVERY_TILE_MASK_BITE_RADIUS_PX}px`,
          }}
        >
          <Image
            src={HERO_FREE_DELIVERY_TILE_CTA_ICON_SRC}
            alt=""
            fill
            className="object-contain"
            sizes="(max-width: 640px) 10vw, (max-width: 1024px) 8vw, 62px"
          />
        </div>
      </div>
    </Link>
  );
}
