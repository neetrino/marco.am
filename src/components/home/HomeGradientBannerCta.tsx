import type { CSSProperties } from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { Montserrat } from 'next/font/google';

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
import {
  HOME_GRADIENT_BANNER_CTA_ARROW_ICON_RU_PX,
  HOME_GRADIENT_BANNER_CTA_ICON_CIRCLE_RU_PX,
  HOME_GRADIENT_BANNER_CTA_ICON_PULL_LEFT_RU_EXTRA_PX,
  HOME_GRADIENT_BANNER_CTA_LABEL_NUDGE_LEFT_PX,
  HOME_GRADIENT_BANNER_CTA_LABEL_NUDGE_LEFT_RU_EXTRA_PX,
} from './home-gradient-banner.constants';
import { t } from '../../lib/i18n';
import type { LanguageCode } from '../../lib/language';

const montserratSlateCta = Montserrat({
  weight: '700',
  subsets: ['cyrillic', 'latin'],
  display: 'swap',
});

const slateCtaLinkStyleBase: CSSProperties = {
  height: HOME_BANNERS_CTA_HEIGHT_PX,
  minHeight: HOME_BANNERS_CTA_HEIGHT_PX,
  maxWidth: HOME_BANNERS_CTA_WIDTH_PX,
  width: '100%',
  borderRadius: HOME_BANNERS_CTA_PILL_RADIUS_PX,
  paddingLeft: HOME_BANNERS_CTA_PADDING_LEFT_PX,
  paddingRight: HOME_BANNERS_CTA_PADDING_RIGHT_PX,
  gap: HOME_BANNERS_CTA_LABEL_ICON_GAP_PX,
};

const slateCtaLinkStyle: CSSProperties = {
  ...slateCtaLinkStyleBase,
  fontSize: HOME_BANNERS_CTA_LABEL_FONT_SIZE_PX,
  lineHeight: `${HOME_BANNERS_CTA_LABEL_LINE_HEIGHT_PX}px`,
};

function omitMaxWidth(style: CSSProperties): CSSProperties {
  const { maxWidth: _omit, ...rest } = style;
  return rest;
}

function buildIconFrameStyle(language: LanguageCode): CSSProperties {
  const pullLeft =
    HOME_BANNERS_CTA_ICON_PULL_LEFT_PX +
    (language === 'ru' ? HOME_GRADIENT_BANNER_CTA_ICON_PULL_LEFT_RU_EXTRA_PX : 0);
  const size =
    language === 'ru' ? HOME_GRADIENT_BANNER_CTA_ICON_CIRCLE_RU_PX : HOME_BANNERS_CTA_ICON_CIRCLE_PX;
  return {
    width: size,
    height: size,
    marginLeft: -pullLeft,
  };
}

type HomeGradientBannerCtaProps = {
  language: LanguageCode;
};

/**
 * Pill shell matches hero slate CTA; dimensions from `home-banners-cta.constants` (slightly smaller).
 */
export function HomeGradientBannerCta({ language }: HomeGradientBannerCtaProps) {
  const label = t(language, 'home.promo_featured_cta');
  const ariaLabel = `${t(language, 'home.promo_featured_cta')}. ${t(language, 'home.promo_featured_title')}`;

  const labelNudgeLeftPx =
    HOME_GRADIENT_BANNER_CTA_LABEL_NUDGE_LEFT_PX +
    (language === 'ru' ? HOME_GRADIENT_BANNER_CTA_LABEL_NUDGE_LEFT_RU_EXTRA_PX : 0);

  const iconFrameStyle = buildIconFrameStyle(language);
  const arrowIconPx =
    language === 'ru' ? HOME_GRADIENT_BANNER_CTA_ARROW_ICON_RU_PX : HOME_BANNERS_CTA_ARROW_ICON_PX;

  const linkStyle =
    language === 'ru'
      ? slateCtaLinkStyleBase
      : language === 'en'
        ? omitMaxWidth(slateCtaLinkStyle)
        : slateCtaLinkStyle;

  /** English: narrower pill on `lg` (`max-w` from right) — `154px` = `HOME_BANNERS_CTA_MAX_WIDTH_EN_DESKTOP_PX`. */
  const enDesktopPillClass = language === 'en' ? 'max-w-[170px] lg:max-w-[154px]' : '';

  /**
   * Russian: label sizes from `HOME_BANNERS_CTA_*` / `HOME_GRADIENT_BANNER_CTA_LABEL_*_RU_DESKTOP_*` (Tailwind literals for JIT).
   */
  const labelSpanClassName =
    language === 'ru'
      ? 'min-w-0 shrink whitespace-nowrap text-left text-[13px] leading-5 lg:text-[12px] lg:leading-[18px]'
      : 'min-w-0 shrink whitespace-nowrap text-left';

  /**
   * Armenian (`hy`): label + chip right on `lg` — net `lg:translate-x-[2px]` = `LABEL_NUDGE_LEFT_PX` + `LABEL_NUDGE_LEFT_HY_DESKTOP_EXTRA_PX`; `lg:translate-x-[12px]` on chip matches `ICON_CIRCLE_NUDGE_RIGHT_HY_DESKTOP_PX`.
   */
  const labelHyDesktopClass =
    language === 'hy'
      ? 'translate-x-[-6px] lg:translate-x-[2px]'
      : '';

  /** Desktop (`lg`) only: black chip `translateX` — matches `HOME_GRADIENT_BANNER_CTA_ICON_CIRCLE_NUDGE_LEFT_RU_DESKTOP_PX`. */
  const iconRuDesktopTranslateClass = language === 'ru' ? 'lg:-translate-x-[3px]' : '';

  const iconHyDesktopTranslateClass = language === 'hy' ? 'lg:translate-x-[12px]' : '';

  return (
    <Link
      href="/products"
      className={`${montserratSlateCta.className} group pointer-events-auto flex w-full max-w-full shrink-0 items-center bg-marco-yellow font-bold text-marco-black transition hover:-translate-y-0.5 hover:bg-red-700 hover:text-white active:translate-y-px ${enDesktopPillClass}`}
      style={linkStyle}
      aria-label={ariaLabel}
    >
      <span
        className={`${language === 'hy' ? `${labelSpanClassName} ${labelHyDesktopClass}` : labelSpanClassName}`}
        style={
          language === 'hy'
            ? undefined
            : {
                transform: `translateX(${labelNudgeLeftPx}px)`,
              }
        }
      >
        {label}
      </span>
      <span
        className={`flex shrink-0 items-center justify-center rounded-full bg-marco-black text-white transition group-hover:bg-white group-hover:text-red-700 ${iconRuDesktopTranslateClass} ${iconHyDesktopTranslateClass}`}
        style={iconFrameStyle}
        aria-hidden
      >
        <ArrowUpRight
          width={arrowIconPx}
          height={arrowIconPx}
          strokeWidth={2.5}
        />
      </span>
    </Link>
  );
}
