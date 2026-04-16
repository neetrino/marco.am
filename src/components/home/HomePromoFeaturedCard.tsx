'use client';

import Image from 'next/image';
import Link from 'next/link';
import { PROMO_FEATURED_IMAGE_SRC, PROMO_LARGE_CARD_MIN_HEIGHT_CLASS } from './home-promo.constants';

type HomePromoFeaturedCardProps = {
  title: string;
  subtitle: string;
  ctaLabel: string;
};

export function HomePromoFeaturedCard({
  title,
  subtitle,
  ctaLabel,
}: HomePromoFeaturedCardProps) {
  return (
    <div
      className={`relative flex flex-col overflow-hidden rounded-[1.75rem] bg-white shadow-[0_12px_40px_rgba(0,0,0,0.08)] ring-1 ring-black/5 ${PROMO_LARGE_CARD_MIN_HEIGHT_CLASS}`}
    >
      <div className="relative flex flex-1 flex-col px-4 pb-3 pt-4 sm:px-6 sm:pt-5">
        <div className="relative flex min-h-[160px] flex-1 items-center justify-center rounded-2xl bg-[#f7f7f7] sm:min-h-[180px] lg:min-h-[200px]">
          <div className="relative h-[140px] w-full max-w-[280px] sm:h-[170px] sm:max-w-[320px] lg:h-[190px]">
            <Image
              src={PROMO_FEATURED_IMAGE_SRC}
              alt={title}
              fill
              className="object-contain object-center"
              sizes="(max-width: 1024px) 90vw, 420px"
              priority
            />
          </div>
        </div>
      </div>

      <div className="relative mt-auto flex flex-col justify-end bg-gradient-to-t from-[#0c1a3a] via-[#0f2347]/95 to-[#152a52]/90 px-4 pb-4 pt-10 sm:px-6 sm:pb-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-[18rem] space-y-1 text-left">
            <p className="text-lg font-semibold leading-snug text-white sm:text-xl">{title}</p>
            <p className="text-xs leading-relaxed text-white/75 sm:text-sm">{subtitle}</p>
          </div>
          <Link
            href="/products"
            className="inline-flex shrink-0 items-center justify-center self-end rounded-full bg-marco-yellow px-5 py-2.5 text-sm font-semibold text-marco-black shadow-md transition hover:brightness-95 sm:self-auto"
          >
            {ctaLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}
