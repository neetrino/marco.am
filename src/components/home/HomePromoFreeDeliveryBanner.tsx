'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useTranslation } from '../../lib/i18n-client';
import { HERO_FREE_DELIVERY_BANNER_IMAGE_SRC } from '../hero.constants';

/** Figma export 404×557 — `node-id=305-2151` */
const HERO_FREE_DELIVERY_BANNER_WIDTH_PX = 404;
const HERO_FREE_DELIVERY_BANNER_HEIGHT_PX = 557;

/**
 * Free delivery promo tile — sits beside `HomePromoStackedProductCard` (blue stack).
 * Raster includes typography and notch; scales with hero breakpoints.
 */
export function HomePromoFreeDeliveryBanner() {
  const { t } = useTranslation();

  return (
    <Link
      href="/delivery"
      className="block shrink-0 transition hover:opacity-95"
      aria-label={t('home.promo_free_delivery_banner_aria')}
    >
      <Image
        src={HERO_FREE_DELIVERY_BANNER_IMAGE_SRC}
        alt=""
        width={HERO_FREE_DELIVERY_BANNER_WIDTH_PX}
        height={HERO_FREE_DELIVERY_BANNER_HEIGHT_PX}
        className="h-auto w-[min(42vw,148px)] sm:w-[min(38vw,164px)] md:w-[min(30vw,180px)] lg:w-[200px] xl:w-[236px]"
        sizes="(max-width: 640px) 42vw, (max-width: 768px) 38vw, (max-width: 1024px) 30vw, 236px"
        priority
      />
    </Link>
  );
}
