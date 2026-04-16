import type { CSSProperties } from 'react';
import { Montserrat } from 'next/font/google';

import { t } from '../../lib/i18n';
import type { LanguageCode } from '../../lib/language';
import { HOME_APP_BANNER_INNER_CLASS } from './home-app-banner.constants';
import {
  HOME_GRADIENT_BANNER_ASPECT_RATIO,
  HOME_GRADIENT_BANNER_BG_POSITION_X_PERCENT,
  HOME_GRADIENT_BANNER_BG_POSITION_Y_PERCENT,
  HOME_GRADIENT_BANNER_CTA_ROW_OFFSET_X_PX,
  HOME_GRADIENT_BANNER_CTA_ROW_OFFSET_Y_PX,
  HOME_GRADIENT_BANNER_HEADLINE_COLOR_HEX,
  HOME_GRADIENT_BANNER_HEADLINE_FONT_SIZE_CLAMP,
  HOME_GRADIENT_BANNER_SURFACE_BASE_HEX,
  HOME_GRADIENT_BANNER_HEADLINE_LINE_HEIGHT_RATIO,
  HOME_GRADIENT_BANNER_IMAGE_PATH,
  HOME_GRADIENT_BANNER_OFFSET_LEFT_PX,
  HOME_GRADIENT_BANNER_OVERLAY_OPACITY,
  HOME_GRADIENT_BANNER_SECTION_MARGIN_TOP_PX,
  HOME_GRADIENT_BANNER_RADIUS_PX,
} from './home-gradient-banner.constants';
import {
  HOME_BANNERS_ROW_GAP_PX,
  HOME_BANNERS_TWO_COL_GRID_CLASS,
} from './home-secondary-banner.constants';
import { HomeSecondaryBanner } from './HomeSecondaryBanner';
import { HomeGradientBannerCta } from './HomeGradientBannerCta';

const montserratBanner = Montserrat({
  subsets: ['latin'],
  weight: ['900'],
  display: 'swap',
});

type HomeGradientBannerProps = {
  language: LanguageCode;
};

function buildBannerSurfaceStyle(): CSSProperties {
  const overlay = `rgba(47 75 93 / ${HOME_GRADIENT_BANNER_OVERLAY_OPACITY})`;
  return {
    width: '100%',
    marginLeft: `${HOME_GRADIENT_BANNER_OFFSET_LEFT_PX}px`,
    aspectRatio: HOME_GRADIENT_BANNER_ASPECT_RATIO,
    borderRadius: `${HOME_GRADIENT_BANNER_RADIUS_PX}px`,
    backgroundColor: HOME_GRADIENT_BANNER_SURFACE_BASE_HEX,
    backgroundImage: `linear-gradient(0deg, ${overlay} 0%, ${overlay} 100%), url(${HOME_GRADIENT_BANNER_IMAGE_PATH})`,
    /** Photo: `cover` removes edge bands; % position approximates Figma 101:4135 framing. */
    backgroundPosition: `0 0, ${HOME_GRADIENT_BANNER_BG_POSITION_X_PERCENT}% ${HOME_GRADIENT_BANNER_BG_POSITION_Y_PERCENT}%`,
    backgroundSize: `100% 100%, cover`,
    backgroundRepeat: 'no-repeat, no-repeat',
  };
}

const headlineStyle = {
  color: HOME_GRADIENT_BANNER_HEADLINE_COLOR_HEX,
  fontSize: HOME_GRADIENT_BANNER_HEADLINE_FONT_SIZE_CLAMP,
  lineHeight: HOME_GRADIENT_BANNER_HEADLINE_LINE_HEIGHT_RATIO,
} as const;

/**
 * Gradient banner (Figma 101:4129/4145; photo fill 101:4135) + pale panel (307:2232) on large screens.
 */
export function HomeGradientBanner({ language }: HomeGradientBannerProps) {
  const headline = t(language, 'home.gradient_banner.headline');

  return (
    <div
      className="w-full bg-white pb-10 pt-6"
      style={{ marginTop: `${HOME_GRADIENT_BANNER_SECTION_MARGIN_TOP_PX}px` }}
    >
      <div
        className={`${HOME_APP_BANNER_INNER_CLASS} grid w-full grid-cols-1 ${HOME_BANNERS_TWO_COL_GRID_CLASS} md:items-stretch`}
        style={{ gap: `${HOME_BANNERS_ROW_GAP_PX}px` }}
      >
        <div className="min-w-0">
          <div
            className={`relative w-full max-w-[min(100%,460px)] overflow-hidden md:max-w-[min(100%,320px)] lg:max-w-[min(100%,460px)] ${montserratBanner.className}`}
            style={buildBannerSurfaceStyle()}
            role="region"
            aria-label={t(language, 'home.gradient_banner.aria')}
          >
            <div className="absolute inset-0 flex flex-col pb-5 pt-4">
              <div className="flex min-h-0 flex-1 items-center justify-center px-2">
                <p
                  className="pointer-events-none max-w-full text-center font-black uppercase tracking-[-0.02em]"
                  style={headlineStyle}
                >
                  {headline}
                </p>
              </div>
              <div
                className="pointer-events-auto flex shrink-0 justify-start"
                style={{
                  transform: `translate(${HOME_GRADIENT_BANNER_CTA_ROW_OFFSET_X_PX}px, ${HOME_GRADIENT_BANNER_CTA_ROW_OFFSET_Y_PX}px)`,
                }}
              >
                <HomeGradientBannerCta language={language} />
              </div>
            </div>
          </div>
        </div>
        <div className="flex min-h-0 min-w-0">
          <HomeSecondaryBanner language={language} />
        </div>
      </div>
    </div>
  );
}
