import type { CSSProperties } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { Montserrat } from 'next/font/google';

import { t } from '../../lib/i18n';
import type { LanguageCode } from '../../lib/language';
import {
  HERO_MOBILE_CHAIR_FRAME_HEIGHT_PX,
  HERO_MOBILE_CHAIR_FRAME_WIDTH_PX,
  HERO_MOBILE_CHAIR_GROUP_HEIGHT_PX,
  HERO_MOBILE_CHAIR_IMAGE_HEIGHT_PCT,
  HERO_MOBILE_CHAIR_IMAGE_TOP_PCT,
  HERO_MOBILE_CHAIR_GROUP_NUDGE_DOWN_PX,
  HERO_MOBILE_CHAIR_GROUP_NUDGE_UP_PX,
  HERO_MOBILE_CHAIR_GROUP_SCALE,
  HERO_MOBILE_FLOOR_ARC_GROUP_NUDGE_DOWN_PX,
  HERO_MOBILE_FLOOR_ARC_GROUP_NUDGE_RIGHT_PX,
  HERO_MOBILE_FLOOR_ARC_GROUP_SCALE,
  HERO_MOBILE_FLOOR_ARC_KNOB_NUDGE_DOWN_PX,
  HERO_MOBILE_FLOOR_ARC_KNOB_WIDTH_FRAC,
  HERO_MOBILE_FLOOR_SHADOW_HEIGHT_FRAC,
  HERO_MOBILE_FLOOR_SHADOW_LEFT_FRAC,
  HERO_MOBILE_FLOOR_SHADOW_TOP_FRAC,
  HERO_MOBILE_FLOOR_SHADOW_WIDTH_FRAC,
  HERO_MOBILE_SLATE_LABEL_FONT_SIZE_PX,
  HERO_MOBILE_SLATE_LABEL_LINE_HEIGHT_PX,
  HERO_MOBILE_SLATE_LABEL_MAX_WIDTH_PX,
  HERO_PROMO_CHAIR_IMAGE_NATURAL_HEIGHT_PX,
  HERO_PROMO_CHAIR_IMAGE_NATURAL_WIDTH_PX,
  HERO_PROMO_CHAIR_IMAGE_SRC,
  HERO_PROMO_CHAIR_SHADOW_IMAGE_SRC,
  HERO_PROMO_SLIDER_HANDLE_IMAGE_SRC,
} from '../hero.constants';
import {
  HOME_BANNERS_CTA_ARROW_ICON_PX,
  HOME_BANNERS_CTA_HEIGHT_PX,
  HOME_BANNERS_CTA_ICON_CIRCLE_PX,
  HOME_BANNERS_CTA_ICON_PULL_LEFT_PX,
  HOME_BANNERS_CTA_LABEL_FONT_SIZE_PX,
  HOME_BANNERS_CTA_LABEL_ICON_GAP_PX,
  HOME_BANNERS_CTA_LABEL_LINE_HEIGHT_PX,
  HOME_BANNERS_CTA_PADDING_LEFT_PX,
  HOME_BANNERS_CTA_PADDING_RIGHT_PX,
  HOME_BANNERS_CTA_PILL_RADIUS_PX,
  HOME_BANNERS_CTA_WIDTH_PX,
} from './home-banners-cta.constants';
import { HOME_APP_BANNER_INNER_CLASS } from './home-app-banner.constants';
import {
  HOME_MOBILE_BANNER_SHOWCASE_BG_POSITION_X_PX,
  HOME_MOBILE_BANNER_SHOWCASE_BG_POSITION_Y_PX,
  HOME_MOBILE_BANNER_SHOWCASE_BG_SIZE_HEIGHT_PERCENT,
  HOME_MOBILE_BANNER_SHOWCASE_BG_SIZE_WIDTH_PERCENT,
  HOME_MOBILE_BANNER_SHOWCASE_CARD_HEIGHT_PX,
  HOME_MOBILE_BANNER_SHOWCASE_CARD_MAX_WIDTH_PX,
  HOME_MOBILE_BANNER_SHOWCASE_CARD_WIDTH_PX,
  HOME_MOBILE_BANNER_SHOWCASE_CHAIR_BLEED_TOP_MAX_PX,
  HOME_MOBILE_BANNER_SHOWCASE_CHAIR_BLEED_TOP_MIN_PX,
  HOME_MOBILE_BANNER_SHOWCASE_CHAIR_BLEED_TOP_VW,
  HOME_MOBILE_BANNER_SHOWCASE_CHAIR_NUDGE_DOWN_PX,
  HOME_MOBILE_BANNER_SHOWCASE_CHAIR_SCALE_MULTIPLIER,
  HOME_MOBILE_BANNER_SHOWCASE_CHAIR_WIDTH_FRAC,
  HOME_MOBILE_BANNER_SHOWCASE_FOOTER_PAD_BOTTOM_PX,
  HOME_MOBILE_BANNER_SHOWCASE_FOOTER_PAD_TOP_PX,
  HOME_MOBILE_BANNER_SHOWCASE_FOOTER_PAD_X_PX,
  HOME_MOBILE_BANNER_SHOWCASE_IMAGE_PATH,
  HOME_MOBILE_BANNER_SHOWCASE_IMAGE_SIZES,
  HOME_MOBILE_BANNER_SHOWCASE_OVERLAY_OPACITY,
  HOME_MOBILE_BANNER_SHOWCASE_RADIUS_PX,
  HOME_MOBILE_BANNER_SHOWCASE_SURFACE_HEX,
} from './home-mobile-banner-product-showcase.constants';
import { HOME_GRADIENT_BANNER_CTA_LABEL_NUDGE_LEFT_PX } from './home-gradient-banner.constants';

const montserratShowcaseCta = Montserrat({
  weight: ['700'],
  subsets: ['cyrillic', 'latin'],
  display: 'swap',
});

const montserratShowcaseLabel = Montserrat({
  weight: ['400'],
  subsets: ['cyrillic', 'latin'],
  display: 'swap',
});

const chairInGroupHeightFrac = HERO_MOBILE_CHAIR_FRAME_HEIGHT_PX / HERO_MOBILE_CHAIR_GROUP_HEIGHT_PX;

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

type HomeMobileBannerProductShowcaseProps = {
  language: LanguageCode;
};

function buildShowcaseCardBackgroundStyle(): CSSProperties {
  const overlay = `rgb(47 75 93 / ${HOME_MOBILE_BANNER_SHOWCASE_OVERLAY_OPACITY})`;
  return {
    width: '100%',
    aspectRatio: `${HOME_MOBILE_BANNER_SHOWCASE_CARD_WIDTH_PX} / ${HOME_MOBILE_BANNER_SHOWCASE_CARD_HEIGHT_PX}`,
    borderRadius: `${HOME_MOBILE_BANNER_SHOWCASE_RADIUS_PX}px`,
    backgroundColor: HOME_MOBILE_BANNER_SHOWCASE_SURFACE_HEX,
    backgroundImage: `linear-gradient(0deg, ${overlay} 0%, ${overlay} 100%), url(${HOME_MOBILE_BANNER_SHOWCASE_IMAGE_PATH})`,
    backgroundPosition: `0 0, ${HOME_MOBILE_BANNER_SHOWCASE_BG_POSITION_X_PX}px ${HOME_MOBILE_BANNER_SHOWCASE_BG_POSITION_Y_PX}px`,
    backgroundSize: `auto, ${HOME_MOBILE_BANNER_SHOWCASE_BG_SIZE_WIDTH_PERCENT}% ${HOME_MOBILE_BANNER_SHOWCASE_BG_SIZE_HEIGHT_PERCENT}%`,
    backgroundRepeat: 'no-repeat, no-repeat',
  };
}

function buildShowcaseChairGroupStyle(): CSSProperties {
  const translateY =
    HOME_MOBILE_BANNER_SHOWCASE_CHAIR_NUDGE_DOWN_PX +
    HERO_MOBILE_CHAIR_GROUP_NUDGE_DOWN_PX -
    HERO_MOBILE_CHAIR_GROUP_NUDGE_UP_PX;

  const chairScale =
    HERO_MOBILE_CHAIR_GROUP_SCALE * HOME_MOBILE_BANNER_SHOWCASE_CHAIR_SCALE_MULTIPLIER;

  return {
    left: '50%',
    top: 0,
    width: `min(${HOME_MOBILE_BANNER_SHOWCASE_CHAIR_WIDTH_FRAC * HOME_MOBILE_BANNER_SHOWCASE_CARD_WIDTH_PX}px, ${HOME_MOBILE_BANNER_SHOWCASE_CHAIR_WIDTH_FRAC * 100}%)`,
    aspectRatio: `${HERO_MOBILE_CHAIR_FRAME_WIDTH_PX} / ${HERO_MOBILE_CHAIR_GROUP_HEIGHT_PX}`,
    maxWidth: `min(${HOME_MOBILE_BANNER_SHOWCASE_CHAIR_WIDTH_FRAC * HOME_MOBILE_BANNER_SHOWCASE_CARD_WIDTH_PX}px, calc(100% - 0.25rem))`,
    transformOrigin: '50% 100%',
    transform: `translateX(-50%) translateY(${translateY}px) scale(${chairScale})`,
  };
}

const showcaseCtaLinkStyle: CSSProperties = {
  height: HOME_BANNERS_CTA_HEIGHT_PX,
  minHeight: HOME_BANNERS_CTA_HEIGHT_PX,
  maxWidth: HOME_BANNERS_CTA_WIDTH_PX,
  width: '100%',
  borderRadius: HOME_BANNERS_CTA_PILL_RADIUS_PX,
  paddingLeft: HOME_BANNERS_CTA_PADDING_LEFT_PX,
  paddingRight: HOME_BANNERS_CTA_PADDING_RIGHT_PX,
  gap: HOME_BANNERS_CTA_LABEL_ICON_GAP_PX,
  fontSize: 12,
  lineHeight: '16px',
};

const showcaseCtaIconFrameStyle: CSSProperties = {
  width: HOME_BANNERS_CTA_ICON_CIRCLE_PX,
  height: HOME_BANNERS_CTA_ICON_CIRCLE_PX,
  marginLeft: -HOME_BANNERS_CTA_ICON_PULL_LEFT_PX,
};

/** Matches `HomePromoMobileHeroSlateLabel` typography (Figma 314:2399). */
const showcaseLabelStyle: CSSProperties = {
  fontSize: HERO_MOBILE_SLATE_LABEL_FONT_SIZE_PX + 1,
  lineHeight: `${HERO_MOBILE_SLATE_LABEL_LINE_HEIGHT_PX}px`,
  width: `${HERO_MOBILE_SLATE_LABEL_MAX_WIDTH_PX}px`,
  transform: 'translate(14px, 6px)',
};

const showcaseBleedPaddingStyle: CSSProperties = {
  paddingTop: `clamp(${HOME_MOBILE_BANNER_SHOWCASE_CHAIR_BLEED_TOP_MIN_PX}px, ${HOME_MOBILE_BANNER_SHOWCASE_CHAIR_BLEED_TOP_VW}vw, ${HOME_MOBILE_BANNER_SHOWCASE_CHAIR_BLEED_TOP_MAX_PX}px)`,
};

/**
 * Figma 314:2479 — mobile-only promo card under the app download banner (`FeaturedProductsTabs`).
 */
export function HomeMobileBannerProductShowcase({ language }: HomeMobileBannerProductShowcaseProps) {
  const ctaLabel = t(language, 'home.promo_featured_cta');
  const ctaAria = `${ctaLabel}. ${t(language, 'home.promo_featured_title')}`;
  const regionAria = t(language, 'home.promo_featured_title');
  const isRussian = language === 'ru';
  const isArmenian = language === 'hy';

  const showcaseOuterStyle: CSSProperties = {
    width: '100%',
    maxWidth: `${HOME_MOBILE_BANNER_SHOWCASE_CARD_MAX_WIDTH_PX}px`,
  };

  return (
    <div className={HOME_APP_BANNER_INNER_CLASS}>
      <div
        className="relative mx-auto -mt-8 mb-5 w-full overflow-visible pb-0"
        style={{ ...showcaseBleedPaddingStyle, ...showcaseOuterStyle }}
      >
        <div
          className="pointer-events-none absolute z-[2] box-border"
          style={buildShowcaseChairGroupStyle()}
          aria-hidden
        >
          <div className="relative h-full w-full">
            <div className="absolute z-[1]" style={floorShadowStyle}>
              <div className="relative h-full w-full">
                <Image
                  src={HERO_PROMO_CHAIR_SHADOW_IMAGE_SRC}
                  alt=""
                  fill
                  sizes={HOME_MOBILE_BANNER_SHOWCASE_IMAGE_SIZES}
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
                      sizes={HOME_MOBILE_BANNER_SHOWCASE_IMAGE_SIZES}
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
                  sizes={HOME_MOBILE_BANNER_SHOWCASE_IMAGE_SIZES}
                  className="absolute left-0 max-w-none w-full select-none"
                  style={chairImageStyle}
                />
              </div>
            </div>
          </div>
        </div>

        <div
          className="relative z-[1] w-full overflow-hidden"
          style={buildShowcaseCardBackgroundStyle()}
          role="region"
          aria-label={regionAria}
        >
          <div
            className="absolute inset-x-0 bottom-0 z-[3] flex flex-row items-end justify-between gap-3"
            style={{
              paddingLeft: `${HOME_MOBILE_BANNER_SHOWCASE_FOOTER_PAD_X_PX}px`,
              paddingRight: `${HOME_MOBILE_BANNER_SHOWCASE_FOOTER_PAD_X_PX}px`,
              paddingBottom: `${HOME_MOBILE_BANNER_SHOWCASE_FOOTER_PAD_BOTTOM_PX}px`,
              paddingTop: `${HOME_MOBILE_BANNER_SHOWCASE_FOOTER_PAD_TOP_PX}px`,
            }}
          >
            <Link
              href="/products"
              className={`${montserratShowcaseCta.className} group pointer-events-auto flex min-w-0 shrink-0 items-center bg-marco-yellow font-bold text-marco-black transition hover:-translate-y-0.5 hover:bg-red-700 hover:text-white active:translate-y-px`}
              style={{
                ...showcaseCtaLinkStyle,
                fontSize: isRussian ? 12 : isArmenian ? 15 : HOME_BANNERS_CTA_LABEL_FONT_SIZE_PX,
                lineHeight: isRussian ? '16px' : `${HOME_BANNERS_CTA_LABEL_LINE_HEIGHT_PX}px`,
              }}
              aria-label={ctaAria}
            >
              <span
                className="min-w-0 shrink whitespace-nowrap text-left"
                style={{
                  transform: `translateX(${isRussian ? HOME_GRADIENT_BANNER_CTA_LABEL_NUDGE_LEFT_PX - 17 : HOME_GRADIENT_BANNER_CTA_LABEL_NUDGE_LEFT_PX}px)`,
                }}
              >
                {ctaLabel}
              </span>
              <span
                className="flex shrink-0 items-center justify-center rounded-full bg-marco-black text-white transition group-hover:bg-white group-hover:text-red-700"
                style={isRussian ? { ...showcaseCtaIconFrameStyle, transform: 'translateX(-6px)' } : showcaseCtaIconFrameStyle}
                aria-hidden
              >
                <ArrowUpRight
                  width={HOME_BANNERS_CTA_ARROW_ICON_PX}
                  height={HOME_BANNERS_CTA_ARROW_ICON_PX}
                  strokeWidth={2.5}
                />
              </span>
            </Link>
            <div
              className={`${montserratShowcaseLabel.className} flex shrink-0 flex-col justify-center leading-[0] not-italic text-left text-white`}
              style={showcaseLabelStyle}
            >
              <p className="mb-0">{t(language, 'home.promo_mobile_slate_label_line1')}</p>
              <p className="mb-0">{t(language, 'home.promo_mobile_slate_label_line2')}</p>
              <p className="mb-0">{t(language, 'home.promo_mobile_slate_label_line3')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
