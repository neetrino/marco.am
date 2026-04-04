'use client';

import Image from 'next/image';
import Link from 'next/link';
import { MARCO_BANNERS } from './marcoHomeAssets';

type HomeBannerLeftProps = {
  buyNowLabel: string;
};

export function HomeBannerLeft({ buyNowLabel }: HomeBannerLeftProps) {
  return (
    <div className="absolute left-[205px] top-[696px] h-[370px] w-[560px] overflow-hidden rounded-[20px]">
      <div aria-hidden className="pointer-events-none absolute inset-0 rounded-[20px]">
        <div className="absolute inset-0 overflow-hidden rounded-[20px]">
          <Image
            src={MARCO_BANNERS.leftPhoto}
            alt=""
            fill
            className="object-cover"
            style={{ objectPosition: '45% 35%' }}
            sizes="560px"
            unoptimized
          />
        </div>
        <div className="absolute inset-0 rounded-[20px] bg-hero-blue/90" />
      </div>
      <p className="absolute left-[30px] top-[96px] text-[110px] font-black leading-[100px] text-[#fadd1a]">
        BANNER
      </p>
      <Link
        href="/products"
        className="absolute left-[24px] top-[261px] flex h-16 w-[226px] items-center justify-center rounded-[68px] bg-gold hover:opacity-95"
      >
        <span className="text-[16px] font-bold leading-6 text-black">{buyNowLabel}</span>
        <span className="absolute left-[168px] top-2 size-12">
          <Image
            src={MARCO_BANNERS.ellipseYellow}
            alt=""
            width={48}
            height={48}
            className="size-full"
            unoptimized
          />
        </span>
        <span className="absolute left-[186px] top-[26px] flex size-[11.769px] -rotate-45 items-center justify-center">
          <Image
            src={MARCO_BANNERS.arrowYellow}
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
