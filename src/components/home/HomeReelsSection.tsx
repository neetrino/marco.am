'use client';

import { useRef } from 'react';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { useTranslation } from '@/lib/i18n-client';

const REEL_COUNT = 6;

export function HomeReelsSection() {
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);

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

  const scrollBy = (dir: -1 | 1) => {
    const el = scrollRef.current;
    if (!el) return;
    const delta = dir * Math.min(el.clientWidth * 0.6, 360);
    el.scrollBy({ left: delta, behavior: 'smooth' });
  };

  return (
    <section className="border-y border-[#ebebeb] bg-white py-10 md:py-12">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h2 className="text-2xl font-black uppercase tracking-wider text-[#101010] md:text-3xl">
          {t('home.reels_title')}
        </h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => scrollBy(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-[#101010] shadow-sm transition-colors hover:bg-gray-50"
            aria-label={t('home.reels_scroll_prev')}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => scrollBy(1)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-[#101010] shadow-sm transition-colors hover:bg-gray-50"
            aria-label={t('home.reels_scroll_next')}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="scrollbar-hide flex gap-4 overflow-x-auto pb-2 pt-1"
      >
        {Array.from({ length: REEL_COUNT }).map((_, i) => (
          <button
            key={i}
            type="button"
            className="group flex w-[120px] shrink-0 flex-col items-center gap-3 text-left md:w-[140px]"
          >
            <div className="relative flex h-[120px] w-[120px] items-center justify-center rounded-full bg-gradient-to-br from-[#f4f4f4] to-[#e0e0e0] shadow-inner ring-2 ring-white transition-transform group-hover:scale-[1.02] md:h-[140px] md:w-[140px]">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#101010]/90 text-white shadow-md">
                <Play className="h-5 w-5 fill-current pl-0.5" />
              </span>
            </div>
            <span className="max-w-[120px] text-center text-xs font-medium leading-snug text-[#333] md:text-sm">
              {captions[i]}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
