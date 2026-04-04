'use client';

import { GitCompare } from 'lucide-react';
import { useTranslation } from '../../lib/i18n-client';
import { MarcoSpecialOffersRow } from './MarcoSpecialOffersRow';
import { MarcoSeeMoreCta } from './MarcoSeeMoreCta';
import { MARCO_SPECIAL_ROW } from './marcoHomeAssets';
import { MarcoCarouselNav } from './MarcoCarouselNav';

/**
 * SPECIAL — Figma node 214:1058.
 */
export function HomeSpecialSection() {
  const { t } = useTranslation();

  return (
    <section
      className="relative h-[826px] w-[1920px] shrink-0 overflow-hidden bg-white font-montserrat-arm"
      data-name="SPECIAL"
      data-node-id="214:1058"
    >
      <div className="absolute left-1/2 top-[38px] w-[1538px] -translate-x-1/2">
        <div className="absolute left-0 top-[59px] flex h-[44px] w-full items-end justify-between">
          <div className="relative h-[44px] w-[23%] max-w-[356px]">
            <div className="absolute left-0 top-[40px] h-1 w-[101.533px] bg-accent-yellow" />
          </div>
          <MarcoCarouselNav
            prevSrc={MARCO_SPECIAL_ROW.navPrev}
            nextSrc={MARCO_SPECIAL_ROW.navNext}
          />
        </div>
        <p className="absolute left-[9.95%] top-[38px] text-[54px] font-bold uppercase leading-[39px] tracking-[-0.6px] text-[#181111]">
          <span className="text-accent-yellow">{t('home.special_title_gold')}</span>
          <span>{t('home.special_title_rest')}</span>
        </p>
      </div>

      <MarcoSpecialOffersRow className="absolute left-[calc(50%-0.16px)] top-[186px] -translate-x-1/2" />

      <div
        className="absolute left-[390px] top-[166px] text-[#181111]"
        aria-hidden
        data-node-id="242:1697"
      >
        <GitCompare className="h-6 w-6" strokeWidth={2} aria-hidden />
      </div>

      <MarcoSeeMoreCta
        label={t('home.see_more')}
        className="absolute left-1/2 top-[727px] -translate-x-1/2"
      />
    </section>
  );
}
