'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Armchair, ArrowUpRight } from 'lucide-react';
import { useTranslation } from '../../lib/i18n-client';
import { PROMO_SIDE_CARD_A_BG_SRC, PROMO_SMALL_CARD_MIN_HEIGHT_CLASS } from './home-promo.constants';

type HomePromoPromoCardOneProps = {
  pillLabel: string;
};

export function HomePromoPromoCardOne({ pillLabel }: HomePromoPromoCardOneProps) {
  const { t } = useTranslation();

  return (
    <div
      className={`relative overflow-hidden rounded-2xl ring-1 ring-black/10 ${PROMO_SMALL_CARD_MIN_HEIGHT_CLASS}`}
    >
      <Image
        src={PROMO_SIDE_CARD_A_BG_SRC}
        alt=""
        fill
        className="object-cover"
        sizes="(max-width: 768px) 45vw, 200px"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/35 to-black/65" />
      <div className="absolute left-3 top-3">
        <Link
          href="/products"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-marco-yellow text-marco-black shadow-md transition hover:brightness-95"
          aria-label={t('home.promo_card_arrow_aria')}
        >
          <ArrowUpRight className="h-4 w-4" strokeWidth={2.5} />
        </Link>
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center px-2">
        <Armchair className="h-10 w-10 text-white/90 sm:h-12 sm:w-12" strokeWidth={1.25} />
      </div>
      <div className="absolute bottom-3 left-2 right-2 flex justify-center">
        <span className="rounded-full bg-black/75 px-3 py-1.5 text-center text-[10px] font-medium leading-tight text-white backdrop-blur-sm sm:text-xs">
          {pillLabel}
        </span>
      </div>
    </div>
  );
}
