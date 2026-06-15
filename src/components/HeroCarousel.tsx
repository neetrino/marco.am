'use client';

import Image from 'next/image';
import type { HeroCarouselImageUrls } from '../lib/home-hero-carousel-urls';
import { shouldBypassNextImageOptimizer } from '../lib/utils/should-bypass-next-image-optimizer';
import { HOME_PAGE_SECTION_SHELL_CLASS } from './home/home-page-section-shell.constants';

const HERO_PAGE_CONTAINER_CLASS = `${HOME_PAGE_SECTION_SHELL_CLASS} pt-8 sm:pt-11 lg:pt-10`;

const HERO_DESKTOP_IMAGE_SIZES =
  '(max-width: 1024px) 50vw, (max-width: 1280px) 38vw, min(40vw, 520px)';

type HeroCarouselProps = {
  heroImageUrls: HeroCarouselImageUrls;
};

export function HeroCarousel({ heroImageUrls }: HeroCarouselProps) {
  const { leftTop, leftBottom, right, mobile } = heroImageUrls;

  return (
    <div className={HERO_PAGE_CONTAINER_CLASS} id="hero">
      {/* Mobile aspect 399/288 — sync with hero.constants HERO_MOBILE_HOME_BANNER_ASPECT_* */}
      <div className="relative aspect-[399/288] w-full min-w-0 overflow-hidden rounded-[24px] bg-neutral-950 box-border md:aspect-[141/68] md:rounded-[32px] md:bg-transparent">
        <div className="absolute inset-0 z-0 md:hidden">
          <Image
            src={mobile}
            alt=""
            fill
            priority
            unoptimized={shouldBypassNextImageOptimizer(mobile)}
            className="object-cover object-center"
            sizes="100vw"
          />
        </div>

        <div className="hidden h-full w-full grid-cols-[minmax(0,1.24fr)_minmax(0,0.96fr)] gap-3 md:grid md:p-0 lg:gap-4 lg:p-0">
          <div className="grid h-full min-w-0 grid-rows-2 gap-3 lg:gap-4">
            <div className="relative h-full min-w-0 overflow-hidden rounded-[30px]">
              <Image
                src={leftTop}
                alt=""
                fill
                priority
                unoptimized={shouldBypassNextImageOptimizer(leftTop)}
                className="object-cover object-[center_16%]"
                sizes={HERO_DESKTOP_IMAGE_SIZES}
              />
            </div>
            <div className="relative h-full min-w-0 overflow-hidden rounded-[30px]">
              <Image
                src={leftBottom}
                alt=""
                fill
                unoptimized={shouldBypassNextImageOptimizer(leftBottom)}
                className="object-cover object-[center_58%]"
                sizes={HERO_DESKTOP_IMAGE_SIZES}
              />
            </div>
          </div>
          <div className="relative h-full min-w-0 overflow-hidden rounded-[30px]">
            <Image
              src={right}
              alt=""
              fill
              unoptimized={shouldBypassNextImageOptimizer(right)}
              className="object-cover object-[center_58%]"
              sizes="(max-width: 1280px) 42vw, min(45vw, 560px)"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
