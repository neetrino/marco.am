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
            md+: free-delivery position unchanged in row; smartphones shifted toward the right edge (translate only).
          */}
          <div className="pointer-events-auto absolute inset-0">
            <div className="pointer-events-auto absolute right-4 top-[46px] z-20 hidden flex-row items-end gap-3 sm:right-5 sm:gap-4 md:right-7 md:flex md:gap-5 lg:right-9 lg:gap-6">
              <HomePromoFreeDeliveryBanner />
              <div className="shrink-0 translate-x-6 sm:translate-x-8 md:translate-x-10 lg:translate-x-12 xl:translate-x-16">
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
