'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Montserrat } from 'next/font/google';

import { useTranslation } from '../../lib/i18n-client';
import type { PublicReelItem } from '../../lib/schemas/reels-management.schema';
import { ReelLikeButton } from './ReelLikeButton';
import { ReelOverlay } from './ReelOverlay';
import { ReelVideoPlayer } from './ReelVideoPlayer';
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
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { reelItems, pendingLikeById, doubleTapBurstById, toggleLike } =
    useReelsFeedData(items);
  const activeIndex = useActiveReelIndex({
    containerRef: scrollContainerRef,
    initialIndex,
    itemCount: reelItems.length,
  });
  const [shouldReduceMotion, setShouldReduceMotion] = useState(false);

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

  const feedContent = useMemo(() => {
    return reelItems.map((item, index) => {
      const isActive = index === activeIndex;
      return (
        <article
          id={`${REELS_FEED_SLIDE_ID_PREFIX}${index}`}
          key={item.id}
          aria-posinset={index + 1}
          aria-setsize={reelItems.length}
          className="relative flex h-full min-h-full shrink-0 snap-start snap-always items-center justify-center p-1.5 md:p-3"
        >
          <div className="relative h-full max-h-full w-auto max-w-full aspect-[9/16] overflow-hidden rounded-none bg-black md:rounded-[1.75rem] md:border md:border-white/10">
            <ReelVideoPlayer
              reelId={item.id}
              title={item.title}
              videoUrl={item.videoUrl}
              poster={item.poster}
              isActive={isActive}
              shouldReduceMotion={shouldReduceMotion}
              onDoubleTapLike={(reelId) => {
                toggleLike({
                  reelId,
                  forceLiked: true,
                  registerBurst: true,
                });
              }}
            />
            <ReelOverlay title={item.title} />
            <ReelLikeButton
              ariaLabel={t('home.reels_feed_like_aria')}
              liked={item.likedByCurrentUser}
              likesCount={item.likesCount}
              burstVersion={doubleTapBurstById[item.id] ?? 0}
              disabled={pendingLikeById[item.id] === true}
              onToggle={() => {
                toggleLike({ reelId: item.id });
              }}
            />
          </div>
        </article>
      );
    });
  }, [
    activeIndex,
    doubleTapBurstById,
    pendingLikeById,
    reelItems,
    shouldReduceMotion,
    t,
    toggleLike,
  ]);

  return (
    <div className={`fixed inset-0 z-50 isolate bg-black text-white ${montserrat.className}`}>
      <div className="pointer-events-none absolute inset-x-0 top-0 z-40 flex justify-center px-2 pt-[max(0.5rem,env(safe-area-inset-top,0px))] md:px-4 md:pt-3">
        <div className="pointer-events-auto flex w-full max-w-[430px] justify-start md:max-w-[460px]">
          <Link
            href="/"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-black/45 text-white backdrop-blur-sm transition-colors hover:bg-black/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            aria-label={t('home.reels_feed_back_aria')}
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={2} aria-hidden />
          </Link>
        </div>
      </div>
      <div
        ref={scrollContainerRef}
        className={REELS_FEED_SCROLL_CONTAINER_CLASS}
        role="feed"
        aria-label={t('home.reels_feed_region_aria')}
      >
        {feedContent}
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
