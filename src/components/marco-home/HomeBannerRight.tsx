'use client';

import Image from 'next/image';
import Link from 'next/link';
import { MARCO_BANNERS } from './marcoHomeAssets';

type HomeBannerRightProps = {
  moreLabel: string;
};

export function HomeBannerRight({ moreLabel }: HomeBannerRightProps) {
  return (
    <div className="absolute left-[784px] top-[696px] h-[370px] w-[945px] rounded-[20px] bg-[#d8e4f2]">
      <p className="absolute left-[203px] top-[101px] whitespace-nowrap text-[110px] font-black leading-[100px] text-black">
        BANNER
      </p>
      <Link
        href="/products"
        className="absolute left-[41px] top-[261px] flex h-16 w-[220px] items-center justify-center rounded-[68px] bg-black hover:opacity-90"
      >
        <span className="text-[16px] font-bold leading-6 text-white">{moreLabel}</span>
        <span className="absolute left-[162px] top-2 size-12">
          <Image
            src={MARCO_BANNERS.ellipseDark}
            alt=""
            width={48}
            height={48}
            className="size-full"
            unoptimized
          />
        </span>
        <span className="absolute left-[180px] top-[26px] flex size-[11.769px] -rotate-45 items-center justify-center">
          <Image
            src={MARCO_BANNERS.arrowDark}
            alt=""
            width={17}
            height={12}
            className="object-contain"
            unoptimized
          />
        </span>
      </Link>
    </div>
  );
}
