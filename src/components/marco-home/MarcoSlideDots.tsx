'use client';

import Image from 'next/image';
import { MARCO_SPECIAL_ROW } from './marcoHomeAssets';

const DOT_LEFT = [140, 553, 965, 1377] as const;
const TOP = [287, 287, 287, 286] as const;

/** Индикаторы слайда под рядом карточек — Figma. */
export function MarcoSlideDots() {
  return (
    <>
      {DOT_LEFT.map((left, i) => (
        <div
          key={left}
          className="absolute h-[11px] w-[26px]"
          style={{ left, top: TOP[i] }}
        >
          <Image
            src={MARCO_SPECIAL_ROW.slideDot}
            alt=""
            width={26}
            height={11}
            className="size-full"
            unoptimized
          />
        </div>
      ))}
    </>
  );
}
