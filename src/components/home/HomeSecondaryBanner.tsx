import type { CSSProperties } from 'react';
import { Montserrat } from 'next/font/google';

import { t } from '../../lib/i18n';
import type { LanguageCode } from '../../lib/language';
import {
  HOME_SECONDARY_BANNER_BG_HEX,
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
  promoSecondaryImageUrl?: string;
};

function buildSurfaceStyle(imageUrl?: string): CSSProperties {
  const normalizedImageUrl = imageUrl?.trim();
  return {
    borderRadius: `${HOME_SECONDARY_BANNER_RADIUS_PX}px`,
    backgroundColor: HOME_SECONDARY_BANNER_BG_HEX,
    ...(normalizedImageUrl
      ? {
          backgroundImage: `url("${normalizedImageUrl}")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }
      : {}),
  };
}

/**
 * Figma 307:2232 panel, 307:2237 headline, 101:4130 CTA.
 */
export function HomeSecondaryBanner({
  language,
  promoSecondaryImageUrl,
}: HomeSecondaryBannerProps) {
  return (
    <div
      className={`relative flex h-full w-full min-h-0 ${HOME_SECONDARY_BANNER_STACK_ASPECT_CLASS} flex-col overflow-hidden md:aspect-auto ${montserratSecondaryHeadline.className}`}
      style={buildSurfaceStyle(promoSecondaryImageUrl)}
      role="region"
      aria-label={t(language, 'home.secondary_banner.aria')}
    >
      <div className="flex min-h-0 flex-1 items-center justify-center px-2 pt-2 text-center" />
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
