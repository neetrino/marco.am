'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useTranslation } from '@/lib/i18n-client';
import { HOME_APP_BANNER_PUBLIC_PATH } from '@/constants/homeAppBanner';

/** Figma 305:2155 “App banner” frame (1527×570). */
const BANNER_WIDTH = 1527;
const BANNER_HEIGHT = 570;

type BannerMode = 'checking' | 'raster' | 'fallback';

function BannerSkeleton() {
  return (
    <section className="bg-white py-8 md:py-10">
      <div
        className="animate-pulse rounded-[20px] bg-[#ffca03]"
        style={{ aspectRatio: `${BANNER_WIDTH} / ${BANNER_HEIGHT}` }}
        aria-hidden
      />
    </section>
  );
}

function AppBannerRaster(props: {
  src: string;
  alt: string;
  onError: () => void;
}) {
  return (
    <section className="bg-white py-8 md:py-10">
      <div
        className="relative w-full overflow-hidden rounded-[20px] bg-[#ffca03]"
        style={{ aspectRatio: `${BANNER_WIDTH} / ${BANNER_HEIGHT}` }}
      >
        <Image
          src={props.src}
          alt={props.alt}
          fill
          className="object-cover object-center"
          sizes="(max-width: 1600px) 100vw, 1600px"
          unoptimized
          priority={false}
          onError={props.onError}
        />
      </div>
    </section>
  );
}

function AppBannerFallback() {
  const { t } = useTranslation();

  return (
    <section className="bg-white py-8 md:py-10">
      <div className="overflow-hidden rounded-[20px] bg-[#ffca03] px-6 py-8 md:px-12 md:py-10">
        <div className="flex flex-col items-center gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl text-center lg:text-left">
              <h2 className="text-2xl font-black text-[#101010] md:text-3xl">
                {t('home.app_promo_title')}
              </h2>
              <p className="mt-3 text-base font-medium text-[#333] md:text-lg">
                {t('home.app_promo_subtitle')}
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
                <Link
                  href="#"
                  className="inline-flex min-h-[44px] min-w-[140px] items-center justify-center rounded-full bg-[#101010] px-6 text-sm font-semibold text-white"
                  aria-label={t('home.app_store')}
                >
                  {t('home.app_store')}
                </Link>
                <Link
                  href="#"
                  className="inline-flex min-h-[44px] min-w-[140px] items-center justify-center rounded-full border-2 border-[#101010] bg-white px-6 text-sm font-semibold text-[#101010]"
                  aria-label={t('home.google_play')}
                >
                  {t('home.google_play')}
                </Link>
              </div>
            </div>

          <div
            className="flex h-36 w-36 shrink-0 items-center justify-center rounded-2xl border-2 border-dashed border-[#101010]/30 bg-white md:h-44 md:w-44"
            role="img"
            aria-label={t('home.app_qr_aria')}
          >
            <span className="text-center text-xs font-medium text-[#666]">QR</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export function HomeAppPromoBanner() {
  const { t } = useTranslation();
  const [mode, setMode] = useState<BannerMode>('checking');
  const [rasterFailed, setRasterFailed] = useState(false);

  const envSrc = process.env.NEXT_PUBLIC_HOME_APP_BANNER_SRC;
  const rasterSrc = envSrc ?? HOME_APP_BANNER_PUBLIC_PATH;

  useEffect(() => {
    if (envSrc?.startsWith('http')) {
      setMode('raster');
      return;
    }
    fetch(rasterSrc, { method: 'HEAD' })
      .then((res) => setMode(res.ok ? 'raster' : 'fallback'))
      .catch(() => setMode('fallback'));
  }, [envSrc, rasterSrc]);

  if (mode === 'checking') {
    return <BannerSkeleton />;
  }

  if (mode === 'raster' && !rasterFailed) {
    return (
      <AppBannerRaster
        src={rasterSrc}
        alt={t('home.app_promo_title')}
        onError={() => setRasterFailed(true)}
      />
    );
  }

  return <AppBannerFallback />;
}
