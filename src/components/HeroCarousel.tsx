'use client';

import { useTranslation } from '../lib/i18n-client';
import { HomePromoYellowHeadline } from './home/HomePromoYellowHeadline';
import { HeroCarouselSlides } from './HeroCarouselSlides';

export function HeroCarousel() {
  const { t } = useTranslation();

  return (
    <div className="hero-section-inset w-full">
      <div className="relative aspect-[141/79] min-h-[260px] w-full overflow-hidden rounded-[32px] bg-marco-yellow box-border sm:min-h-[320px] md:min-h-[380px]">
        <HeroCarouselSlides />
        <div className="pointer-events-none absolute inset-0">
          <div className="pointer-events-auto absolute left-[40px] top-[36px] w-max max-w-[min(580px,calc(100%-40px-16px))]">
            <div className="[&_p]:mb-0">
              <HomePromoYellowHeadline
                emphasisText={t('home.promo_banner_headline_emphasis')}
                accentText={t('home.promo_banner_headline_accent')}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
