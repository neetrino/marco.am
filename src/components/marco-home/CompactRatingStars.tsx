'use client';

import Image from 'next/image';
import { MARCO_SPECIAL_ROW } from './marcoHomeAssets';

type CompactRatingStarsProps = {
  ratingCount: string;
};

export function CompactRatingStars({ ratingCount }: CompactRatingStarsProps) {
  return (
    <div className="absolute left-0 right-0 top-[72px] flex h-4 items-center">
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className="relative mr-[3px] h-[9.5px] w-[9.5px] shrink-0">
          <Image
            src={MARCO_SPECIAL_ROW.star}
            alt=""
            width={10}
            height={10}
            className="object-contain"
            unoptimized
          />
        </span>
      ))}
      <span className="pl-1 text-[10px] leading-[15px] text-gray-400">{ratingCount}</span>
    </div>
  );
}
