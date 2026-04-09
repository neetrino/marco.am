'use client';

import { ArrowUpRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Montserrat } from 'next/font/google';
import type { CSSProperties } from 'react';
import { useTranslation } from '../../lib/i18n-client';
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
  HERO_PROMO_CHAIR_NUDGE_UP_PX,
  HERO_PROMO_CHAIR_GROUP_SCALE,
  HERO_PROMO_CHAIR_HEIGHT_RATIO,
  HERO_PROMO_CHAIR_SHADOW_WIDTH_RATIO,
  HERO_PROMO_CHAIR_WIDTH_RATIO,
  HERO_PROMO_FLOOR_GROUP_BOTTOM_OFFSET_PCT,
  HERO_PROMO_FLOOR_GROUP_HEIGHT_RATIO,
  HERO_PROMO_STACK_BLUE_STYLE,
  HERO_PROMO_STACK_CONTAINER_ASPECT_H,
  HERO_PROMO_STACK_CONTAINER_ASPECT_W,
  HERO_PROMO_STACK_CTA_CENTER_FROM_BLUE_TOP_PCT,
  HERO_PROMO_STACK_GRAY_STYLE,
  HERO_PROMO_STACK_RADIUS_PX,
  HERO_PROMO_SHADOW_IN_GROUP_HEIGHT_RATIO,
  HERO_PROMO_SLIDER_HANDLE_TOP_PCT,
  HERO_PROMO_SLIDER_HANDLE_WIDTH_PCT,
  HERO_PROMO_STACK_WHITE_STYLE,
} from './hero-promo-stack.constants';

/** CTA label: Figma — Montserrat 700, 16px / 24px (same as design "Montserrat arm"). */
const montserratCta = Montserrat({
  weight: '700',
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
});

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
const HERO_PROMO_STACK_IMAGE_SIZES = '(max-width: 640px) 88vw, 472px';

type PromoChairOverlayProps = {
  wrapStyle: CSSProperties;
};

function PromoChairFloorGroup({ wrapStyle }: PromoChairOverlayProps) {
  const shadowHeightPct = HERO_PROMO_SHADOW_IN_GROUP_HEIGHT_RATIO * 100;

  return (
    <div
      className="pointer-events-none absolute left-1/2 z-[3]"
      style={{
        ...wrapStyle,
        transform: `translateX(-50%) translateY(-${HERO_PROMO_CHAIR_NUDGE_UP_PX}px)`,
      }}
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
      className="pointer-events-none absolute left-1/2 z-[3]"
      style={{
        ...wrapStyle,
        transform: `translateX(-50%) translateY(-${HERO_PROMO_CHAIR_NUDGE_UP_PX}px)`,
      }}
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

/** Figma 101:4035 — two-line caption, white, bottom-left of blue layer */
function HomePromoStackedProductCardBlueLabel() {
  const { t } = useTranslation();

  return (
    <div className="flex min-w-0 max-w-[58%] flex-col gap-0 pr-1 text-left text-white sm:max-w-[55%]">
      <p className="mb-0 text-xs leading-snug sm:text-base sm:leading-[1.4875]">
        {t('home.promo_stack_blue_label_line1')}
      </p>
      <p className="text-xs leading-snug sm:text-base sm:leading-[1.4875]">
        {t('home.promo_stack_blue_label_line2')}
      </p>
    </div>
  );
}

/** Figma 305:2096 — compact pill CTA inside blue layer (bottom-right) */
/** From pill left edge to first letter of the label (px). */
const HERO_PROMO_STACK_CTA_LABEL_INSET_LEFT_PX = 60;
/** From end of label text to trailing icon circle (px). */
const HERO_PROMO_STACK_CTA_TEXT_TO_ICON_GAP_PX = 24;

function HomePromoStackedProductCardCta() {
  const { t } = useTranslation();

  const ctaPillStyle: CSSProperties = {
    paddingLeft: HERO_PROMO_STACK_CTA_LABEL_INSET_LEFT_PX,
    gap: HERO_PROMO_STACK_CTA_TEXT_TO_ICON_GAP_PX,
  };

  return (
    <div
      className="inline-flex max-w-[min(100%,18rem)] items-center rounded-full bg-marco-yellow py-1 pr-1 shadow-sm transition group-hover:brightness-95 sm:max-w-[22rem] sm:py-1.5"
      style={ctaPillStyle}
    >
      <span
        className={`${montserratCta.className} min-w-0 flex-1 truncate text-left text-base font-bold leading-6 text-marco-black`}
      >
        {t('home.promo_featured_cta')}
      </span>
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-marco-black text-white sm:h-9 sm:w-9">
        <ArrowUpRight className="h-3 w-3 sm:h-4 sm:w-4" strokeWidth={2.5} aria-hidden />
      </span>
    </div>
  );
}

function BlueStackLayerWithCta() {
  const style: CSSProperties = {
    ...HERO_PROMO_STACK_BLUE_STYLE,
    backgroundColor: HERO_PROMO_STACK_LAYER_BLUE,
    borderRadius: HERO_PROMO_STACK_RADIUS_PX,
    zIndex: 2,
  };

  const ctaVerticalStyle: CSSProperties = {
    top: `${HERO_PROMO_STACK_CTA_CENTER_FROM_BLUE_TOP_PCT}%`,
    transform: 'translateY(-50%)',
  };

  return (
    <div className="absolute left-0 right-0 overflow-hidden" style={style}>
      <div className="absolute bottom-[20px] right-6 z-[4] flex items-end sm:bottom-[22px] sm:right-6 md:bottom-[45px] md:left-6">
        <HomePromoStackedProductCardBlueLabel />
      </div>
      <div
        className="absolute right-6 z-[4]"
        style={ctaVerticalStyle}
      >
        <HomePromoStackedProductCardCta />
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
      className="group relative block w-[min(88vw,164px)] sm:w-[206px] md:w-[min(52vw,274px)] lg:w-[min(48vw,342px)] xl:w-[472px]"
    >
      <div className="relative w-full overflow-visible" style={aspectStyle}>
        <StackLayer color={HERO_PROMO_STACK_LAYER_WHITE} layerStyle={HERO_PROMO_STACK_WHITE_STYLE} zIndex={0} />
        <StackLayer color={HERO_PROMO_STACK_LAYER_GRAY} layerStyle={HERO_PROMO_STACK_GRAY_STYLE} zIndex={1} />
        <BlueStackLayerWithCta />
        <PromoChairFloorGroup wrapStyle={floorGroupWrapStyle} />
        <PromoChairAsset wrapStyle={chairWrapStyle} />
      </div>
    </Link>
  );
}
