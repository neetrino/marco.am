'use client';

import Image from 'next/image';
import Link from 'next/link';
import { HERO_BANNER_ONE_IMAGE_SRC } from '../hero.constants';

type HomePromoBannerOneProps = {
  ariaLabel: string;
};

/** MARCO — promo card (stacked panels + product) on yellow hero */
export function HomePromoBannerOne({ ariaLabel }: HomePromoBannerOneProps) {
  return (
    <Link
      href="/products"
      className="relative block aspect-[1024/983] w-[min(46vw,220px)] overflow-hidden rounded-[1.75rem] shadow-[0_12px_40px_rgba(0,0,0,0.14)] transition hover:brightness-[1.02] sm:w-[260px] md:w-[300px] lg:w-[340px]"
      aria-label={ariaLabel}
    >
      <Image
        src={HERO_BANNER_ONE_IMAGE_SRC}
        alt=""
        fill
        className="object-contain object-center"
        sizes="(max-width: 640px) 46vw, (max-width: 1024px) 320px, 380px"
        priority
      />
    </Link>
  );
}
