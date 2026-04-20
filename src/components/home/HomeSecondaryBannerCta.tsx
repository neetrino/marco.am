import type { CSSProperties } from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { Montserrat } from 'next/font/google';

import {
  HOME_BANNERS_CTA_ARROW_ICON_PX,
  HOME_BANNERS_CTA_HEIGHT_PX,
  HOME_BANNERS_CTA_ICON_CIRCLE_PX,
  HOME_BANNERS_CTA_LABEL_FONT_SIZE_PX,
  HOME_BANNERS_CTA_LABEL_ICON_GAP_PX,
  HOME_BANNERS_CTA_LABEL_LINE_HEIGHT_PX,
  HOME_BANNERS_CTA_PADDING_LEFT_PX,
  HOME_BANNERS_CTA_PADDING_RIGHT_PX,
  HOME_BANNERS_CTA_PILL_RADIUS_PX,
  HOME_BANNERS_CTA_WIDTH_PX,
} from './home-banners-cta.constants';
import { t } from '../../lib/i18n';
import type { LanguageCode } from '../../lib/language';
import {
  HOME_SECONDARY_BANNER_CTA_HREF,
  HOME_SECONDARY_BANNER_CTA_ICON_MARGIN_LEFT_PX,
  HOME_SECONDARY_BANNER_CTA_LABEL_NUDGE_RIGHT_PX,
} from './home-secondary-banner.constants';

const montserratSlateCta = Montserrat({
  weight: '700',
  subsets: ['cyrillic', 'latin'],
  display: 'swap',
});

const slateCtaLinkStyleBase: CSSProperties = {
  height: HOME_BANNERS_CTA_HEIGHT_PX,
  minHeight: HOME_BANNERS_CTA_HEIGHT_PX,
  width: '100%',
  borderRadius: HOME_BANNERS_CTA_PILL_RADIUS_PX,
  paddingRight: HOME_BANNERS_CTA_PADDING_RIGHT_PX,
  gap: HOME_BANNERS_CTA_LABEL_ICON_GAP_PX,
};

const slateCtaLinkStyle: CSSProperties = {
  ...slateCtaLinkStyleBase,
  maxWidth: HOME_BANNERS_CTA_WIDTH_PX,
  paddingLeft: HOME_BANNERS_CTA_PADDING_LEFT_PX,
  fontSize: HOME_BANNERS_CTA_LABEL_FONT_SIZE_PX,
  lineHeight: `${HOME_BANNERS_CTA_LABEL_LINE_HEIGHT_PX}px`,
};

const slateCtaIconFrameBaseStyle: CSSProperties = {
  width: HOME_BANNERS_CTA_ICON_CIRCLE_PX,
  height: HOME_BANNERS_CTA_ICON_CIRCLE_PX,
};

const slateCtaIconFrameStyle: CSSProperties = {
  ...slateCtaIconFrameBaseStyle,
  marginLeft: HOME_SECONDARY_BANNER_CTA_ICON_MARGIN_LEFT_PX,
};

/** EN/RU desktop: Tailwind sets height/radius at `lg`; strip so inline `height` does not block `lg:h-*`. */
function omitMaxWidthHeightRadius(style: CSSProperties): CSSProperties {
  const { maxWidth: _mw, height: _h, minHeight: _mh, borderRadius: _br, ...rest } = style;
  return rest;
}

type HomeSecondaryBannerCtaProps = {
  language: LanguageCode;
};

/**
 * Inverted surface (black pill, yellow chip); sizing shared with `HomeGradientBannerCta` via `home-banners-cta.constants`.
 */
export function HomeSecondaryBannerCta({ language }: HomeSecondaryBannerCtaProps) {
  const label = t(language, 'home.secondary_banner.cta');
  const ariaLabel = `${label}. ${t(language, 'home.secondary_banner.aria')}`;

  const isHy = language === 'hy';

  /**
   * Armenian (`hy`): `lg` — pill + label; literals match `HOME_SECONDARY_BANNER_CTA_*_HY_DESKTOP_*`.
   */
  const hyDesktopPillClass = isHy
    ? 'max-w-[170px] pl-[34px] lg:max-w-[158px] lg:pl-[26px] text-[13px] leading-5 lg:text-[15px] lg:leading-[22px]'
    : '';

  /**
   * Armenian: desktop chip — `lg:-translate-x-[3px]`; +7px right vs previous `-translate-x-[10px]`.
   */
  const hyDesktopIconTranslateClass = isHy ? 'lg:-translate-x-[3px]' : '';

  /** Armenian: `translate-x-[6px]` = `LABEL_NUDGE_RIGHT_PX`; `lg:translate-x-[14px]` = `LABEL_TRANSLATE_X_HY_DESKTOP_PX`. */
  const hyLabelTransformClass = isHy ? 'translate-x-[6px] lg:translate-x-[14px]' : '';

  const linkStyle: CSSProperties = isHy
    ? slateCtaLinkStyleBase
    : language === 'en' || language === 'ru'
      ? omitMaxWidthHeightRadius(slateCtaLinkStyle)
      : slateCtaLinkStyle;

  /** Shared `lg` sizing for EN/RU compact pills — height literals match `HOME_SECONDARY_BANNER_CTA_HEIGHT_EN_DESKTOP_PX`. */
  const secondaryBannerCompactDesktopPillBase =
    'h-12 min-h-12 max-w-[170px] rounded-[24px] lg:h-[45px] lg:min-h-[45px] lg:rounded-[22.5px]';

  /**
   * English: `lg:max-w` must match `HOME_SECONDARY_BANNER_CTA_MAX_WIDTH_EN_DESKTOP_PX` (148).
   */
  const enDesktopPillClass =
    language === 'en' && !isHy
      ? `${secondaryBannerCompactDesktopPillBase} lg:max-w-[148px]`
      : '';

  /**
   * Russian: `lg:max-w` must match `HOME_SECONDARY_BANNER_CTA_MAX_WIDTH_RU_DESKTOP_PX` (140).
   */
  const ruDesktopPillClass =
    language === 'ru' && !isHy
      ? `${secondaryBannerCompactDesktopPillBase} lg:max-w-[140px]`
      : '';

  return (
    <Link
      href={HOME_SECONDARY_BANNER_CTA_HREF}
      className={`${montserratSlateCta.className} group pointer-events-auto flex w-full shrink-0 items-center bg-black font-bold text-white transition hover:-translate-y-0.5 hover:bg-red-700 hover:text-white active:translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marco-black ${hyDesktopPillClass} ${enDesktopPillClass} ${ruDesktopPillClass}`}
      style={linkStyle}
      aria-label={ariaLabel}
    >
      <span
        className={`min-w-0 shrink whitespace-nowrap text-left ${hyLabelTransformClass}`}
        style={
          isHy
            ? undefined
            : {
                transform: `translateX(${HOME_SECONDARY_BANNER_CTA_LABEL_NUDGE_RIGHT_PX}px)`,
              }
        }
      >
        {label}
      </span>
      <span
        className={`flex shrink-0 items-center justify-center rounded-full bg-marco-yellow text-marco-black transition group-hover:bg-white group-hover:text-red-700 ${hyDesktopIconTranslateClass} ${
          language === 'ru' && !isHy
            ? 'h-9 w-9 lg:!h-[34px] lg:!w-[34px] lg:translate-x-[4px]'
            : ''
        }`}
        style={
          isHy
            ? {
                ...slateCtaIconFrameBaseStyle,
                marginLeft: HOME_SECONDARY_BANNER_CTA_ICON_MARGIN_LEFT_PX,
              }
            : language === 'ru'
              ? { marginLeft: HOME_SECONDARY_BANNER_CTA_ICON_MARGIN_LEFT_PX }
              : slateCtaIconFrameStyle
        }
        aria-hidden
      >
        <ArrowUpRight
          className={
            language === 'ru' && !isHy
              ? 'h-[18px] w-[18px] lg:h-[17px] lg:w-[17px]'
              : undefined
          }
          width={language === 'ru' && !isHy ? undefined : HOME_BANNERS_CTA_ARROW_ICON_PX}
          height={language === 'ru' && !isHy ? undefined : HOME_BANNERS_CTA_ARROW_ICON_PX}
          strokeWidth={2.5}
        />
      </span>
    </Link>
  );
}
