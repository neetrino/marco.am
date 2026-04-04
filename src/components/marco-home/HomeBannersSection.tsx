'use client';

import { useTranslation } from '../../lib/i18n-client';
import { HomeAppBanner } from './HomeAppBanner';
import { HomeBannerPromoBlocks } from './HomeBannerPromoBlocks';

/**
 * BANNERS — Figma 214:1062: app banner (y≈99) + заголовок на баннере (y≈236) + два промо (y≈696).
 */
export function HomeBannersSection() {
  const { t } = useTranslation();

  return (
    <section
      className="relative h-[1197px] w-[1920px] shrink-0 overflow-hidden bg-white font-montserrat-arm"
      data-name="BANNERS"
      data-node-id="214:1062"
    >
      <div className="absolute left-1/2 top-[99px] w-[1527px] -translate-x-1/2">
        <div className="relative">
          <HomeAppBanner />
          <p className="absolute left-[62px] top-[137px] z-10 max-w-[449px] text-[30px] font-bold uppercase leading-9 tracking-[0.7px] text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.45)]">
            {t('home.banners_download_title')}
          </p>
        </div>
      </div>

      <HomeBannerPromoBlocks buyNowLabel={t('home.hero_buy_now')} moreLabel={t('home.hero_more')} />
    </section>
  );
}
