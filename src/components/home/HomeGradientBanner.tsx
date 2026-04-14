import type { CSSProperties } from 'react';

import { t } from '../../lib/i18n';
import type { LanguageCode } from '../../lib/language';
import { HOME_APP_BANNER_INNER_CLASS } from './home-app-banner.constants';
import {
  HOME_GRADIENT_BANNER_ASPECT_RATIO,
  HOME_GRADIENT_BANNER_BG_POSITION_X_PX,
  HOME_GRADIENT_BANNER_BG_POSITION_Y_PX,
  HOME_GRADIENT_BANNER_BG_SIZE_HEIGHT_PERCENT,
  HOME_GRADIENT_BANNER_BG_SIZE_WIDTH_PERCENT,
  HOME_GRADIENT_BANNER_IMAGE_PATH,
  HOME_GRADIENT_BANNER_MAX_WIDTH_PX,
  HOME_GRADIENT_BANNER_OFFSET_LEFT_PX,
  HOME_GRADIENT_BANNER_OVERLAY_OPACITY,
  HOME_GRADIENT_BANNER_RADIUS_PX,
} from './home-gradient-banner.constants';

type HomeGradientBannerProps = {
  language: LanguageCode;
};

function buildBannerSurfaceStyle(): CSSProperties {
  const overlay = `rgba(47 75 93 / ${HOME_GRADIENT_BANNER_OVERLAY_OPACITY})`;
  return {
    width: '100%',
    maxWidth: `${HOME_GRADIENT_BANNER_MAX_WIDTH_PX}px`,
    marginLeft: `${HOME_GRADIENT_BANNER_OFFSET_LEFT_PX}px`,
    aspectRatio: HOME_GRADIENT_BANNER_ASPECT_RATIO,
    borderRadius: `${HOME_GRADIENT_BANNER_RADIUS_PX}px`,
    backgroundColor: 'lightgray',
    backgroundImage: `linear-gradient(0deg, ${overlay} 0%, ${overlay} 100%), url(${HOME_GRADIENT_BANNER_IMAGE_PATH})`,
    backgroundPosition: `0 0, ${HOME_GRADIENT_BANNER_BG_POSITION_X_PX}px ${HOME_GRADIENT_BANNER_BG_POSITION_Y_PX}px`,
    backgroundSize: `auto, ${HOME_GRADIENT_BANNER_BG_SIZE_WIDTH_PERCENT}% ${HOME_GRADIENT_BANNER_BG_SIZE_HEIGHT_PERCENT}%`,
    backgroundRepeat: 'no-repeat, no-repeat',
  };
}

/**
 * 560×370 (56/37) rounded banner — gradient over positioned photo (user CSS).
 */
export function HomeGradientBanner({ language }: HomeGradientBannerProps) {
  return (
    <div className="w-full bg-white pb-10 pt-6">
      <div className={`${HOME_APP_BANNER_INNER_CLASS} flex justify-center`}>
        <div
          role="img"
          aria-label={t(language, 'home.gradient_banner.aria')}
          className="overflow-hidden"
          style={buildBannerSurfaceStyle()}
        />
      </div>
    </div>
  );
}
