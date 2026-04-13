'use client';

import { useTranslation } from '../lib/i18n-client';
import { HomePromoFreeDeliveryBanner } from './home/HomePromoFreeDeliveryBanner';
import { HomePromoSmartphonesBanner } from './home/HomePromoSmartphonesBanner';
import { HomePromoStackedProductCard } from './home/HomePromoStackedProductCard';
import { HomePromoHeroChatFab } from './home/HomePromoHeroChatFab';
import { HomePromoMobileHeroChair } from './home/HomePromoMobileHeroChair';
import { HomePromoMobileHeroHeadline } from './home/HomePromoMobileHeroHeadline';
import { HomePromoMobileHeroSlateCta } from './home/HomePromoMobileHeroSlateCta';
import { HomePromoMobileHeroSlateLabel } from './home/HomePromoMobileHeroSlateLabel';
import { HomePromoMobileHeroSlatePanel } from './home/HomePromoMobileHeroSlatePanel';
import { HomePromoYellowHeadline } from './home/HomePromoYellowHeadline';
import { HeroCarouselSlides } from './HeroCarouselSlides';

export function HeroCarousel() {
  const { t } = useTranslation();

  return (
    <div className="hero-section-inset w-full" id="hero">
      <div className="relative aspect-[141/79] min-h-[260px] w-full overflow-hidden rounded-[32px] bg-marco-yellow box-border sm:min-h-[320px] md:min-h-[380px]">
        <HeroCarouselSlides />
        <HomePromoMobileHeroSlatePanel />
        <HomePromoMobileHeroSlateLabel />
        <HomePromoMobileHeroChair />
        <HomePromoMobileHeroSlateCta />
        <div className="pointer-events-none absolute inset-0 z-[14] flex justify-start md:hidden">
          <div className="box-border w-full max-w-full px-4 pt-8 sm:px-5 sm:pt-9">
            <HomePromoMobileHeroHeadline
              emphasisText={t('home.promo_banner_headline_emphasis')}
              accentText={t('home.promo_banner_headline_accent')}
            />
          </div>
        </div>
        <div className="pointer-events-none absolute inset-0 z-10 max-md:hidden">
          {/*
            max-md: mobile headline (Figma 314:2400) only; md+: headline + stacked card.
            sm+: free-delivery nudged slightly left; smartphones nudged right (keeps pair tight vs gap).
          */}
          <div className="pointer-events-auto absolute inset-0">
            <div className="pointer-events-auto absolute -right-2 -top-16 z-20 hidden flex-row items-end gap-0 sm:-right-2 sm:flex md:-right-3 lg:-right-4">
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
        <div className="pointer-events-auto absolute bottom-3 right-5 z-30 max-md:hidden sm:bottom-5 sm:right-6 md:bottom-7 md:right-9">
          <HomePromoHeroChatFab />
        </div>
      </div>
    </div>
  );
}
