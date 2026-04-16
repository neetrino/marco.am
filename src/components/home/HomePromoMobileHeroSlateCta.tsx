'use client';

import type { CSSProperties } from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { Montserrat } from 'next/font/google';
import { useTranslation } from '../../lib/i18n-client';
import {
  HERO_MOBILE_SLATE_CTA_ARROW_ICON_PX,
  HERO_MOBILE_SLATE_CTA_EN_ARROW_ICON_PX,
  HERO_MOBILE_SLATE_CTA_EN_HEIGHT_PX,
  HERO_MOBILE_SLATE_CTA_EN_ICON_CIRCLE_PX,
  HERO_MOBILE_SLATE_CTA_EN_ICON_NUDGE_X_PX,
  HERO_MOBILE_SLATE_CTA_EN_PADDING_LEFT_PX,
  HERO_MOBILE_SLATE_CTA_EN_PILL_RADIUS_PX,
  HERO_MOBILE_SLATE_CTA_EN_WIDTH_PX,
  HERO_MOBILE_SLATE_CTA_HEIGHT_PX,
  HERO_MOBILE_SLATE_CTA_RU_ARROW_ICON_PX,
  HERO_MOBILE_SLATE_CTA_RU_HEIGHT_PX,
  HERO_MOBILE_SLATE_CTA_RU_ICON_CIRCLE_PX,
  HERO_MOBILE_SLATE_CTA_RU_ICON_NUDGE_X_PX,
  HERO_MOBILE_SLATE_CTA_RU_PADDING_LEFT_PX,
  HERO_MOBILE_SLATE_CTA_RU_PILL_RADIUS_PX,
  HERO_MOBILE_SLATE_CTA_RU_WIDTH_PX,
  HERO_MOBILE_SLATE_CTA_HY_ARROW_ICON_PX,
  HERO_MOBILE_SLATE_CTA_HY_HEIGHT_PX,
  HERO_MOBILE_SLATE_CTA_HY_ICON_CIRCLE_PX,
  HERO_MOBILE_SLATE_CTA_HY_LABEL_ICON_GAP_PX,
  HERO_MOBILE_SLATE_CTA_HY_ICON_NUDGE_X_PX,
  HERO_MOBILE_SLATE_CTA_HY_PADDING_LEFT_PX,
  HERO_MOBILE_SLATE_CTA_HY_PILL_RADIUS_PX,
  HERO_MOBILE_SLATE_CTA_HY_WIDTH_PX,
  HERO_MOBILE_SLATE_CTA_ICON_CIRCLE_PX,
  HERO_MOBILE_SLATE_CTA_ICON_PULL_LEFT_PX,
  HERO_MOBILE_SLATE_CTA_LABEL_ICON_GAP_PX,
  HERO_MOBILE_SLATE_CTA_NUDGE_RIGHT_PX,
  HERO_MOBILE_SLATE_CTA_NUDGE_UP_PX,
  HERO_MOBILE_SLATE_CTA_PADDING_LEFT_PX,
  HERO_MOBILE_SLATE_CTA_PADDING_RIGHT_PX,
  HERO_MOBILE_SLATE_CTA_PILL_RADIUS_PX,
  HERO_MOBILE_SLATE_CTA_WIDTH_PX,
  HERO_MOBILE_SLATE_PANEL_BOX_STYLE,
} from '../hero.constants';

const montserratSlateCta = Montserrat({
  weight: ['700', '800'],
  subsets: ['cyrillic', 'latin'],
  display: 'swap',
});

const slateCtaLinkStyle: CSSProperties = {
  height: HERO_MOBILE_SLATE_CTA_HEIGHT_PX,
  minHeight: HERO_MOBILE_SLATE_CTA_HEIGHT_PX,
  maxWidth: HERO_MOBILE_SLATE_CTA_WIDTH_PX,
  width: '100%',
  borderRadius: HERO_MOBILE_SLATE_CTA_PILL_RADIUS_PX,
  paddingLeft: HERO_MOBILE_SLATE_CTA_PADDING_LEFT_PX,
  paddingRight: HERO_MOBILE_SLATE_CTA_PADDING_RIGHT_PX,
  gap: HERO_MOBILE_SLATE_CTA_LABEL_ICON_GAP_PX,
};

const slateCtaLinkStyleEn: CSSProperties = {
  height: HERO_MOBILE_SLATE_CTA_EN_HEIGHT_PX,
  minHeight: HERO_MOBILE_SLATE_CTA_EN_HEIGHT_PX,
  maxWidth: HERO_MOBILE_SLATE_CTA_EN_WIDTH_PX,
  width: '100%',
  borderRadius: HERO_MOBILE_SLATE_CTA_EN_PILL_RADIUS_PX,
  paddingLeft: HERO_MOBILE_SLATE_CTA_EN_PADDING_LEFT_PX,
  paddingRight: HERO_MOBILE_SLATE_CTA_PADDING_RIGHT_PX,
  gap: HERO_MOBILE_SLATE_CTA_LABEL_ICON_GAP_PX,
};

const slateCtaIconFrameStyle: CSSProperties = {
  width: HERO_MOBILE_SLATE_CTA_ICON_CIRCLE_PX,
  height: HERO_MOBILE_SLATE_CTA_ICON_CIRCLE_PX,
  marginLeft: -HERO_MOBILE_SLATE_CTA_ICON_PULL_LEFT_PX,
};

const slateCtaIconFrameStyleEn: CSSProperties = {
  width: HERO_MOBILE_SLATE_CTA_EN_ICON_CIRCLE_PX,
  height: HERO_MOBILE_SLATE_CTA_EN_ICON_CIRCLE_PX,
  marginLeft: -HERO_MOBILE_SLATE_CTA_ICON_PULL_LEFT_PX,
};

const slateCtaLinkStyleRu: CSSProperties = {
  height: HERO_MOBILE_SLATE_CTA_RU_HEIGHT_PX,
  minHeight: HERO_MOBILE_SLATE_CTA_RU_HEIGHT_PX,
  maxWidth: HERO_MOBILE_SLATE_CTA_RU_WIDTH_PX,
  width: '100%',
  borderRadius: HERO_MOBILE_SLATE_CTA_RU_PILL_RADIUS_PX,
  paddingLeft: HERO_MOBILE_SLATE_CTA_RU_PADDING_LEFT_PX,
  paddingRight: HERO_MOBILE_SLATE_CTA_PADDING_RIGHT_PX,
  gap: HERO_MOBILE_SLATE_CTA_LABEL_ICON_GAP_PX,
};

const slateCtaIconFrameStyleRu: CSSProperties = {
  width: HERO_MOBILE_SLATE_CTA_RU_ICON_CIRCLE_PX,
  height: HERO_MOBILE_SLATE_CTA_RU_ICON_CIRCLE_PX,
  marginLeft: -HERO_MOBILE_SLATE_CTA_ICON_PULL_LEFT_PX,
};

const slateCtaLinkStyleHy: CSSProperties = {
  height: HERO_MOBILE_SLATE_CTA_HY_HEIGHT_PX,
  minHeight: HERO_MOBILE_SLATE_CTA_HY_HEIGHT_PX,
  maxWidth: HERO_MOBILE_SLATE_CTA_HY_WIDTH_PX,
  width: '100%',
  borderRadius: HERO_MOBILE_SLATE_CTA_HY_PILL_RADIUS_PX,
  paddingLeft: HERO_MOBILE_SLATE_CTA_HY_PADDING_LEFT_PX,
  paddingRight: HERO_MOBILE_SLATE_CTA_PADDING_RIGHT_PX,
  gap: HERO_MOBILE_SLATE_CTA_HY_LABEL_ICON_GAP_PX,
};

const slateCtaIconFrameStyleHy: CSSProperties = {
  width: HERO_MOBILE_SLATE_CTA_HY_ICON_CIRCLE_PX,
  height: HERO_MOBILE_SLATE_CTA_HY_ICON_CIRCLE_PX,
  marginLeft: -HERO_MOBILE_SLATE_CTA_ICON_PULL_LEFT_PX,
};

/**
 * Figma 314:2394 — yellow pill + black arrow chip; `z-[12]` under chair (`z-[13]`) so legs overlap CTA.
 */
export function HomePromoMobileHeroSlateCta() {
  const { t, lang } = useTranslation();
  const isRussian = lang === 'ru';
  const isArmenian = lang === 'hy';
  const isEnglish = lang === 'en';

  const ctaShellStyle = isArmenian
    ? slateCtaLinkStyleHy
    : isRussian
      ? slateCtaLinkStyleRu
      : isEnglish
        ? slateCtaLinkStyleEn
        : slateCtaLinkStyle;
  const arrowIconPx = isArmenian
    ? HERO_MOBILE_SLATE_CTA_HY_ARROW_ICON_PX
    : isRussian
      ? HERO_MOBILE_SLATE_CTA_RU_ARROW_ICON_PX
      : isEnglish
        ? HERO_MOBILE_SLATE_CTA_EN_ARROW_ICON_PX
        : HERO_MOBILE_SLATE_CTA_ARROW_ICON_PX;

  return (
    <div
      className="pointer-events-none absolute z-[12] box-border flex flex-col justify-end md:hidden"
      style={HERO_MOBILE_SLATE_PANEL_BOX_STYLE}
    >
      <div
        className="pointer-events-none flex w-full justify-center px-2 pb-1.5 pt-0"
        style={{
          transform: `translate(${HERO_MOBILE_SLATE_CTA_NUDGE_RIGHT_PX}px, -${HERO_MOBILE_SLATE_CTA_NUDGE_UP_PX}px)`,
        }}
      >
        <Link
          href="/products"
          className={`${montserratSlateCta.className} group pointer-events-auto flex w-full max-w-full shrink-0 items-center bg-marco-yellow ${
            isArmenian
              ? 'text-[14px] font-extrabold leading-[20px]'
              : isRussian
                ? 'text-[12px] font-bold leading-[16px]'
                : isEnglish
                  ? 'text-[14px] font-bold leading-5'
                  : 'text-base font-bold leading-6'
          } text-marco-black transition hover:-translate-y-0.5 hover:bg-red-700 hover:text-white active:translate-y-px`}
          style={ctaShellStyle}
          aria-label={`${t('home.promo_featured_cta')}. ${t('home.promo_featured_title')}`}
        >
          <span
            className={`whitespace-nowrap text-left ${
              isArmenian
                ? 'min-w-0 flex-1 translate-x-1 pr-3'
                : isRussian
                  ? 'min-w-0 shrink -translate-x-3'
                  : isEnglish
                    ? 'min-w-0 shrink -translate-x-1'
                    : 'min-w-0 shrink'
            }`}
          >
            {t('home.promo_featured_cta')}
          </span>
          <span
            className="flex shrink-0 items-center justify-center rounded-full bg-marco-black text-white transition group-hover:bg-white group-hover:text-red-700"
            style={
              isRussian
                ? {
                    ...slateCtaIconFrameStyleRu,
                    transform: `translateX(${HERO_MOBILE_SLATE_CTA_RU_ICON_NUDGE_X_PX}px)`,
                  }
                : isArmenian
                  ? {
                      ...slateCtaIconFrameStyleHy,
                      transform: `translateX(${HERO_MOBILE_SLATE_CTA_HY_ICON_NUDGE_X_PX}px)`,
                    }
                  : isEnglish
                    ? {
                        ...slateCtaIconFrameStyleEn,
                        transform: `translateX(${HERO_MOBILE_SLATE_CTA_EN_ICON_NUDGE_X_PX}px)`,
                      }
                    : { ...slateCtaIconFrameStyle, transform: 'translateX(6px)' }
            }
            aria-hidden
          >
            <ArrowUpRight
              width={arrowIconPx}
              height={arrowIconPx}
              strokeWidth={2.5}
            />
          </span>
        </Link>
      </div>
    </div>
  );
}
