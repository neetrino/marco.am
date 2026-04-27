'use client';

import Image from 'next/image';
import { shouldBypassNextImageOptimizer } from '../../lib/utils/should-bypass-next-image-optimizer';
import {
  HERO_MOBILE_CHAIR_FRAME_HEIGHT_PX,
  HERO_MOBILE_CHAIR_FRAME_WIDTH_PX,
  HERO_MOBILE_CHAIR_GROUP_HEIGHT_PX,
  HERO_MOBILE_CHAIR_IMAGE_HEIGHT_PCT,
  HERO_MOBILE_CHAIR_IMAGE_TOP_PCT,
  HERO_MOBILE_CHAIR_GROUP_NUDGE_DOWN_PX,
  HERO_MOBILE_CHAIR_GROUP_NUDGE_LEFT_PX,
  HERO_MOBILE_CHAIR_GROUP_NUDGE_UP_PX,
  HERO_MOBILE_CHAIR_GROUP_SCALE,
  HERO_MOBILE_CHAIR_LEFT_FRAC,
  HERO_MOBILE_FIGMA_FRAME_WIDTH_PX,
  HERO_MOBILE_FLOOR_ARC_GROUP_NUDGE_DOWN_PX,
  HERO_MOBILE_FLOOR_ARC_GROUP_NUDGE_RIGHT_PX,
  HERO_MOBILE_FLOOR_ARC_GROUP_SCALE,
  HERO_MOBILE_FLOOR_ARC_KNOB_NUDGE_DOWN_PX,
  HERO_MOBILE_FLOOR_ARC_KNOB_WIDTH_FRAC,
  HERO_MOBILE_FLOOR_SHADOW_HEIGHT_FRAC,
  HERO_MOBILE_FLOOR_SHADOW_LEFT_FRAC,
  HERO_MOBILE_FLOOR_SHADOW_TOP_FRAC,
  HERO_MOBILE_FLOOR_SHADOW_WIDTH_FRAC,
  HERO_MOBILE_SLATE_PANEL_TOP_FRAC,
  HERO_PROMO_CHAIR_IMAGE_NATURAL_HEIGHT_PX,
  HERO_PROMO_CHAIR_IMAGE_NATURAL_WIDTH_PX,
  HERO_PROMO_CHAIR_IMAGE_SRC,
  HERO_PROMO_CHAIR_SHADOW_IMAGE_SRC,
  HERO_PROMO_SLIDER_HANDLE_IMAGE_SRC,
} from '../hero.constants';

const chairWidthFrac = HERO_MOBILE_CHAIR_FRAME_WIDTH_PX / HERO_MOBILE_FIGMA_FRAME_WIDTH_PX;

const chairInGroupHeightFrac = HERO_MOBILE_CHAIR_FRAME_HEIGHT_PX / HERO_MOBILE_CHAIR_GROUP_HEIGHT_PX;

const groupFrameStyle = {
  left: `${HERO_MOBILE_CHAIR_LEFT_FRAC * 100}%`,
  top: `${HERO_MOBILE_SLATE_PANEL_TOP_FRAC * 100}%`,
  width: `min(${HERO_MOBILE_CHAIR_FRAME_WIDTH_PX}px, ${chairWidthFrac * 100}%)`,
  aspectRatio: `${HERO_MOBILE_CHAIR_FRAME_WIDTH_PX} / ${HERO_MOBILE_CHAIR_GROUP_HEIGHT_PX}`,
  maxWidth: `min(${HERO_MOBILE_CHAIR_FRAME_WIDTH_PX}px, calc(100% - 1rem))`,
  transformOrigin: '50% 100%',
  transform: `translateX(-${HERO_MOBILE_CHAIR_GROUP_NUDGE_LEFT_PX}px) translateY(${HERO_MOBILE_CHAIR_GROUP_NUDGE_DOWN_PX - HERO_MOBILE_CHAIR_GROUP_NUDGE_UP_PX}px) scale(${HERO_MOBILE_CHAIR_GROUP_SCALE})`,
} as const;

const chairImageStyle = {
  height: `${HERO_MOBILE_CHAIR_IMAGE_HEIGHT_PCT}%`,
  width: '100%',
  left: 0,
  top: `${HERO_MOBILE_CHAIR_IMAGE_TOP_PCT}%`,
  maxWidth: 'none',
} as const;

const floorShadowStyle = {
  left: `${HERO_MOBILE_FLOOR_SHADOW_LEFT_FRAC * 100}%`,
  top: `${HERO_MOBILE_FLOOR_SHADOW_TOP_FRAC * 100}%`,
  width: `${HERO_MOBILE_FLOOR_SHADOW_WIDTH_FRAC * 100}%`,
  height: `${HERO_MOBILE_FLOOR_SHADOW_HEIGHT_FRAC * 100}%`,
  transformOrigin: '50% 100%',
  transform: `translateX(${HERO_MOBILE_FLOOR_ARC_GROUP_NUDGE_RIGHT_PX}px) translateY(${HERO_MOBILE_FLOOR_ARC_GROUP_NUDGE_DOWN_PX}px) scale(${HERO_MOBILE_FLOOR_ARC_GROUP_SCALE})`,
} as const;

const MOBILE_HERO_CHAIR_SIZES = `(max-width: 767px) ${Math.round(HERO_MOBILE_CHAIR_FRAME_WIDTH_PX)}px, 0`;

/**
 * MARCO — Figma 314:2386 chair + 314:2387 floor ellipse + 314:2390 arc knob (`Ellipse 4`, centered on arc).
 * Avoid `fill` on chair Next/Image: it pins height to 100% and breaks Figma crop (138% / −38% top).
 */
export function HomePromoMobileHeroChair() {
  return (
    <div
      className="pointer-events-none absolute z-[13] box-border md:hidden"
      style={groupFrameStyle}
      aria-hidden
    >
      <div className="relative h-full w-full">
        <div className="absolute z-[1]" style={floorShadowStyle}>
          <div className="relative h-full w-full">
            <Image
              src={HERO_PROMO_CHAIR_SHADOW_IMAGE_SRC}
              alt=""
              fill
              sizes={MOBILE_HERO_CHAIR_SIZES}
              className="object-fill"
              unoptimized
            />
            <div
              className="absolute left-1/2 z-[2] -translate-x-1/2"
              style={{
                bottom: -HERO_MOBILE_FLOOR_ARC_KNOB_NUDGE_DOWN_PX,
                width: `${HERO_MOBILE_FLOOR_ARC_KNOB_WIDTH_FRAC * 100}%`,
                aspectRatio: '1',
              }}
            >
              <div className="relative h-full w-full">
                <Image
                  src={HERO_PROMO_SLIDER_HANDLE_IMAGE_SRC}
                  alt=""
                  fill
                  sizes={MOBILE_HERO_CHAIR_SIZES}
                  className="object-contain"
                  unoptimized
                />
              </div>
            </div>
          </div>
        </div>
        <div
          className="absolute left-0 top-0 z-[2] w-full overflow-hidden"
          style={{ height: `${chairInGroupHeightFrac * 100}%` }}
        >
          <div className="relative h-full w-full overflow-hidden">
            <Image
              src={HERO_PROMO_CHAIR_IMAGE_SRC}
              alt=""
              width={HERO_PROMO_CHAIR_IMAGE_NATURAL_WIDTH_PX}
              height={HERO_PROMO_CHAIR_IMAGE_NATURAL_HEIGHT_PX}
              sizes={MOBILE_HERO_CHAIR_SIZES}
              priority
              unoptimized={shouldBypassNextImageOptimizer(HERO_PROMO_CHAIR_IMAGE_SRC)}
              className="absolute left-0 max-w-none w-full select-none"
              style={chairImageStyle}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
