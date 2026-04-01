'use client';

import Image from 'next/image';
import { MARCO_SPECIAL_ROW } from './marcoHomeAssets';

type MarcoCompactCardChromeProps = {
  discountLabel: string;
};

export function MarcoCompactCardChrome({ discountLabel }: MarcoCompactCardChromeProps) {
  return (
    <>
      <div className="absolute left-4 top-5 z-10 flex h-[23px] min-w-[52px] items-center justify-center rounded-[24px] bg-accent-yellow px-2">
        <span className="text-[10px] font-bold text-white">{discountLabel}</span>
      </div>
      <div className="absolute right-3 top-4 z-10 size-8">
        <Image
          src={MARCO_SPECIAL_ROW.wishlist}
          alt=""
          width={32}
          height={32}
          className="size-full"
          unoptimized
        />
      </div>
      <div className="absolute right-3 top-16 z-10 size-8 rounded-full bg-black">
        <div className="absolute inset-[27.08%_30.09%_27.08%_29.17%]">
          <Image
            src={MARCO_SPECIAL_ROW.compare}
            alt=""
            fill
            className="object-contain"
            unoptimized
          />
        </div>
      </div>

      <div className="absolute left-[257px] top-[424px] size-[62px]">
        <div className="absolute inset-[-33.87%]">
          <Image
            src={MARCO_SPECIAL_ROW.addToCart}
            alt=""
            width={84}
            height={84}
            className="size-full max-w-none"
            unoptimized
          />
        </div>
      </div>
    </>
  );
}
