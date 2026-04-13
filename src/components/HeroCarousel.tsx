'use client';

import {
  HERO_PROMO_DESKTOP_FREE_DELIVERY_BANNER_TRANSLATE_Y_PX,
  HERO_PROMO_DESKTOP_SOFA_CARD_EXTRA_TRANSLATE_Y_PX,
  HERO_PROMO_DESKTOP_SOFA_ROW_TRANSLATE_Y_PX,
  HERO_PROMO_SMARTPHONES_CORNER_NUDGE_X_PX,
  HERO_PROMO_SMARTPHONES_CORNER_NUDGE_Y_PX,
} from './hero.constants';
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

/** Same shell as home sections (`TopCategories`, `FeaturesSection`): bounded width + shared horizontal padding. */
const HERO_PAGE_CONTAINER_CLASS =
  'w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-16 lg:pt-[65px]';

export function HeroCarousel() {
  const { t } = useTranslation();

  return (
    <div className={HERO_PAGE_CONTAINER_CLASS} id="hero">
      <div className="relative aspect-[141/79] min-h-[260px] w-full min-w-0 overflow-hidden rounded-[32px] bg-marco-yellow box-border sm:min-h-[320px] md:min-h-[380px]">
        <HeroCarouselSlides />
        <HomePromoMobileHeroSlatePanel />
        <HomePromoMobileHeroSlateLabel />
        <HomePromoMobileHeroChair />
        <HomePromoMobileHeroSlateCta />
        <div className="pointer-events-none absolute inset-0 z-[14] flex flex-col md:hidden">
          <div className="box-border w-full min-w-0 max-w-full px-4 pt-8 sm:px-5 sm:pt-9">
            <HomePromoMobileHeroHeadline
              emphasisText={t('home.promo_banner_headline_emphasis')}
              accentText={t('home.promo_banner_headline_accent')}
            />
          </div>
        </div>
        <div className="pointer-events-none absolute inset-0 z-[15] hidden min-w-0 flex-col md:flex">
          <div className="pointer-events-auto relative flex h-full min-h-0 min-w-0 flex-col justify-start gap-6 px-4 pb-6 pt-9 sm:px-5 sm:pb-6 md:px-7 md:pb-9 lg:gap-7 lg:px-9 lg:pb-11">
            <div className="pointer-events-none relative z-20 flex min-w-0 flex-row flex-wrap items-start justify-between gap-x-4 gap-y-4">
              <div className="min-w-0 max-w-full flex-[1_1_min(580px,100%)] [&_p]:mb-0">
                <HomePromoYellowHeadline
                  emphasisText={t('home.promo_banner_headline_emphasis')}
                  accentText={t('home.promo_banner_headline_accent')}
                />
              </div>
              <div
                className="pointer-events-auto flex min-w-0 shrink-0 flex-row flex-wrap items-start justify-end"
                style={{
                  transform: `translate(${HERO_PROMO_SMARTPHONES_CORNER_NUDGE_X_PX}px, ${HERO_PROMO_SMARTPHONES_CORNER_NUDGE_Y_PX}px)`,
                }}
              >
                <HomePromoSmartphonesBanner layout="corner" />
              </div>
            </div>
            <div className="relative z-[5] flex w-full min-w-0 flex-row flex-wrap items-end justify-start gap-4 md:gap-6 lg:gap-8">
              <div
                className="shrink-0"
                style={{
                  transform: `translateY(${HERO_PROMO_DESKTOP_SOFA_ROW_TRANSLATE_Y_PX + HERO_PROMO_DESKTOP_SOFA_CARD_EXTRA_TRANSLATE_Y_PX}px)`,
                }}
              >
                <HomePromoStackedProductCard
                  ariaLabel={`${t('home.promo_featured_title')}. ${t('home.promo_featured_subtitle')}`}
                />
              </div>
              <div
                className="shrink-0"
                style={{
                  transform: `translateY(${HERO_PROMO_DESKTOP_FREE_DELIVERY_BANNER_TRANSLATE_Y_PX}px)`,
                }}
              >
                <HomePromoFreeDeliveryBanner />
              </div>
            </div>
          </div>
        </div>
        <div className="pointer-events-auto absolute bottom-3 right-4 z-30 max-md:hidden sm:bottom-5 sm:right-6 md:bottom-7 md:right-7 lg:right-9">
          <HomePromoHeroChatFab />
        </div>
      </div>
    </div>
  );
}
