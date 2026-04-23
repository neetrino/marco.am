import type { CSSProperties } from 'react';
import { Montserrat } from 'next/font/google';

import { t } from '../../lib/i18n';
import type { LanguageCode } from '../../lib/language';
import {
  HOME_SECONDARY_BANNER_BG_HEX,
  HOME_SECONDARY_BANNER_HEADLINE_FONT_SIZE_CLAMP,
  HOME_SECONDARY_BANNER_HEADLINE_LINE_HEIGHT_RATIO,
  HOME_SECONDARY_BANNER_CTA_ROW_OFFSET_X_PX,
  HOME_SECONDARY_BANNER_CTA_ROW_OFFSET_Y_PX,
  HOME_SECONDARY_BANNER_RADIUS_PX,
  HOME_SECONDARY_BANNER_STACK_ASPECT_CLASS,
} from './home-secondary-banner.constants';
import { HomeSecondaryBannerCta } from './HomeSecondaryBannerCta';

const montserratSecondaryHeadline = Montserrat({
  subsets: ['latin'],
  weight: ['900'],
  display: 'swap',
});

type HomeSecondaryBannerProps = {
  language: LanguageCode;
};

function buildSurfaceStyle(): CSSProperties {
  return {
    borderRadius: `${HOME_SECONDARY_BANNER_RADIUS_PX}px`,
    backgroundColor: HOME_SECONDARY_BANNER_BG_HEX,
  };
}

const headlineStyle = {
  fontSize: HOME_SECONDARY_BANNER_HEADLINE_FONT_SIZE_CLAMP,
  lineHeight: HOME_SECONDARY_BANNER_HEADLINE_LINE_HEIGHT_RATIO,
} as const;

/**
 * Figma 307:2232 panel, 307:2237 headline, 101:4130 CTA.
 */
export function HomeSecondaryBanner({ language }: HomeSecondaryBannerProps) {
  const headline = t(language, 'home.gradient_banner.headline');

  return (
    <div
      className={`relative flex h-full w-full min-h-0 ${HOME_SECONDARY_BANNER_STACK_ASPECT_CLASS} flex-col overflow-hidden md:aspect-auto ${montserratSecondaryHeadline.className}`}
      style={buildSurfaceStyle()}
      role="region"
      aria-label={t(language, 'home.secondary_banner.aria')}
    >
      <div className="flex min-h-0 flex-1 items-center justify-center px-2 pt-2 text-center">
        <p
          className="pointer-events-none max-w-full font-black uppercase tracking-[-0.02em] text-white"
          style={headlineStyle}
        >
          {headline}
        </p>
      </div>
      <div
        className="pointer-events-auto flex shrink-0 justify-start px-2 pb-3 pt-0"
        style={{
          transform: `translate(${HOME_SECONDARY_BANNER_CTA_ROW_OFFSET_X_PX}px, ${HOME_SECONDARY_BANNER_CTA_ROW_OFFSET_Y_PX}px)`,
        }}
      >
        <HomeSecondaryBannerCta language={language} />
      </div>
    </div>
  );
}
