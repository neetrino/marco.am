'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useTranslation } from '../../lib/i18n-client';
import { HERO_PROMO_SMARTPHONES_BANNER_IMAGE_SRC } from '../hero.constants';

/** Figma export 772×834 — `node-id=305-2154` */
const HERO_PROMO_SMARTPHONES_BANNER_WIDTH_PX = 772;
const HERO_PROMO_SMARTPHONES_BANNER_HEIGHT_PX = 834;

/**
 * Smartphones / 80% promo tile — raster; scales with `HomePromoFreeDeliveryBanner` widths.
 */
export function HomePromoSmartphonesBanner() {
  const { t } = useTranslation();

  return (
    <Link
      href="/products"
      className="block shrink-0 transition hover:opacity-95"
      aria-label={t('home.promo_smartphones_banner_aria')}
    >
      <Image
        src={HERO_PROMO_SMARTPHONES_BANNER_IMAGE_SRC}
        alt=""
        width={HERO_PROMO_SMARTPHONES_BANNER_WIDTH_PX}
        height={HERO_PROMO_SMARTPHONES_BANNER_HEIGHT_PX}
        className="h-auto w-[min(42vw,148px)] sm:w-[min(38vw,164px)] md:w-[min(30vw,180px)] lg:w-[200px] xl:w-[236px]"
        sizes="(max-width: 640px) 42vw, (max-width: 768px) 38vw, (max-width: 1024px) 30vw, 236px"
        priority
      />
    </Link>
  );
}
