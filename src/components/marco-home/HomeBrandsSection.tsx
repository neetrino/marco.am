'use client';

import { useTranslation } from '../../lib/i18n-client';
import { MARCO_BRANDS } from './marcoHomeAssets';
import { MarcoCarouselNav } from './MarcoCarouselNav';
import { MarcoSeeMoreCta } from './MarcoSeeMoreCta';
import { HomeBrandTiles } from './HomeBrandTiles';

/**
 * BRANDS — Figma node 214:1060.
 */
export function HomeBrandsSection() {
  const { t } = useTranslation();

  return (
    <section
      className="relative h-[545px] w-[1920px] shrink-0 overflow-hidden bg-white font-montserrat-arm"
      data-name="BRANDS"
      data-node-id="214:1060"
    >
      <div className="absolute left-[calc(50%+1.5px)] top-[62px] flex h-[70px] w-[1547px] -translate-x-1/2 items-end justify-between">
        <div className="relative min-h-[44px] w-[55%]">
          <p className="absolute left-0 top-[-18px] whitespace-nowrap text-[54px] font-bold uppercase leading-[41px] tracking-[-0.6px] text-[#181111]">
            {t('home.brands_title')}
          </p>
          <div className="absolute left-0 top-[40px] h-1 w-[101.533px] bg-accent-yellow" />
        </div>
        <MarcoCarouselNav prevSrc={MARCO_BRANDS.navPrev} nextSrc={MARCO_BRANDS.navNext} />
      </div>

      <HomeBrandTiles />

      <MarcoSeeMoreCta
        label={t('home.see_more')}
        className="absolute left-1/2 top-[446px] -translate-x-1/2"
      />
    </section>
  );
}
