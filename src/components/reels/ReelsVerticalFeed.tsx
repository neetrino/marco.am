'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Montserrat } from 'next/font/google';

import { apiClient } from '../../lib/api-client';
import { useTranslation } from '../../lib/i18n-client';
import type { PublicReelItem } from '../../lib/schemas/reels-management.schema';
import { ReelsFeedSlide } from './ReelsFeedSlide';
import {
  REELS_FEED_SCROLL_CONTAINER_CLASS,
  REELS_FEED_SLIDE_ID_PREFIX,
} from './reels-vertical-feed.constants';
import { useActiveReelIndex } from './useActiveReelIndex';
import { useReelsFeedData } from './useReelsFeedData';

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['600', '700'],
  display: 'swap',
});

export type ReelsVerticalFeedProps = {
  initialIndex: number;
  items: PublicReelItem[];
};

/** Vertical snap-scrolling reels feed powered by public reels metadata API. */
export function ReelsVerticalFeed({ initialIndex, items }: ReelsVerticalFeedProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const viewedReelIdsRef = useRef<Set<string>>(new Set());
  const { reelItems, pendingLikeById, doubleTapBurstById, toggleLike } =
    useReelsFeedData(items);
  const activeIndex = useActiveReelIndex({
    containerRef: scrollContainerRef,
    initialIndex,
    itemCount: reelItems.length,
  });
  const [shouldReduceMotion, setShouldReduceMotion] = useState(false);

  const scrollToReelByIndex = (index: number) => {
    const next = Math.max(0, Math.min(reelItems.length - 1, index));
    const target = document.getElementById(`${REELS_FEED_SLIDE_ID_PREFIX}${next}`);
    target?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  };

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => {
      setShouldReduceMotion(media.matches);
    };
    sync();
    media.addEventListener('change', sync);
    return () => {
      media.removeEventListener('change', sync);
    };
  }, []);

  useEffect(() => {
    const activeItem = reelItems[activeIndex];
    if (!activeItem) {
      return;
    }
    if (viewedReelIdsRef.current.has(activeItem.id)) {
      return;
    }
    viewedReelIdsRef.current.add(activeItem.id);
    void apiClient
      .post(`/api/v1/reels/${activeItem.id}/view`)
      .catch(() => {
        viewedReelIdsRef.current.delete(activeItem.id);
      });
  }, [activeIndex, reelItems]);

  return (
    <div
      className={`fixed inset-0 z-[120] isolate bg-black/70 text-white backdrop-blur-xl ${montserrat.className}`}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(255,255,255,0.12)_0%,rgba(255,255,255,0.02)_36%,rgba(0,0,0,0.66)_75%)]"
        aria-hidden
      />
      {reelItems.length > 1 ? (
        <div className="absolute right-[460px] top-1/2 z-40 flex -translate-y-1/2 flex-col gap-2">
          <button
            type="button"
            onClick={() => scrollToReelByIndex(activeIndex - 1)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/30 bg-black/45 text-white shadow-[0_8px_20px_rgba(0,0,0,0.24)] transition-all duration-200 hover:border-marco-yellow hover:bg-marco-yellow hover:text-marco-black disabled:cursor-not-allowed disabled:opacity-45"
            aria-label="Previous reel"
            disabled={activeIndex <= 0}
          >
            <ChevronUp className="h-5 w-5" strokeWidth={2} aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => scrollToReelByIndex(activeIndex + 1)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/30 bg-black/45 text-white shadow-[0_8px_20px_rgba(0,0,0,0.24)] transition-all duration-200 hover:border-marco-yellow hover:bg-marco-yellow hover:text-marco-black disabled:cursor-not-allowed disabled:opacity-45"
            aria-label="Next reel"
            disabled={activeIndex >= reelItems.length - 1}
          >
            <ChevronDown className="h-5 w-5" strokeWidth={2} aria-hidden />
          </button>
        </div>
      ) : null}
      <div
        ref={scrollContainerRef}
        className={REELS_FEED_SCROLL_CONTAINER_CLASS}
        role="feed"
        aria-label={t('home.reels_feed_region_aria')}
      >
        {reelItems.map((item, index) => (
          <ReelsFeedSlide
            key={item.id}
            item={item}
            index={index}
            activeIndex={activeIndex}
            totalCount={reelItems.length}
            shouldReduceMotion={shouldReduceMotion}
            pendingLikeById={pendingLikeById}
            doubleTapBurstById={doubleTapBurstById}
            backAriaLabel={t('home.reels_feed_back_aria')}
            likeAriaLabel={t('home.reels_feed_like_aria')}
            onClose={() => {
              router.push('/reels');
            }}
            onToggleLike={(reelId) => {
              toggleLike({ reelId });
            }}
            onDoubleTapLike={(reelId) => {
              toggleLike({
                reelId,
                forceLiked: true,
                registerBurst: true,
              });
            }}
          />
        ))}
      </div>
      {reelItems.length === 0 ? (
        <div className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-white/70">
          {t('home.reels_feed_hint_screen_reader')}
        </div>
      ) : null}
      <p className="sr-only">{t('home.reels_feed_hint_screen_reader')}</p>
    </div>
  );
}
