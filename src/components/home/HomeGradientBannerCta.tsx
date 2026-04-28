import type { CSSProperties } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { Montserrat } from 'next/font/google';

import { HomeFloorBannerSlackCtaLink } from './HomeFloorBannerSlackCtaLink';

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
  HOME_GRADIENT_BANNER_CTA_SLACK_HOVER_END_INSET_INLINE_START_PX,
  HOME_GRADIENT_BANNER_CTA_SLACK_REST_INSET_INLINE_END_PX,
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

  /** English: narrower pill on `lg` — literal must match `HOME_GRADIENT_BANNER_CTA_MAX_WIDTH_EN_DESKTOP_PX` (Tailwind JIT). */
  const enDesktopPillClass = language === 'en' ? 'max-w-[170px] lg:max-w-[162px]' : '';

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
  const iconRuDesktopTranslateClass = language === 'ru' ? 'lg:-translate-x-[4px]' : '';

  /**
   * Russian: label `translateX` — `-17px` = `LABEL_NUDGE_LEFT_PX` + `LABEL_NUDGE_LEFT_RU_EXTRA_PX`; `lg` `-18px` adds `LABEL_NUDGE_LEFT_RU_DESKTOP_EXTRA_PX`.
   */
  const labelRuTranslateClass =
    language === 'ru' ? 'translate-x-[-17px] lg:translate-x-[-18px]' : '';

  const iconHyDesktopTranslateClass = language === 'hy' ? 'lg:translate-x-[12px]' : '';

  return (
    <HomeFloorBannerSlackCtaLink
      href="/products"
      ariaLabel={ariaLabel}
      slackChipRestInsetInlineEndPx={HOME_GRADIENT_BANNER_CTA_SLACK_REST_INSET_INLINE_END_PX}
      slackStopPad={`${HOME_GRADIENT_BANNER_CTA_SLACK_HOVER_END_INSET_INLINE_START_PX}px`}
      className={`${montserratSlateCta.className} pointer-events-auto bg-marco-yellow font-bold text-[#050505] transition hover:-translate-y-0.5 active:translate-y-px dark:text-[#050505] ${enDesktopPillClass}`}
      style={linkStyle}
      trailClassName="bg-marco-black"
      labelWrapperClassName={`transition-colors [transition-duration:var(--slack-dur)] [transition-timing-function:var(--slack-ease)] motion-reduce:transition-none group-hover:text-white group-focus-visible:text-white dark:group-hover:text-white dark:group-focus-visible:text-white ${labelSpanClassName} ${language === 'hy' ? labelHyDesktopClass : ''} ${labelRuTranslateClass}`}
      label={
        <span
          style={
            language === 'hy' || language === 'ru'
              ? undefined
              : {
                  transform: `translateX(${labelNudgeLeftPx}px)`,
                }
          }
        >
          {label}
        </span>
      }
      chipInnerClassName={`flex shrink-0 items-center justify-center rounded-full bg-marco-black text-white transition-colors [transition-duration:var(--slack-dur)] [transition-timing-function:var(--slack-ease)] motion-reduce:transition-none group-hover:bg-marco-yellow group-hover:text-marco-black group-focus-visible:bg-marco-yellow group-focus-visible:text-marco-black dark:group-hover:bg-marco-yellow dark:group-hover:text-marco-black dark:group-focus-visible:bg-marco-yellow dark:group-focus-visible:text-marco-black ${iconRuDesktopTranslateClass} ${iconHyDesktopTranslateClass}`}
      chipInnerStyle={iconFrameStyle}
      chipChildren={
        <ArrowUpRight
          width={arrowIconPx}
          height={arrowIconPx}
          strokeWidth={2.5}
        />
      }
    />
  );
}
