'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { montserratArm } from '@/fonts/montserrat-arm';
import { useTranslation } from '@/lib/i18n-client';
import { CarouselArrow } from './CarouselArrow';

const BRANDS_PER_PAGE = 4;

type BrandKey =
  | 'hisense'
  | 'samsung'
  | 'lg'
  | 'panasonic'
  | 'sony'
  | 'toshiba'
  | 'bosch'
  | 'gorenje';

interface BrandShowcaseItem {
  key: BrandKey;
  label: string;
  href: string;
}

const BRAND_SHOWCASE: BrandShowcaseItem[] = [
  { key: 'hisense', label: 'Hisense', href: '/products?brand=Hisense' },
  { key: 'samsung', label: 'Samsung', href: '/products?brand=Samsung' },
  { key: 'lg', label: 'LG', href: '/products?brand=LG' },
  { key: 'panasonic', label: 'Panasonic', href: '/products?brand=Panasonic' },
  { key: 'sony', label: 'SONY', href: '/products?brand=Sony' },
  { key: 'toshiba', label: 'TOSHIBA', href: '/products?brand=Toshiba' },
  { key: 'bosch', label: 'BOSCH', href: '/products?brand=Bosch' },
  { key: 'gorenje', label: 'gorenje', href: '/products?brand=Gorenje' },
];

function BrandLogo({ brand }: { brand: BrandKey }) {
  if (brand === 'hisense') {
    return (
      <Image
        src="/images/brand-hisense-logo.png"
        alt="Hisense"
        width={486}
        height={109}
        className="h-auto w-[240px] max-w-full md:w-[300px]"
        unoptimized
        priority={false}
      />
    );
  }

  if (brand === 'samsung') {
    return (
      <Image
        src="/images/brand-samsung-logo.png"
        alt="Samsung"
        width={423}
        height={140}
        className="h-auto w-[250px] max-w-full md:w-[305px]"
        unoptimized
        priority={false}
      />
    );
  }

  if (brand === 'lg') {
    return (
      <Image
        src="/images/brand-lg-logo.png"
        alt="LG"
        width={346}
        height={140}
        className="h-auto w-[215px] max-w-full md:w-[270px]"
        unoptimized
        priority={false}
      />
    );
  }

  if (brand === 'panasonic') {
    return (
      <Image
        src="/images/brand-panasonic-logo.png"
        alt="Panasonic"
        width={486}
        height={127}
        className="h-auto w-[240px] max-w-full md:w-[300px]"
        unoptimized
        priority={false}
      />
    );
  }

  if (brand === 'sony') {
    return (
      <span
        className="text-[clamp(2rem,2.6vw,3.7rem)] font-semibold uppercase leading-none tracking-[0.06em] text-[#111111]"
        aria-hidden
      >
        SONY
      </span>
    );
  }

  if (brand === 'toshiba') {
    return (
      <span
        className="text-[clamp(1.8rem,2.5vw,3.35rem)] font-bold uppercase leading-none tracking-[0.08em] text-[#e60012]"
        aria-hidden
      >
        TOSHIBA
      </span>
    );
  }

  if (brand === 'bosch') {
    return (
      <div className="flex items-center gap-4 md:gap-5" aria-hidden>
        <div className="flex h-[76px] w-[76px] items-center justify-center rounded-full border-[4px] border-[#e10f1e] text-[1.85rem] font-bold leading-none text-[#6b7280] md:h-[92px] md:w-[92px] md:text-[2.15rem]">
          H
        </div>
        <span className="text-[clamp(2rem,2.8vw,3.6rem)] font-bold uppercase leading-none tracking-[0.08em] text-[#e10f1e]">
          BOSCH
        </span>
      </div>
    );
  }

  return (
    <span
      className="text-[clamp(2rem,2.7vw,3.7rem)] font-bold lowercase leading-none tracking-[-0.05em] text-[#111111]"
      aria-hidden
    >
      gorenje
    </span>
  );
}

export function HomeBrandsSection() {
  const { t } = useTranslation();
  const [pageIndex, setPageIndex] = useState(0);

  const totalPages = Math.ceil(BRAND_SHOWCASE.length / BRANDS_PER_PAGE);
  const safePageIndex = Math.min(pageIndex, totalPages - 1);

  const visibleBrands = useMemo(() => {
    const start = safePageIndex * BRANDS_PER_PAGE;
    return BRAND_SHOWCASE.slice(start, start + BRANDS_PER_PAGE);
  }, [safePageIndex]);

  return (
    <section className="relative left-1/2 right-1/2 w-screen -translate-x-1/2 bg-white py-16 md:py-20 xl:py-24">
      <div className="mx-auto w-full max-w-[1680px] px-6 md:px-10 xl:px-12">
        <div className="mb-10 flex flex-col gap-6 md:mb-14 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0 pt-2 md:pt-4">
            <h2
              className={`${montserratArm.className} text-[clamp(2.15rem,4.2vw,5.15rem)] font-bold uppercase leading-[0.92] tracking-[-0.05em] text-[#1d1215]`}
            >
              {t('home.brands_title')}
            </h2>
            <div className="mt-4 h-1 w-[110px] rounded-full bg-[#ffca03]" aria-hidden />
          </div>

          {totalPages > 1 ? (
            <div className="flex shrink-0 gap-3 self-end md:pt-4">
              <CarouselArrow
                direction="prev"
                disabled={safePageIndex === 0}
                onClick={() => setPageIndex((current) => Math.max(0, current - 1))}
                label={t('home.special_offers_carousel_prev')}
                variant="dark"
              />
              <CarouselArrow
                direction="next"
                disabled={safePageIndex >= totalPages - 1}
                onClick={() => setPageIndex((current) => Math.min(totalPages - 1, current + 1))}
                label={t('home.special_offers_carousel_next')}
                variant="dark"
              />
            </div>
          ) : null}
        </div>

        <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 sm:gap-8 xl:grid-cols-4 xl:gap-12">
          {visibleBrands.map((brand) => (
            <Link
              key={brand.key}
              href={brand.href}
              className="group flex h-[143.52px] w-full items-center justify-center rounded-[32px] bg-[#f6f6f6] px-6 py-8 transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] md:px-8 xl:w-[363.978px]"
              aria-label={brand.label}
            >
              <div className="flex max-w-full justify-center transition duration-300 group-hover:scale-[1.02]">
                <BrandLogo brand={brand.key} />
              </div>
            </Link>
          ))}
        </div>

        {totalPages > 1 ? (
          <div
            className="mt-12 flex items-center justify-center gap-2 md:mt-14"
            role="tablist"
            aria-label={t('home.special_offers_carousel_dots')}
          >
            {Array.from({ length: totalPages }).map((_, index) => (
              <button
                key={index}
                type="button"
                role="tab"
                aria-selected={index === safePageIndex}
                aria-label={`${t('home.special_offers_carousel_page')} ${index + 1}`}
                onClick={() => setPageIndex(index)}
                className={`rounded-full transition-all duration-300 ${
                  index === safePageIndex ? 'h-2.5 w-2.5 bg-[#181111]' : 'h-2.5 w-2.5 bg-[#d1d5db]'
                }`}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
