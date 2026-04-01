'use client';

import Image from 'next/image';

type MarcoCarouselNavProps = {
  prevSrc: string;
  nextSrc: string;
  className?: string;
};

/**
 * Круглые стрелки как в Figma (REELS / SPECIAL / NEWS / BRANDS).
 */
export function MarcoCarouselNav({
  prevSrc,
  nextSrc,
  className = '',
}: MarcoCarouselNavProps) {
  return (
    <div className={`flex h-10 w-[111.687px] shrink-0 gap-2 ${className}`}>
      <button
        type="button"
        className="relative h-10 w-[50.767px] rounded-full border border-gray-200 transition-colors hover:bg-primary-500 hover:text-white"
        aria-label="Previous"
      >
        <span className="absolute left-[calc(50%-0.68px)] top-[calc(50%+0.33px)] h-3 w-[7.4px] -translate-x-1/2 -translate-y-1/2">
          <Image src={prevSrc} alt="" width={8} height={12} className="size-full" unoptimized />
        </span>
      </button>
      <button
        type="button"
        className="relative h-10 w-[50.767px] rounded-full border border-gray-200 transition-colors hover:bg-primary-500 hover:text-white"
        aria-label="Next"
      >
        <span className="absolute left-[calc(50%-0.68px)] top-[calc(50%+0.33px)] h-3 w-[7.4px] -translate-x-1/2 -translate-y-1/2">
          <Image src={nextSrc} alt="" width={8} height={12} className="size-full" unoptimized />
        </span>
      </button>
    </div>
  );
}
