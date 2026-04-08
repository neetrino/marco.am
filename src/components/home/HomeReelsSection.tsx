'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { montserratArm } from '@/fonts/montserrat-arm';
import { REELS_THUMB_IMAGE_URLS } from '@/constants/homeReels';
import { useTranslation } from '@/lib/i18n-client';

const REEL_COUNT = REELS_THUMB_IMAGE_URLS.length;

export function HomeReelsSection() {
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [paginationIndex, setPaginationIndex] = useState(0);

  const captionsRaw = t('home.reels_captions');
  const parts = captionsRaw
    .split('|')
    .map((c) => c.trim())
    .filter((c) => c.length > 0);
  const fallback = t('home.reels_title');
  const captions = Array.from(
    { length: REEL_COUNT },
    (_, i) => parts[i] ?? parts[0] ?? fallback,
  );

  const syncPagination = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxScroll <= 1) {
      setPaginationIndex(0);
      return;
    }
    setPaginationIndex(el.scrollLeft > maxScroll / 2 ? 1 : 0);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    syncPagination();
    el.addEventListener('scroll', syncPagination, { passive: true });
    const ro = new ResizeObserver(() => syncPagination());
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', syncPagination);
      ro.disconnect();
    };
  }, [syncPagination]);

  const scrollBy = (dir: -1 | 1) => {
    const el = scrollRef.current;
    if (!el) return;
    const delta = dir * Math.min(el.clientWidth * 0.55, 400);
    el.scrollBy({ left: delta, behavior: 'smooth' });
  };

  return (
    <section className="bg-white py-10 md:py-12">
      <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h2
            className={`${montserratArm.className} text-3xl font-black uppercase tracking-tight text-[#181111] md:text-4xl`}
          >
            {t('home.reels_title')}
          </h2>
          <div className="mt-2 h-1 w-20 rounded-sm bg-[#ffca03] md:w-24" />
        </div>
        <div className="flex shrink-0 gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => scrollBy(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-[#101010] transition-colors hover:bg-[#ffca03] hover:text-white"
            aria-label={t('home.reels_scroll_prev')}
          >
            <ChevronLeft className="h-5 w-5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => scrollBy(1)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-[#101010] transition-colors hover:bg-[#ffca03] hover:text-white"
            aria-label={t('home.reels_scroll_next')}
          >
            <ChevronRight className="h-5 w-5" aria-hidden />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="scrollbar-hide -mx-1 flex gap-6 overflow-x-auto pb-2 pt-1 md:gap-8 lg:gap-[108px]"
      >
        {REELS_THUMB_IMAGE_URLS.map((src, i) => (
            <button
              key={src}
              type="button"
              aria-label={captions[i]}
              className={`${montserratArm.className} group flex w-[120px] shrink-0 flex-col items-center gap-3 text-left sm:w-[130px] md:w-[145px]`}
            >
              <div className="relative h-[120px] w-[120px] max-w-[min(145px,85vw)] rounded-full bg-[#f0f0f0] p-[11px] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06)] ring-2 ring-white transition-transform group-hover:scale-[1.02] md:h-[145px] md:w-[145px]">
                <div className="relative h-full w-full overflow-hidden rounded-full">
                  <Image
                    src={src}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="145px"
                    unoptimized
                  />
                </div>
              </div>
              <span className="max-w-[160px] text-center text-sm font-normal leading-7 text-[#050401] md:text-[18px]">
                {captions[i]}
              </span>
            </button>
        ))}
      </div>

      <div className="mt-6 flex justify-center gap-2 md:mt-8" aria-hidden>
        {[0, 1].map((dot) => (
          <span
            key={dot}
            className={`h-3 w-3 rounded-full ${
              paginationIndex === dot ? 'bg-[#101010]' : 'bg-gray-300'
            }`}
          />
        ))}
      </div>
    </section>
  );
}
