'use client';

import { useTranslation } from '../lib/i18n-client';
import { HomePromoBannerOne } from './home/HomePromoBannerOne';
import { HomePromoYellowHeadline } from './home/HomePromoYellowHeadline';
import { HeroCarouselSlides } from './HeroCarouselSlides';

export function HeroCarousel() {
  const { t } = useTranslation();

  return (
    <div className="hero-section-inset w-full">
      <div className="relative aspect-[141/79] min-h-[260px] w-full overflow-hidden rounded-[32px] bg-marco-yellow box-border sm:min-h-[320px] md:min-h-[380px]">
        <HeroCarouselSlides />
        <div className="pointer-events-none absolute inset-0 z-10">
          <div className="pointer-events-auto absolute left-[40px] top-[36px] w-max max-w-[min(580px,calc(100%-40px-16px))]">
            <div className="[&_p]:mb-0">
              <HomePromoYellowHeadline
                emphasisText={t('home.promo_banner_headline_emphasis')}
                accentText={t('home.promo_banner_headline_accent')}
              />
            </div>
          </div>
          <div className="pointer-events-auto absolute bottom-3 right-3 sm:bottom-5 sm:right-5 md:bottom-7 md:right-7 lg:bottom-9 lg:right-9">
            <HomePromoBannerOne
              ariaLabel={`${t('home.promo_featured_title')}. ${t('home.promo_featured_subtitle')}`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
