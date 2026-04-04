'use client';

import Image from 'next/image';
import Link from 'next/link';
import { CompactRatingStars } from './CompactRatingStars';

type MarcoCompactCardInnerProps = {
  brand: string;
  brandColor: string;
  title: string;
  price: string;
  ratingCount: string;
  imageSrc: string;
};

export function MarcoCompactCardInner({
  brand,
  brandColor,
  title,
  price,
  ratingCount,
  imageSrc,
}: MarcoCompactCardInnerProps) {
  return (
    <>
      <div className="absolute left-[6.03%] right-[6.03%] top-[17px] h-[248px] overflow-hidden rounded-[8px] bg-gray-50">
        <div className="absolute left-[9.68%] right-[9.68%] top-6 h-[200px] mix-blend-multiply">
          <Image
            src={imageSrc}
            alt=""
            fill
            className="object-contain"
            sizes="280px"
            unoptimized
          />
        </div>
      </div>

      <div className="absolute left-[6.03%] right-[6.03%] top-[281px] h-[132px]">
        <p
          className="absolute left-0 top-0 text-[12px] font-black uppercase leading-4 tracking-[0.6px]"
          style={{ color: brandColor }}
        >
          {brand}
        </p>
        <div className="absolute left-0 right-0 top-6 max-h-10 overflow-hidden">
          <Link href="/products">
            <p className="text-[14px] font-bold leading-5 text-[#181111]">{title}</p>
          </Link>
        </div>
        <CompactRatingStars ratingCount={ratingCount} />
        <p className="absolute bottom-[28px] left-0 translate-y-full text-[20px] font-black leading-7 text-[#181111]">
          {price}
        </p>
      </div>
    </>
  );
}
