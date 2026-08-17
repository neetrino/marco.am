'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';

import { HOME_HERO_MOBILE_AUTO_ROTATE_MS } from '@/lib/constants/home-hero-mobile-slides';
import { shouldBypassNextImageOptimizer } from '@/lib/utils/should-bypass-next-image-optimizer';

/** Pause auto-advance after manual swipe / dot tap. */
const HERO_MOBILE_USER_PAUSE_MS = 8000;

type HeroMobileCarouselProps = {
  images: string[];
};

/**
 * Mobile-only home hero slider: swipe manually, auto-advance every 4s when >1 slide.
 */
export function HeroMobileCarousel({ images }: HeroMobileCarouselProps) {
  const slides = images.length > 0 ? images : [];
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const pauseUntilRef = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);

  const syncIndexFromScroll = useCallback(() => {
    const el = scrollerRef.current;
    if (!el || slides.length === 0) return;
    const width = el.clientWidth;
    if (width === 0) return;
    const next = Math.round(el.scrollLeft / width);
    setActiveIndex(Math.max(0, Math.min(slides.length - 1, next)));
  }, [slides.length]);

  const goToIndex = useCallback((index: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    const width = el.clientWidth;
    el.scrollTo({ left: index * width, behavior: 'smooth' });
  }, []);

  const markUserInteraction = useCallback(() => {
    pauseUntilRef.current = Date.now() + HERO_MOBILE_USER_PAUSE_MS;
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.addEventListener('scroll', syncIndexFromScroll, { passive: true });
    return () => el.removeEventListener('scroll', syncIndexFromScroll);
  }, [syncIndexFromScroll]);

  useEffect(() => {
    if (slides.length <= 1) return;

    const intervalId = window.setInterval(() => {
      if (Date.now() < pauseUntilRef.current) return;
      const el = scrollerRef.current;
      if (!el) return;
      const width = el.clientWidth;
      if (width === 0) return;
      const current = Math.round(el.scrollLeft / width);
      const next = current >= slides.length - 1 ? 0 : current + 1;
      el.scrollTo({ left: next * width, behavior: 'smooth' });
    }, HOME_HERO_MOBILE_AUTO_ROTATE_MS);

    return () => window.clearInterval(intervalId);
  }, [slides.length]);

  if (slides.length === 0) {
    return null;
  }

  if (slides.length === 1) {
    const src = slides[0];
    return (
      <div className="absolute inset-0 z-0 md:hidden">
        <Image
          src={src}
          alt=""
          fill
          priority
          unoptimized={shouldBypassNextImageOptimizer(src)}
          className="object-cover object-center"
          sizes="100vw"
        />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-0 md:hidden">
      <div
        ref={scrollerRef}
        className="flex h-full w-full snap-x snap-mandatory overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        onTouchStart={markUserInteraction}
        onPointerDown={markUserInteraction}
        aria-roledescription="carousel"
      >
        {slides.map((src, index) => (
          <div
            key={`${src}-${index}`}
            className="relative h-full w-full shrink-0 snap-center"
            aria-hidden={index !== activeIndex}
          >
            <Image
              src={src}
              alt=""
              fill
              priority={index === 0}
              unoptimized={shouldBypassNextImageOptimizer(src)}
              className="object-cover object-center"
              sizes="100vw"
            />
          </div>
        ))}
      </div>

      <div
        className="pointer-events-none absolute inset-x-0 bottom-3 z-10 flex justify-center gap-1.5"
        role="group"
        aria-label="Hero slides"
      >
        {slides.map((_, index) => {
          const active = index === activeIndex;
          return (
            <button
              key={index}
              type="button"
              aria-label={`Go to slide ${index + 1}`}
              aria-current={active ? 'true' : undefined}
              className="pointer-events-auto flex h-7 w-7 shrink-0 items-center justify-center rounded-full focus-visible:outline focus-visible:ring-2 focus-visible:ring-white/60"
              onClick={() => {
                markUserInteraction();
                goToIndex(index);
              }}
            >
              <span
                className={`h-2 w-2 rounded-full transition-colors ${active ? 'bg-white' : 'bg-white/45'}`}
                aria-hidden
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
