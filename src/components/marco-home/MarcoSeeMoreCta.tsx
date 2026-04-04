'use client';

import Image from 'next/image';
import Link from 'next/link';
import { MARCO_SPECIAL_ROW } from './marcoHomeAssets';

type MarcoSeeMoreCtaProps = {
  label: string;
  className?: string;
  href?: string;
};

/** Кнопка «Տեսնել ավելին» + декор — Figma Botton / 111:4198 */
export function MarcoSeeMoreCta({
  label,
  className = '',
  href = '/products',
}: MarcoSeeMoreCtaProps) {
  return (
    <div className={`relative h-[99px] w-[234px] ${className}`} data-name="Botton">
      <div className="absolute left-1/2 top-0 flex h-3 w-10 -translate-x-1/2 justify-center">
        <Image
          src={MARCO_SPECIAL_ROW.ctaDecor}
          alt=""
          width={40}
          height={12}
          className="object-contain"
          unoptimized
        />
      </div>
      <Link
        href={href}
        className="absolute bottom-0 left-0 right-0 flex h-14 items-center justify-center rounded-[68px] bg-black text-[16px] font-bold leading-6 text-white hover:opacity-90"
      >
        {label}
      </Link>
    </div>
  );
}
