import Image from 'next/image';

import { t } from '../../lib/i18n';
import type { LanguageCode } from '../../lib/language';
import {
  HOME_APP_BANNER_IMAGE_HEIGHT,
  HOME_APP_BANNER_IMAGE_PATH,
  HOME_APP_BANNER_IMAGE_WIDTH,
  HOME_APP_BANNER_INNER_CLASS,
} from './home-app-banner.constants';

type HomeAppBannerProps = {
  language: LanguageCode;
};

/**
 * Full-width promotional banner below «ԲՐԵՆԴՆԵՐ» — Figma 305:2155.
 */
export function HomeAppBanner({ language }: HomeAppBannerProps) {
  return (
    <div
      role="region"
      className="w-full overflow-hidden bg-white"
      aria-label={t(language, 'home.app_banner.section_aria')}
    >
      <div className={HOME_APP_BANNER_INNER_CLASS}>
        <Image
          src={HOME_APP_BANNER_IMAGE_PATH}
          alt={t(language, 'home.app_banner.image_alt')}
          width={HOME_APP_BANNER_IMAGE_WIDTH}
          height={HOME_APP_BANNER_IMAGE_HEIGHT}
          className="h-auto w-full max-w-full object-cover object-center"
          sizes="(max-width: 1280px) 100vw, 1216px"
          priority={false}
        />
      </div>
    </div>
  );
}
