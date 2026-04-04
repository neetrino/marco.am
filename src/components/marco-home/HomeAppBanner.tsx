'use client';

import Image from 'next/image';
import { MARCO_APP_BANNER } from './marcoHomeAssets';

type HomeAppBannerProps = {
  className?: string;
};

/**
 * App banner — Figma node 305:2155 (1527×570).
 */
export function HomeAppBanner({ className = '' }: HomeAppBannerProps) {
  return (
    <div
      className={`relative h-[570px] w-[1527px] shrink-0 overflow-hidden ${className}`}
      data-name="App banner"
      data-node-id="305:2155"
    >
      <Image
        src={MARCO_APP_BANNER}
        alt=""
        fill
        className="object-cover"
        sizes="1527px"
        unoptimized
      />
    </div>
  );
}
