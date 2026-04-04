'use client';

import Image from 'next/image';
import { MARCO_FIGMA_FOOTER } from './marcoHomeAssets';

export function MarcoFigmaFooterPayment() {
  return (
    <div className="mx-auto mt-8 flex max-w-[1572px] justify-end px-8">
      <div className="relative h-[38px] w-[207px]">
        <Image
          src={MARCO_FIGMA_FOOTER.paymentStrip}
          alt=""
          fill
          className="object-contain object-right"
          unoptimized
        />
      </div>
    </div>
  );
}
