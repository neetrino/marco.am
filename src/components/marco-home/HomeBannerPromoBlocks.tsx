'use client';

import { HomeBannerLeft } from './HomeBannerLeft';
import { HomeBannerRight } from './HomeBannerRight';

type HomeBannerPromoBlocksProps = {
  buyNowLabel: string;
  moreLabel: string;
};

export function HomeBannerPromoBlocks({ buyNowLabel, moreLabel }: HomeBannerPromoBlocksProps) {
  return (
    <>
      <HomeBannerLeft buyNowLabel={buyNowLabel} />
      <HomeBannerRight moreLabel={moreLabel} />
    </>
  );
}
