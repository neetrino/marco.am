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
import { HomePromoStackDiscountCaption } from './HomePromoStackDiscountCaption';
import {
  HERO_PROMO_CHAIR_BOTTOM_OFFSET_PCT,
  HERO_PROMO_CHAIR_NUDGE_UP_PX,
  HERO_PROMO_CHAIR_GROUP_SCALE,
  HERO_PROMO_CHAIR_HEIGHT_RATIO,
  HERO_PROMO_CHAIR_SHADOW_WIDTH_RATIO,
  HERO_PROMO_CHAIR_WIDTH_RATIO,
  HERO_PROMO_FLOOR_GROUP_BOTTOM_OFFSET_PCT,
  HERO_PROMO_FLOOR_GROUP_HEIGHT_RATIO,
  HERO_PROMO_STACK_BLUE_LABEL_BOTTOM_CLASS,
  HERO_PROMO_STACK_BLUE_STYLE,
  HERO_PROMO_STACK_CARD_TRANSLATE_Y_PX,
  HERO_PROMO_STACK_CONTAINER_ASPECT_H,
  HERO_PROMO_STACK_CONTAINER_ASPECT_W,
  HERO_PROMO_STACK_CTA_CENTER_FROM_BLUE_TOP_PCT,
  HERO_PROMO_STACK_CTA_NUDGE_DOWN_PX,
  HERO_PROMO_STACK_CTA_RIGHT_EXTRA_PX,
  HERO_PROMO_STACK_GRAY_STYLE,
  HERO_PROMO_STACK_RADIUS_PX,
  HERO_PROMO_SHADOW_IN_GROUP_HEIGHT_RATIO,
  HERO_PROMO_SLIDER_HANDLE_TOP_PCT,
  HERO_PROMO_SLIDER_HANDLE_WIDTH_PCT,
  HERO_PROMO_STACK_WHITE_STYLE,
} from './hero-promo-stack.constants';

/** CTA label: Montserrat 700 — compact pill; `sm` breakpoint steps up one size. */
const montserratCta = Montserrat({
  weight: '700',
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
});

type HomePromoStackedProductCardProps = {
  ariaLabel: string;
  /**
   * When true, use a single desktop-sized max width — parent hero applies uniform `zoom`
   * so responsive steps are not needed.
   */
  compositionMode?: boolean;
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
      <p className="mb-0 text-[11px] leading-snug sm:text-sm sm:leading-[1.4]">
        {t('home.promo_stack_blue_label_line1')}
      </p>
      <p className="text-[11px] leading-snug sm:text-sm sm:leading-[1.4]">
        {t('home.promo_stack_blue_label_line2')}
      </p>
    </div>
  );
}

/** Figma 305:2096 — compact pill CTA inside blue layer (bottom-right) */
/** From pill left edge to first letter of the label (px). */
const HERO_PROMO_STACK_CTA_LABEL_INSET_LEFT_PX = 48;
/** From end of label text to trailing icon circle (px). */
const HERO_PROMO_STACK_CTA_TEXT_TO_ICON_GAP_PX = 18;

const HERO_PROMO_STACK_CTA_ICON_NUDGE_LEFT_CLASS = '-translate-x-1';

type HomePromoStackedProductCardCtaProps = {
  ariaLabel: string;
};

function HomePromoStackedProductCardCta({ ariaLabel }: HomePromoStackedProductCardCtaProps) {
  const { t } = useTranslation();

  const ctaPillStyle: CSSProperties = {
    paddingLeft: HERO_PROMO_STACK_CTA_LABEL_INSET_LEFT_PX,
    gap: HERO_PROMO_STACK_CTA_TEXT_TO_ICON_GAP_PX,
  };

  return (
    <Link
      href="/products"
      aria-label={ariaLabel}
      className="inline-flex max-w-[min(100%,16rem)] items-center rounded-full bg-marco-yellow py-0.5 pr-0.5 shadow-sm transition hover:brightness-95 sm:max-w-[20rem] sm:py-1"
      style={ctaPillStyle}
    >
      <span
        className={`${montserratCta.className} min-w-0 flex-1 truncate text-left text-xs font-bold leading-4 text-marco-black dark:!text-[#050505] sm:text-sm sm:leading-5`}
      >
        {t('home.promo_featured_cta')}
      </span>
      <span
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-marco-black text-white sm:h-7 sm:w-7 ${HERO_PROMO_STACK_CTA_ICON_NUDGE_LEFT_CLASS}`}
      >
        <ArrowUpRight className="h-2.5 w-2.5 sm:h-3 sm:w-3" strokeWidth={2.5} aria-hidden />
      </span>
    </Link>
  );
}

type BlueStackLayerWithCtaProps = {
  ctaAriaLabel: string;
};

function BlueStackLayerWithCta({ ctaAriaLabel }: BlueStackLayerWithCtaProps) {
  const style: CSSProperties = {
    ...HERO_PROMO_STACK_BLUE_STYLE,
    backgroundColor: HERO_PROMO_STACK_LAYER_BLUE,
    borderRadius: HERO_PROMO_STACK_RADIUS_PX,
    zIndex: 2,
  };

  const ctaVerticalStyle: CSSProperties = {
    top: `${HERO_PROMO_STACK_CTA_CENTER_FROM_BLUE_TOP_PCT}%`,
    right: `calc(1.5rem + ${HERO_PROMO_STACK_CTA_RIGHT_EXTRA_PX}px)`,
    transform: `translateY(calc(-50% + ${HERO_PROMO_STACK_CTA_NUDGE_DOWN_PX}px))`,
  };

  return (
    <div className="absolute left-0 right-0 overflow-hidden" style={style}>
      <div
        className={`absolute right-6 z-[4] flex items-end sm:right-6 md:left-6 ${HERO_PROMO_STACK_BLUE_LABEL_BOTTOM_CLASS}`}
      >
        <HomePromoStackedProductCardBlueLabel />
      </div>
      <div className="absolute z-[4]" style={ctaVerticalStyle}>
        <HomePromoStackedProductCardCta ariaLabel={ctaAriaLabel} />
      </div>
    </div>
  );
}

/** Figma 101:4019–101:4026 — stacked rectangles + floor group (ellipse + handle) + chair */
export function HomePromoStackedProductCard({
  ariaLabel,
  compositionMode = false,
}: HomePromoStackedProductCardProps) {
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

  const cardRootStyle: CSSProperties = {
    transform: `translateY(${HERO_PROMO_STACK_CARD_TRANSLATE_Y_PX}px)`,
  };

  const maxWidthClass = compositionMode
    ? 'max-w-[472px]'
    : 'max-w-[164px] sm:max-w-[206px] md:max-w-[min(274px,100%)] lg:max-w-[min(342px,100%)] xl:max-w-[472px]';

  return (
    <div className={`relative block w-full ${maxWidthClass}`} style={cardRootStyle}>
      <div className="relative w-full overflow-visible" style={aspectStyle}>
        <StackLayer color={HERO_PROMO_STACK_LAYER_WHITE} layerStyle={HERO_PROMO_STACK_WHITE_STYLE} zIndex={0} />
        <StackLayer color={HERO_PROMO_STACK_LAYER_GRAY} layerStyle={HERO_PROMO_STACK_GRAY_STYLE} zIndex={1} />
        <BlueStackLayerWithCta ctaAriaLabel={ariaLabel} />
        <PromoChairFloorGroup wrapStyle={floorGroupWrapStyle} />
        <PromoChairAsset wrapStyle={chairWrapStyle} />
      </div>
      <HomePromoStackDiscountCaption />
    </div>
  );
}
