'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useLayoutEffect, useState } from 'react';
import { ArrowLeft, Heart } from 'lucide-react';
import { Montserrat } from 'next/font/google';

import { useTranslation } from '../../lib/i18n-client';
import { REELS_ITEMS } from '../home/home-reels.constants';
import { REELS_FEED_SCROLL_CONTAINER_CLASS } from './reels-vertical-feed.constants';

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['600', '700'],
  display: 'swap',
});

export type ReelsVerticalFeedProps = {
  initialIndex: number;
};

/**
 * Vertical snap-scrolling “reels” feed (poster images until CMS/video URLs exist).
 */
export function ReelsVerticalFeed({ initialIndex }: ReelsVerticalFeedProps) {
  const { t } = useTranslation();
  const [liked, setLiked] = useState<Record<number, boolean>>({});

  useLayoutEffect(() => {
    const id = `reel-slide-${initialIndex}`;
    const el = document.getElementById(id);
    el?.scrollIntoView({ block: 'start' });
  }, [initialIndex]);

  const toggleLike = (index: number) => {
    setLiked((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <div
      className={`relative bg-black text-white ${montserrat.className}`}
    >
      <div className="sticky top-0 z-20 flex items-center gap-3 border-b border-white/10 bg-black/80 px-4 py-3 backdrop-blur-sm">
        <Link
          href="/"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          aria-label={t('home.reels_feed_back_aria')}
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={2} aria-hidden />
        </Link>
        <span className="text-sm font-bold uppercase tracking-wide text-white/90">
          {t('home.reels_title')}
        </span>
      </div>

      <div
        className={REELS_FEED_SCROLL_CONTAINER_CLASS}
        role="feed"
        aria-label={t('home.reels_feed_region_aria')}
      >
        {REELS_ITEMS.map((item, index) => {
          const label = t(`home.${item.labelKey}`);
          const isLiked = liked[index] === true;
          return (
            <article
              id={`reel-slide-${index}`}
              key={item.labelKey}
              aria-posinset={index + 1}
              aria-setsize={REELS_ITEMS.length}
              className="relative flex min-h-full shrink-0 snap-start snap-always flex-col"
            >
              <div className="relative min-h-full flex-1 overflow-hidden bg-neutral-900">
                <Image
                  src={item.imageSrc}
                  alt={label}
                  fill
                  sizes="100vw"
                  className="object-cover object-center"
                  priority={index === initialIndex}
                />
                <div
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"
                  aria-hidden
                />
                <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 p-4 pb-6 md:p-8">
                  <h2 className="text-xl font-bold leading-tight text-white drop-shadow md:text-2xl">
                    {label}
                  </h2>
                  <Link
                    href="/products"
                    className="pointer-events-auto inline-flex w-fit items-center rounded-full bg-marco-yellow px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-marco-black transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marco-yellow"
                  >
                    {t('home.reels_feed_shop_cta')}
                  </Link>
                </div>
                <div className="absolute right-3 top-1/2 flex -translate-y-1/2 flex-col items-center gap-2 md:right-5">
                  <button
                    type="button"
                    className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full border border-white/30 bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                    aria-pressed={isLiked}
                    aria-label={t('home.reels_feed_like_aria')}
                    onClick={() => {
                      toggleLike(index);
                    }}
                  >
                    <Heart
                      className={`h-6 w-6 ${isLiked ? 'fill-marco-yellow text-marco-yellow' : ''}`}
                      strokeWidth={2}
                      aria-hidden
                    />
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
      <p className="sr-only">{t('home.reels_feed_hint_screen_reader')}</p>
    </div>
  );
}
