'use client';

import Link from 'next/link';
import { MessageCircle } from 'lucide-react';
import { useTranslation } from '../../lib/i18n-client';
import { HomePromoFeaturedCard } from './HomePromoFeaturedCard';
import { HomePromoSideCards } from './HomePromoSideCards';
import { HomePromoYellowHeadline } from './HomePromoYellowHeadline';
import { PROMO_SECTION_PADDING_CLASS } from './home-promo.constants';

export function HomePromoSection() {
  const { t } = useTranslation();

  return (
    <div className="hero-section-inset pb-10 pt-6 sm:pb-12 sm:pt-8">
      <div
        className={`home-promo-panel relative overflow-hidden rounded-[1.75rem] shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] ${PROMO_SECTION_PADDING_CLASS} pb-16 sm:pb-14 md:pb-12`}
      >
        <HomePromoYellowHeadline
          emphasisText={t('home.promo_banner_headline_emphasis')}
          accentText={t('home.promo_banner_headline_accent')}
        />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8 lg:items-start">
          <div className="lg:col-span-7">
            <HomePromoFeaturedCard
              title={t('home.promo_featured_title')}
              subtitle={t('home.promo_featured_subtitle')}
              ctaLabel={t('home.promo_featured_cta')}
            />
          </div>

          <div className="flex flex-col gap-4 sm:gap-5 lg:col-span-5">
            <HomePromoSideCards
              cardOnePill={t('home.promo_card_one_pill')}
              cardTwoCta={t('home.promo_card_two_cta')}
              discountLabel={t('home.promo_discount_label')}
            />
            <div className="space-y-1.5 text-left text-sm leading-relaxed text-marco-black/85 sm:text-base lg:text-right">
              <p className="font-medium">{t('home.promo_copy_line_1')}</p>
              <p className="text-marco-black/75">{t('home.promo_copy_line_2')}</p>
            </div>
          </div>
        </div>

        <div className="absolute bottom-3 right-3 z-20 flex items-center gap-2 sm:bottom-4 sm:right-4 sm:gap-3 md:bottom-5 md:right-5">
          <Link
            href="/products"
            className="inline-flex max-w-[calc(100vw-7rem)] items-center truncate rounded-full bg-marco-black px-4 py-2.5 text-xs font-semibold text-white shadow-md transition hover:bg-black/90 sm:max-w-none sm:px-7 sm:py-3 sm:text-sm"
          >
            {t('home.promo_section_cta')}
          </Link>
          <Link
            href="/support"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-marco-black shadow-[0_8px_30px_rgba(0,0,0,0.18)] ring-2 ring-white/80 transition hover:shadow-lg sm:h-14 sm:w-14"
            aria-label={t('home.promo_chat_aria')}
          >
            <MessageCircle className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={1.75} />
          </Link>
        </div>
      </div>
    </div>
  );
}
