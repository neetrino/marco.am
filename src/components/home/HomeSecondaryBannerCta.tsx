import type { CSSProperties } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { Montserrat } from 'next/font/google';

import { HomeFloorBannerSlackCtaLink } from './HomeFloorBannerSlackCtaLink';

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
  HOME_SECONDARY_BANNER_CTA_SLACK_HOVER_END_INSET_INLINE_START_PX,
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

type HomeSecondaryBannerCtaProps = {
  language: LanguageCode;
};

/**
 * Inverted surface (black pill, yellow chip); sizing shared with `HomeGradientBannerCta` via `home-banners-cta.constants`.
 */
export function HomeSecondaryBannerCta({ language }: HomeSecondaryBannerCtaProps) {
  const label = t(language, 'home.secondary_banner.cta');
  const ariaLabel = `${label}. ${t(language, 'home.secondary_banner.aria')}`;

  const useArmenianLikeLayout = language === 'hy' || language === 'en' || language === 'ru';

  /**
   * Match Armenian pill metrics for hy/en/ru so all locale labels keep the same visual balance.
   */
  const hyDesktopPillClass = useArmenianLikeLayout
    ? 'max-w-[170px] pl-[34px] lg:max-w-[158px] lg:pl-[26px] text-[13px] leading-5 lg:text-[15px] lg:leading-[22px]'
    : '';

  /**
   * Keep icon chip alignment consistent with Armenian across hy/en/ru.
   */
  const hyDesktopIconTranslateClass = useArmenianLikeLayout ? 'lg:-translate-x-[3px]' : '';

  /** Label nudge from the Armenian variant; prevents overlap with the leading icon chip. */
  const hyLabelTransformClass = useArmenianLikeLayout ? 'translate-x-[6px] lg:translate-x-[14px]' : '';

  const linkStyle: CSSProperties = useArmenianLikeLayout ? slateCtaLinkStyleBase : slateCtaLinkStyle;

  return (
    <HomeFloorBannerSlackCtaLink
      href={HOME_SECONDARY_BANNER_CTA_HREF}
      ariaLabel={ariaLabel}
      slackStopPad={`${HOME_SECONDARY_BANNER_CTA_SLACK_HOVER_END_INSET_INLINE_START_PX}px`}
      className={`${montserratSlateCta.className} pointer-events-auto bg-black font-bold text-white transition hover:-translate-y-0.5 active:translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marco-black dark:text-[#050505] ${hyDesktopPillClass}`}
      style={linkStyle}
      trailClassName="bg-marco-yellow"
      labelWrapperClassName={`min-w-0 shrink whitespace-nowrap text-left transition-colors [transition-duration:var(--slack-dur)] [transition-timing-function:var(--slack-ease)] motion-reduce:transition-none group-hover:text-marco-black group-focus-visible:text-marco-black dark:group-hover:text-marco-black dark:group-focus-visible:text-marco-black ${hyLabelTransformClass}`}
      label={
        <span
          style={
            useArmenianLikeLayout
              ? undefined
              : {
                  transform: `translateX(${HOME_SECONDARY_BANNER_CTA_LABEL_NUDGE_RIGHT_PX}px)`,
                }
          }
        >
          {label}
        </span>
      }
      chipInnerClassName={`flex shrink-0 items-center justify-center rounded-full bg-marco-yellow text-marco-black transition-colors [transition-duration:var(--slack-dur)] [transition-timing-function:var(--slack-ease)] motion-reduce:transition-none group-hover:bg-black group-hover:text-white group-focus-visible:bg-black group-focus-visible:text-white dark:group-hover:bg-black dark:group-hover:text-white dark:group-focus-visible:bg-black dark:group-focus-visible:text-white ${hyDesktopIconTranslateClass}`}
      chipInnerStyle={
        useArmenianLikeLayout
          ? {
              ...slateCtaIconFrameBaseStyle,
              marginLeft: HOME_SECONDARY_BANNER_CTA_ICON_MARGIN_LEFT_PX,
            }
          : slateCtaIconFrameStyle
      }
      chipChildren={
        <ArrowUpRight
          width={HOME_BANNERS_CTA_ARROW_ICON_PX}
          height={HOME_BANNERS_CTA_ARROW_ICON_PX}
          strokeWidth={2.5}
        />
      }
    />
  );
}
