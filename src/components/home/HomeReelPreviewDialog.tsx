'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import { Montserrat } from 'next/font/google';

import { apiClient } from '../../lib/api-client';
import { useTranslation } from '../../lib/i18n-client';
import { ReelLikeButton } from '../reels/ReelLikeButton';
import { ReelOverlay } from '../reels/ReelOverlay';
import { ReelVideoPlayer } from '../reels/ReelVideoPlayer';
import {
  HOME_REEL_PREVIEW_SLIDE_ID_PREFIX,
  REELS_FEED_SCROLL_CONTAINER_CLASS,
} from '../reels/reels-vertical-feed.constants';
import type { ReelInteractionState } from '../reels/useReelsFeedData';
import { useActiveReelIndex } from '../reels/useActiveReelIndex';

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['600', '700'],
  display: 'swap',
});

export type HomeReelPreviewToggleLike = (args: {
  reelId: string;
  forceLiked?: boolean;
  registerBurst?: boolean;
}) => void;

export type HomeReelPreviewDialogProps = {
  items: ReelInteractionState[];
  initialIndex: number;
  pendingLikeById: Record<string, boolean>;
  doubleTapBurstById: Record<string, number>;
  toggleLike: HomeReelPreviewToggleLike;
  onClose: () => void;
};

/** Same vertical snap-scrolling model as `/reels/watch` (`ReelsVerticalFeed`). */
export function HomeReelPreviewDialog({
  items,
  initialIndex,
  pendingLikeById,
  doubleTapBurstById,
  toggleLike,
  onClose,
}: HomeReelPreviewDialogProps) {
  const { t } = useTranslation();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const viewedReelIdsRef = useRef<Set<string>>(new Set());
  const activeIndex = useActiveReelIndex({
    containerRef: scrollContainerRef,
    initialIndex,
    itemCount: items.length,
    slideIdPrefix: HOME_REEL_PREVIEW_SLIDE_ID_PREFIX,
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

  useEffect(() => {
    const onEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onEsc);
    return () => {
      window.removeEventListener('keydown', onEsc);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  useEffect(() => {
    const activeItem = items[activeIndex];
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
  }, [activeIndex, items]);

  const scrollToReelByIndex = (index: number) => {
    const next = Math.max(0, Math.min(items.length - 1, index));
    const target = document.getElementById(
      `${HOME_REEL_PREVIEW_SLIDE_ID_PREFIX}${next}`,
    );
    target?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  };

  const feedContent = useMemo(() => {
    return items.map((item, index) => {
      const isActive = index === activeIndex;
      const poster = item.poster ?? item.posterUrl;
      return (
        <article
          id={`${HOME_REEL_PREVIEW_SLIDE_ID_PREFIX}${index}`}
          key={item.id}
          aria-posinset={index + 1}
          aria-setsize={items.length}
          className="relative flex h-full min-h-full shrink-0 snap-start snap-always items-center justify-center p-3"
        >
          <div
            className={`relative h-[95dvh] w-[min(95vw,30rem)] overflow-hidden rounded-[1.75rem] bg-black transition border ${
              isActive
                ? 'border-white/20 shadow-[0_26px_60px_rgba(0,0,0,0.5)]'
                : 'border-white/10 shadow-[0_12px_34px_rgba(0,0,0,0.35)]'
            }`}
          >
            <ReelVideoPlayer
              reelId={item.id}
              title={item.title}
              videoUrl={item.videoUrl}
              poster={poster}
              isActive={isActive}
              shouldReduceMotion={shouldReduceMotion}
              onDoubleTapLike={(reelId) => {
                toggleLike({ reelId, forceLiked: true, registerBurst: true });
              }}
            />
            <button
              type="button"
              onClick={onClose}
              aria-label={t('common.ariaLabels.closeMenu')}
              className="absolute right-2 top-2 z-30 inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/30 bg-black/45 text-white shadow-[0_8px_20px_rgba(0,0,0,0.24)] transition-all duration-200 hover:border-marco-yellow hover:bg-marco-yellow hover:text-marco-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <X className="h-5 w-5" strokeWidth={2} aria-hidden />
            </button>
            <ReelOverlay title={item.title} />
            <ReelLikeButton
              ariaLabel={t('home.reels_feed_like_aria')}
              liked={item.likedByCurrentUser}
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
    items,
    onClose,
    toggleLike,
    pendingLikeById,
    shouldReduceMotion,
    t,
  ]);

  if (items.length === 0) {
    return null;
  }

  return (
    <div
      className={`fixed inset-0 z-[220] isolate bg-black/70 text-white backdrop-blur-xl ${montserrat.className}`}
      role="dialog"
      aria-modal
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(255,255,255,0.12)_0%,rgba(255,255,255,0.02)_36%,rgba(0,0,0,0.66)_75%)]"
        aria-hidden
      />
      {items.length > 1 ? (
        <div
          className="pointer-events-auto absolute top-1/2 z-40 flex -translate-y-1/2 flex-col gap-1.5"
          style={{
            left: 'min(calc(50% + min(95vw, 30rem) / 2 + 0.375rem), calc(100% - 3.25rem))',
          }}
        >
          <button
            type="button"
            onClick={() => scrollToReelByIndex(activeIndex - 1)}
            disabled={activeIndex <= 0}
            aria-label={t('home.reels_page.preview_previous_aria')}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/30 bg-black/45 text-white shadow-[0_8px_20px_rgba(0,0,0,0.24)] transition-all duration-200 hover:border-marco-yellow hover:bg-marco-yellow hover:text-marco-black disabled:cursor-not-allowed disabled:opacity-45"
          >
            <ChevronUp className="h-5 w-5" strokeWidth={2} aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => scrollToReelByIndex(activeIndex + 1)}
            disabled={activeIndex >= items.length - 1}
            aria-label={t('home.reels_page.preview_next_aria')}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/30 bg-black/45 text-white shadow-[0_8px_20px_rgba(0,0,0,0.24)] transition-all duration-200 hover:border-marco-yellow hover:bg-marco-yellow hover:text-marco-black disabled:cursor-not-allowed disabled:opacity-45"
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
        {feedContent}
      </div>
      <p className="sr-only">{t('home.reels_feed_hint_screen_reader')}</p>
    </div>
  );
}
