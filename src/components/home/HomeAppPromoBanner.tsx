import Image from 'next/image';
import { HOME_APP_BANNER_PUBLIC_PATH } from '@/constants/homeAppBanner';
import { t } from '@/lib/i18n';
import { DEFAULT_LANGUAGE } from '@/lib/language';

/** Figma app promo area after BRANDS — raster source from MARCO home export. */
const BANNER_WIDTH = 1527;
const BANNER_HEIGHT = 570;

export function HomeAppPromoBanner() {
  return (
    <section className="bg-white py-8 md:py-10 xl:py-12">
      <div
        className="relative w-full overflow-hidden rounded-[24px] bg-[#ffca03] md:rounded-[28px] xl:rounded-[32px]"
        style={{ aspectRatio: `${BANNER_WIDTH} / ${BANNER_HEIGHT}` }}
      >
        <Image
          src={HOME_APP_BANNER_PUBLIC_PATH}
          alt={t(DEFAULT_LANGUAGE, 'home.app_promo_title')}
          fill
          priority={false}
          sizes="(max-width: 768px) 100vw, (max-width: 1600px) calc(100vw - 32px), 1527px"
          className="object-cover object-center"
        />
      </div>
    </section>
  );
}
