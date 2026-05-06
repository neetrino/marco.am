import Image from 'next/image';
import { HOME_APP_BANNER_INNER_CLASS } from './home-app-banner.constants';
import {
  HOME_MOBILE_BANNER_SHOWCASE_CARD_HEIGHT_PX,
  HOME_MOBILE_BANNER_SHOWCASE_CARD_WIDTH_PX,
  HOME_MOBILE_BANNER_SHOWCASE_RADIUS_PX,
  HOME_MOBILE_BANNER_SHOWCASE_IMAGE_SIZES,
} from './home-mobile-banner-product-showcase.constants';
import { shouldBypassNextImageOptimizer } from '../../lib/utils/should-bypass-next-image-optimizer';

type HomeMobileBannerProductShowcaseProps = {
  imageUrl: string;
};

/**
 * Figma 314:2479 — mobile-only promo card under the app download banner (`FeaturedProductsTabs`).
 */
export function HomeMobileBannerProductShowcase({ imageUrl }: HomeMobileBannerProductShowcaseProps) {
  return (
    <div className={HOME_APP_BANNER_INNER_CLASS}>
      <div className="relative mx-auto mb-5 w-full">
        <div
          className="relative w-full overflow-hidden"
          style={{
            aspectRatio: `${HOME_MOBILE_BANNER_SHOWCASE_CARD_WIDTH_PX} / ${HOME_MOBILE_BANNER_SHOWCASE_CARD_HEIGHT_PX}`,
            borderRadius: `${HOME_MOBILE_BANNER_SHOWCASE_RADIUS_PX}px`,
          }}
        >
          <Image
            src={imageUrl}
            alt=""
            fill
            sizes={HOME_MOBILE_BANNER_SHOWCASE_IMAGE_SIZES}
            className="object-cover"
            unoptimized={shouldBypassNextImageOptimizer(imageUrl)}
          />
        </div>
      </div>
    </div>
  );
}
