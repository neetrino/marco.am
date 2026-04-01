'use client';

import Image from 'next/image';
import { MARCO_REELS } from './marcoHomeAssets';

const REEL_IMAGES = [
  MARCO_REELS.ellipse89,
  MARCO_REELS.ellipse90,
  MARCO_REELS.ellipse91,
  MARCO_REELS.ellipse92,
  MARCO_REELS.ellipse93,
  MARCO_REELS.ellipse94,
] as const;

type HomeReelsCarouselProps = {
  labels: string[];
};

export function HomeReelsCarousel({ labels }: HomeReelsCarouselProps) {
  return (
    <div className="absolute left-[183px] top-[141px] h-[210px] w-[1553.767px]">
      <div className="absolute left-[4.63%] right-[4.62%] top-0 h-[145px]">
          {REEL_IMAGES.map((src, i) => (
            <div key={src} className="absolute top-0 size-[145px]" style={{ left: i * 253 }}>
              <div className="absolute inset-[-7.59%]">
                <Image
                  src={src}
                  alt=""
                  width={167}
                  height={167}
                  className="size-full max-w-none"
                  unoptimized
                />
              </div>
            </div>
          ))}
          <div className="absolute left-[3.64%] top-[31.72%] h-[45.31%] w-[2.87%]">
            <Image
              src={MARCO_REELS.groupDecor}
              alt=""
              width={40}
              height={60}
              className="h-full w-full object-contain"
              unoptimized
            />
          </div>
          <div className="absolute left-[56.81%] top-[32.41%] h-[39.31%] w-[4.35%]">
            <Image
              src={MARCO_REELS.group9212}
              alt=""
              width={60}
              height={60}
              className="h-full w-full object-contain"
              unoptimized
            />
          </div>
      </div>
      <div className="absolute bottom-0 left-[3%] right-[3%] flex justify-between text-right font-montserrat-arm text-[18px] leading-7 text-[#050401]">
        {labels.map((label) => (
          <span key={label} className="min-w-0 flex-1 truncate text-center">
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
