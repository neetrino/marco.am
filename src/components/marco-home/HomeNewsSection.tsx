'use client';

import { useTranslation } from '../../lib/i18n-client';
import { MarcoSpecialOffersRow } from './MarcoSpecialOffersRow';
import { MarcoSeeMoreCta } from './MarcoSeeMoreCta';
import { MARCO_SPECIAL_ROW } from './marcoHomeAssets';
import { MarcoCarouselNav } from './MarcoCarouselNav';

/**
 * NEWS — Figma node 214:1059 (два ряда карточек как SPECIAL).
 */
export function HomeNewsSection() {
  const { t } = useTranslation();

  return (
    <section
      className="relative h-[1324px] w-[1920px] shrink-0 overflow-hidden bg-white font-montserrat-arm"
      data-name="NEWS"
      data-node-id="214:1059"
    >
      <div className="absolute left-[188px] top-[50px] w-[1544px]">
        <div className="flex h-[70px] w-full items-end justify-between">
          <div className="relative min-h-[44px] w-[55%]">
            <p className="absolute left-0 top-[-18px] whitespace-nowrap text-[54px] font-bold uppercase leading-[41px] tracking-[-0.6px] text-[#181111]">
              {t('home.news_title')}
            </p>
            <div className="absolute left-0 top-[40px] h-1 w-[101.533px] bg-accent-yellow" />
          </div>
          <MarcoCarouselNav
            prevSrc={MARCO_SPECIAL_ROW.navPrev}
            nextSrc={MARCO_SPECIAL_ROW.navNext}
          />
        </div>
      </div>

      <MarcoSpecialOffersRow className="absolute left-[calc(50%-0.16px)] top-[146px] -translate-x-1/2" />

      <MarcoSpecialOffersRow className="absolute left-[calc(50%-0.16px)] top-[684px] -translate-x-1/2" />

      <MarcoSeeMoreCta
        label={t('home.see_more')}
        className="absolute left-1/2 top-[1225px] -translate-x-1/2"
      />
    </section>
  );
}
