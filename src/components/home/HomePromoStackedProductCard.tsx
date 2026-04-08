'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { CSSProperties } from 'react';
import {
  HERO_PROMO_CHAIR_IMAGE_SRC,
  HERO_PROMO_CHAIR_SHADOW_IMAGE_SRC,
  HERO_PROMO_SLIDER_HANDLE_IMAGE_SRC,
  HERO_PROMO_STACK_LAYER_BLUE,
  HERO_PROMO_STACK_LAYER_GRAY,
  HERO_PROMO_STACK_LAYER_WHITE,
} from '../hero.constants';
import {
  HERO_PROMO_CHAIR_BOTTOM_OFFSET_PCT,
  HERO_PROMO_CHAIR_GROUP_SCALE,
  HERO_PROMO_CHAIR_HEIGHT_RATIO,
  HERO_PROMO_CHAIR_SHADOW_WIDTH_RATIO,
  HERO_PROMO_CHAIR_WIDTH_RATIO,
  HERO_PROMO_FLOOR_GROUP_BOTTOM_OFFSET_PCT,
  HERO_PROMO_FLOOR_GROUP_HEIGHT_RATIO,
  HERO_PROMO_STACK_BLUE_STYLE,
  HERO_PROMO_STACK_CONTAINER_ASPECT_H,
  HERO_PROMO_STACK_CONTAINER_ASPECT_W,
  HERO_PROMO_STACK_GRAY_STYLE,
  HERO_PROMO_STACK_RADIUS_PX,
  HERO_PROMO_SHADOW_IN_GROUP_HEIGHT_RATIO,
  HERO_PROMO_SLIDER_HANDLE_TOP_PCT,
  HERO_PROMO_SLIDER_HANDLE_WIDTH_PCT,
  HERO_PROMO_STACK_WHITE_STYLE,
} from './hero-promo-stack.constants';

type HomePromoStackedProductCardProps = {
  ariaLabel: string;
};

type StackLayerProps = {
  color: string;
  layerStyle: Pick<CSSProperties, 'top' | 'height'>;
  zIndex: number;
};

function StackLayer({ color, layerStyle, zIndex }: StackLayerProps) {
  const style: CSSProperties = {
    ...layerStyle,
    backgroundColor: color,
    borderRadius: HERO_PROMO_STACK_RADIUS_PX,
    zIndex,
  };
  return <div className="absolute left-0 right-0 overflow-hidden" style={style} />;
}

/** Matches stacked card max width — Next/Image `sizes` */
const HERO_PROMO_STACK_IMAGE_SIZES = '(max-width: 640px) 88vw, 470px';

type PromoChairOverlayProps = {
  wrapStyle: CSSProperties;
};

function PromoChairFloorGroup({ wrapStyle }: PromoChairOverlayProps) {
  const shadowHeightPct = HERO_PROMO_SHADOW_IN_GROUP_HEIGHT_RATIO * 100;

  return (
    <div
      className="pointer-events-none absolute left-1/2 z-[3] -translate-x-1/2"
      style={wrapStyle}
    >
      <div className="relative h-full w-full">
        <div
          className="absolute left-0 top-0 w-full"
          style={{ height: `${shadowHeightPct}%` }}
        >
          <div className="relative h-full w-full">
          <Image
            src={HERO_PROMO_CHAIR_SHADOW_IMAGE_SRC}
            alt=""
            fill
            className="object-fill"
            sizes={HERO_PROMO_STACK_IMAGE_SIZES}
            unoptimized
          />
          </div>
        </div>
        <div
          className="absolute left-1/2 z-[1] -translate-x-1/2"
          style={{
            top: `${HERO_PROMO_SLIDER_HANDLE_TOP_PCT}%`,
            width: `${HERO_PROMO_SLIDER_HANDLE_WIDTH_PCT}%`,
            aspectRatio: '1',
          }}
        >
          <div className="relative h-full w-full">
            <Image
              src={HERO_PROMO_SLIDER_HANDLE_IMAGE_SRC}
              alt=""
              fill
              className="object-contain"
              sizes={HERO_PROMO_STACK_IMAGE_SIZES}
              unoptimized
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function PromoChairAsset({ wrapStyle }: PromoChairOverlayProps) {
  return (
    <div
      className="pointer-events-none absolute left-1/2 z-[3] -translate-x-1/2"
      style={wrapStyle}
    >
      <div className="relative h-full w-full">
        <Image
          src={HERO_PROMO_CHAIR_IMAGE_SRC}
          alt=""
          fill
          className="object-contain object-bottom"
          sizes={HERO_PROMO_STACK_IMAGE_SIZES}
          priority
        />
      </div>
    </div>
  );
}

/** Figma 101:4019–101:4026 — stacked rectangles + floor group (ellipse + handle) + chair */
export function HomePromoStackedProductCard({ ariaLabel }: HomePromoStackedProductCardProps) {
  const aspectStyle: CSSProperties = {
    aspectRatio: `${HERO_PROMO_STACK_CONTAINER_ASPECT_W} / ${HERO_PROMO_STACK_CONTAINER_ASPECT_H}`,
  };

  const chairScalePct = HERO_PROMO_CHAIR_GROUP_SCALE * 100;

  const floorGroupWrapStyle: CSSProperties = {
    bottom: `${HERO_PROMO_FLOOR_GROUP_BOTTOM_OFFSET_PCT}%`,
    width: `${HERO_PROMO_CHAIR_SHADOW_WIDTH_RATIO * chairScalePct}%`,
    height: `${HERO_PROMO_FLOOR_GROUP_HEIGHT_RATIO * chairScalePct}%`,
  };

  const chairWrapStyle: CSSProperties = {
    bottom: `${HERO_PROMO_CHAIR_BOTTOM_OFFSET_PCT}%`,
    width: `${HERO_PROMO_CHAIR_WIDTH_RATIO * chairScalePct}%`,
    height: `${HERO_PROMO_CHAIR_HEIGHT_RATIO * chairScalePct}%`,
  };

  return (
    <Link
      href="/products"
      aria-label={ariaLabel}
      className="relative block w-[min(88vw,160px)] sm:w-[200px] md:w-[min(52vw,270px)] lg:w-[min(48vw,340px)] xl:w-[470px]"
    >
      <div className="relative w-full overflow-visible" style={aspectStyle}>
        <StackLayer color={HERO_PROMO_STACK_LAYER_WHITE} layerStyle={HERO_PROMO_STACK_WHITE_STYLE} zIndex={0} />
        <StackLayer color={HERO_PROMO_STACK_LAYER_GRAY} layerStyle={HERO_PROMO_STACK_GRAY_STYLE} zIndex={1} />
        <StackLayer color={HERO_PROMO_STACK_LAYER_BLUE} layerStyle={HERO_PROMO_STACK_BLUE_STYLE} zIndex={2} />
        <PromoChairFloorGroup wrapStyle={floorGroupWrapStyle} />
        <PromoChairAsset wrapStyle={chairWrapStyle} />
      </div>
    </Link>
  );
}
