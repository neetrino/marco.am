'use client';

import { useTranslation } from '../lib/i18n-client';
import { HomePromoFreeDeliveryBanner } from './home/HomePromoFreeDeliveryBanner';
import { HomePromoSmartphonesBanner } from './home/HomePromoSmartphonesBanner';
import { HomePromoStackedProductCard } from './home/HomePromoStackedProductCard';
import { HomePromoYellowHeadline } from './home/HomePromoYellowHeadline';
import { HeroCarouselSlides } from './HeroCarouselSlides';

export function HeroCarousel() {
  const { t } = useTranslation();

  return (
    <div className="hero-section-inset w-full">
      <div className="relative aspect-[141/79] min-h-[260px] w-full overflow-hidden rounded-[32px] bg-marco-yellow box-border sm:min-h-[320px] md:min-h-[380px]">
        <HeroCarouselSlides />
        <div className="pointer-events-none absolute inset-0 z-10">
          {/*
            Mobile: headline + stacked card; side tiles from md.
            md+: free-delivery nudged slightly left; smartphones nudged right (keeps pair tight vs gap).
          */}
          <div className="pointer-events-auto absolute inset-0">
            <div className="pointer-events-auto absolute -right-2 -top-16 z-20 hidden flex-row items-end gap-0 sm:-right-2 md:-right-3 md:flex lg:-right-4">
              <div className="shrink-0 -translate-x-2 sm:-translate-x-2.5 md:-translate-x-3">
                <HomePromoFreeDeliveryBanner />
              </div>
              <div className="shrink-0 -ml-1.5 translate-x-2 sm:-ml-1 sm:translate-x-3 md:translate-x-4 lg:translate-x-5 xl:translate-x-6">
                <HomePromoSmartphonesBanner />
              </div>
            </div>
            <div className="pointer-events-auto absolute inset-0 flex flex-col justify-between pt-9 pl-10 pr-4 pb-6 sm:pr-5 sm:pb-6 md:justify-start md:gap-6 md:pr-7 md:pb-9 lg:gap-7 lg:pr-9 lg:pb-11">
              <div className="[&_p]:mb-0 w-max max-w-[min(580px,calc(100%-16px))]">
                <HomePromoYellowHeadline
                  emphasisText={t('home.promo_banner_headline_emphasis')}
                  accentText={t('home.promo_banner_headline_accent')}
                />
              </div>
              <div className="flex flex-col items-end gap-3 self-end sm:flex-row sm:items-end sm:gap-4 md:gap-5 md:self-start lg:gap-6">
                <HomePromoStackedProductCard
                  ariaLabel={`${t('home.promo_featured_title')}. ${t('home.promo_featured_subtitle')}`}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
