'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { useId } from 'react';
import { useTranslation } from '../../lib/i18n-client';
import {
  PROMO_CARD_TWO_CLIP_PATH_D,
  PROMO_SIDE_CARD_B_BANNER_SRC,
  PROMO_SMALL_CARD_MIN_HEIGHT_CLASS,
} from './home-promo.constants';

const PROMO_CARD_TWO_IMAGE_SIZES = '(max-width: 768px) 45vw, 220px';

export function HomePromoPromoCardTwo() {
  const { t } = useTranslation();
  const clipPathReactId = useId();
  const clipPathId = `home-promo-card-two-clip-${clipPathReactId.replace(/\W/g, '')}`;

  return (
    <Link
      href="/products"
      className={`relative block shadow-sm ring-1 ring-black/10 transition hover:opacity-95 ${PROMO_SMALL_CARD_MIN_HEIGHT_CLASS}`}
      aria-label={t('home.promo_side_card_two_aria')}
    >
      <svg width={0} height={0} className="pointer-events-none absolute" aria-hidden>
        <defs>
          <clipPath id={clipPathId} clipPathUnits="objectBoundingBox">
            <path d={PROMO_CARD_TWO_CLIP_PATH_D} />
          </clipPath>
        </defs>
      </svg>
      {/* Clip only the banner layer so the CTA icon is not clipped by the mask */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `url(#${clipPathId})` }}
      >
        <Image
          src={PROMO_SIDE_CARD_B_BANNER_SRC}
          alt=""
          fill
          className="object-cover object-center"
          sizes={PROMO_CARD_TWO_IMAGE_SIZES}
          priority
        />
      </div>
      <div
        className="pointer-events-none absolute left-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-marco-black text-marco-yellow shadow-md ring-1 ring-white/20"
        aria-hidden
      >
        <ArrowUpRight className="h-4 w-4 shrink-0" strokeWidth={2.5} aria-hidden />
      </div>
    </Link>
  );
}
