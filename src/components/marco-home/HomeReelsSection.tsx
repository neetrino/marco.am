'use client';

import Image from 'next/image';
import { useTranslation } from '../../lib/i18n-client';
import { MARCO_REELS } from './marcoHomeAssets';
import { MarcoCarouselNav } from './MarcoCarouselNav';
import { HomeReelsCarousel } from './HomeReelsCarousel';

/**
 * REELS — Figma node 214:1057.
 */
export function HomeReelsSection() {
  const { t } = useTranslation();
  const labels = [
    t('home.reels_label_1'),
    t('home.reels_label_2'),
    t('home.reels_label_3'),
    t('home.reels_label_4'),
    t('home.reels_label_5'),
    t('home.reels_label_6'),
  ];

  return (
    <section
      className="relative h-[443px] w-[1920px] shrink-0 overflow-hidden bg-white font-montserrat-arm"
      data-name="REELS"
      data-node-id="214:1057"
    >
      <div className="absolute left-[calc(50%+4.52px)] top-[48px] flex h-[44px] w-[1544.957px] -translate-x-1/2 items-end justify-between">
        <div className="relative h-[44px] w-[23%] min-w-[200px]">
          <div className="absolute left-0 top-[40px] h-1 w-[101.533px] bg-accent-yellow" />
        </div>
        <MarcoCarouselNav prevSrc={MARCO_REELS.chevronLeft} nextSrc={MARCO_REELS.chevronRight} />
      </div>

      <p className="absolute left-[9.84%] top-[32px] text-[54px] font-bold uppercase leading-8 tracking-[-0.6px] text-[#181111]">
        {t('home.reels_title')}
      </p>

      <HomeReelsCarousel labels={labels} />

      <div className="absolute bottom-[9.48%] left-1/2 flex h-3 w-9 -translate-x-1/2 justify-center">
        <Image
          src={MARCO_REELS.pagination}
          alt=""
          width={36}
          height={12}
          className="object-contain"
          unoptimized
        />
      </div>
    </section>
  );
}
