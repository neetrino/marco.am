'use client';

import {
  HERO_DESKTOP_COMPOSITION_WIDTH_PX,
  HERO_PROMO_DESKTOP_FREE_DELIVERY_BANNER_TRANSLATE_Y_PX,
  HERO_PROMO_DESKTOP_SOFA_CARD_EXTRA_TRANSLATE_Y_PX,
  HERO_PROMO_DESKTOP_SOFA_ROW_TRANSLATE_Y_PX,
  HERO_PROMO_DESKTOP_SOFA_CARD_RU_EXTRA_TRANSLATE_Y_PX,
  HERO_PROMO_SMARTPHONES_CORNER_NUDGE_X_PX,
  HERO_PROMO_SMARTPHONES_CORNER_NUDGE_Y_PX,
} from './hero.constants';
import type { CSSProperties } from 'react';
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
import { HOME_PAGE_SECTION_SHELL_CLASS } from './home/home-page-section-shell.constants';

/** Same shell as other home sections; horizontal gutters: see `HOME_PAGE_SECTION_SHELL_CLASS`. */
const HERO_PAGE_CONTAINER_CLASS = `${HOME_PAGE_SECTION_SHELL_CLASS} pt-8 sm:pt-16 lg:pt-[65px]`;

const heroDesktopCompositionStyle: CSSProperties = {
  width: HERO_DESKTOP_COMPOSITION_WIDTH_PX,
  zoom: `min(1, calc(100cqw / ${HERO_DESKTOP_COMPOSITION_WIDTH_PX}px))`,
};

export function HeroCarousel() {
  const { t, lang } = useTranslation();

  const sofaRowTranslateYPx =
    HERO_PROMO_DESKTOP_SOFA_ROW_TRANSLATE_Y_PX +
    HERO_PROMO_DESKTOP_SOFA_CARD_EXTRA_TRANSLATE_Y_PX +
    (lang === 'ru' ? HERO_PROMO_DESKTOP_SOFA_CARD_RU_EXTRA_TRANSLATE_Y_PX : 0);

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
        <div className="pointer-events-none absolute inset-0 z-[15] hidden min-w-0 flex-col items-center justify-start overflow-hidden md:flex [container-type:inline-size]">
          <div
            className="pointer-events-auto flex max-w-none shrink-0 origin-top flex-col justify-start gap-7 px-9 pb-11 pt-9"
            style={heroDesktopCompositionStyle}
          >
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
            <div className="relative z-[5] flex w-full min-w-0 flex-row flex-wrap items-end justify-start gap-8">
              <div
                className="shrink-0"
                style={{
                  transform: `translateY(${sofaRowTranslateYPx}px)`,
                }}
              >
                <HomePromoStackedProductCard
                  ariaLabel={`${t('home.promo_featured_title')}. ${t('home.promo_featured_subtitle')}`}
                  compositionMode
                />
              </div>
              <div
                className="shrink-0"
                style={{
                  transform: `translateY(${HERO_PROMO_DESKTOP_FREE_DELIVERY_BANNER_TRANSLATE_Y_PX}px)`,
                }}
              >
                <HomePromoFreeDeliveryBanner compositionMode />
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
