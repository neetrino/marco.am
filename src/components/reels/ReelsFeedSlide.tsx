'use client';

import Image from 'next/image';
import Link from 'next/link';
import { X } from 'lucide-react';
import { memo } from 'react';

import { shouldBypassNextImageOptimizer } from '@/lib/utils/should-bypass-next-image-optimizer';

import { ReelOverlay } from './ReelOverlay';
import { ReelVideoPlayer } from './ReelVideoPlayer';
import { REELS_FEED_SLIDE_ID_PREFIX } from './reels-vertical-feed.constants';
import { REELS_FEED_VIDEO_WINDOW_RADIUS } from './reels-page-grid.constants';
import type { ReelInteractionState } from './useReelsFeedData';

type ReelsFeedSlideProps = {
  item: ReelInteractionState;
  index: number;
  activeIndex: number;
  totalCount: number;
  shouldReduceMotion: boolean;
  pendingLikeById: Record<string, boolean>;
  doubleTapBurstById: Record<string, number>;
  backAriaLabel: string;
  likeAriaLabel: string;
  onClose: () => void;
  onToggleLike: (reelId: string) => void;
  onDoubleTapLike: (reelId: string) => void;
};

/** One snap slide — video mounts only near the active index. */
export const ReelsFeedSlide = memo(function ReelsFeedSlide({
  item,
  index,
  activeIndex,
  totalCount,
  shouldReduceMotion,
  pendingLikeById,
  doubleTapBurstById,
  backAriaLabel,
  likeAriaLabel,
  onClose,
  onToggleLike,
  onDoubleTapLike,
}: ReelsFeedSlideProps) {
  const isActive = index === activeIndex;
  const isNearActive = Math.abs(index - activeIndex) <= REELS_FEED_VIDEO_WINDOW_RADIUS;

  return (
    <article
      id={`${REELS_FEED_SLIDE_ID_PREFIX}${index}`}
      aria-posinset={index + 1}
      aria-setsize={totalCount}
      className="relative flex h-full min-h-full shrink-0 snap-start snap-always items-center justify-center p-3"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className={`relative h-[95dvh] w-[min(95vw,30rem)] overflow-hidden rounded-[1.75rem] bg-black transition border ${
          isActive
            ? 'border-white/20 shadow-[0_26px_60px_rgba(0,0,0,0.5)]'
            : 'border-white/10 shadow-[0_12px_34px_rgba(0,0,0,0.35)]'
        }`}
      >
        {isNearActive ? (
          <ReelVideoPlayer
            reelId={item.id}
            title={item.title}
            videoUrl={item.videoUrl}
            poster={item.poster}
            isActive={isActive}
            shouldReduceMotion={shouldReduceMotion}
            onDoubleTapLike={onDoubleTapLike}
            likeControl={{
              ariaLabel: likeAriaLabel,
              liked: item.likedByCurrentUser,
              burstVersion: doubleTapBurstById[item.id] ?? 0,
              disabled: pendingLikeById[item.id] === true,
              onToggle: () => {
                onToggleLike(item.id);
              },
            }}
          />
        ) : (
          <div className="absolute inset-0 bg-black">
            {item.posterUrl ? (
              <Image
                src={item.posterUrl}
                alt=""
                fill
                className="object-contain object-center"
                sizes="(max-width: 768px) 95vw, 30rem"
                loading="lazy"
                unoptimized={shouldBypassNextImageOptimizer(item.posterUrl)}
              />
            ) : null}
          </div>
        )}
        <Link
          href="/reels"
          className="absolute right-2 top-2 z-30 inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/30 bg-black/45 text-white shadow-[0_8px_20px_rgba(0,0,0,0.24)] transition-all duration-200 hover:border-marco-yellow hover:bg-marco-yellow hover:text-marco-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          aria-label={backAriaLabel}
        >
          <X className="h-5 w-5" strokeWidth={2} aria-hidden />
        </Link>
        {isNearActive ? <ReelOverlay title={item.title} /> : null}
      </div>
    </article>
  );
});
