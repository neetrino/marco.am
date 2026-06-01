'use client';

import { useEffect, useMemo, useState } from 'react';

import { useTranslation } from '@/lib/i18n-client';
import { getReelsItemHref } from '@/lib/reels/reels-url';
import type { PublicReelItem } from '@/lib/schemas/reels-management.schema';

import { ReelsGridTile } from './ReelsGridTile';
import {
  REELS_PAGE_INITIAL_RENDER_BATCH_SIZE,
  REELS_PAGE_PROGRESSIVE_RENDER_THRESHOLD,
  REELS_PAGE_RENDER_BATCH_DELAY_MS,
  REELS_PAGE_RENDER_BATCH_SIZE,
} from './reels-page-grid.constants';

export type ReelsPageGridProps = {
  items: PublicReelItem[];
};

/** Reels index grid with progressive paint so navigation feels instant. */
export function ReelsPageGrid({ items }: ReelsPageGridProps) {
  const { t } = useTranslation();
  const watchCtaLabel = t('home.reels_page.watch_cta');
  const itemsFingerprint = useMemo(() => items.map((item) => item.id).join(','), [items]);
  const shouldUseProgressiveRender = items.length > REELS_PAGE_PROGRESSIVE_RENDER_THRESHOLD;
  const [visibleCount, setVisibleCount] = useState(() =>
    shouldUseProgressiveRender
      ? Math.min(REELS_PAGE_INITIAL_RENDER_BATCH_SIZE, items.length)
      : items.length,
  );

  useEffect(() => {
    if (!shouldUseProgressiveRender) {
      setVisibleCount(items.length);
      return;
    }
    setVisibleCount(Math.min(REELS_PAGE_INITIAL_RENDER_BATCH_SIZE, items.length));
  }, [itemsFingerprint, items.length, shouldUseProgressiveRender]);

  useEffect(() => {
    if (!shouldUseProgressiveRender || visibleCount >= items.length) {
      return;
    }
    const timerId = window.setTimeout(() => {
      setVisibleCount((prev) => Math.min(prev + REELS_PAGE_RENDER_BATCH_SIZE, items.length));
    }, REELS_PAGE_RENDER_BATCH_DELAY_MS);
    return () => {
      window.clearTimeout(timerId);
    };
  }, [items.length, shouldUseProgressiveRender, visibleCount]);

  return (
    <div className="mx-auto w-full max-w-screen-2xl px-1 pt-1 sm:px-2 sm:pt-2">
      <div
        className="grid grid-cols-3 gap-px sm:gap-1 md:grid-cols-4 lg:grid-cols-5"
        role="list"
      >
        {items.slice(0, visibleCount).map((item, index) => (
          <ReelsGridTile
            key={item.id}
            index={index}
            href={getReelsItemHref(index)}
            posterUrl={item.posterUrl}
            title={item.title}
            watchCtaLabel={watchCtaLabel}
          />
        ))}
      </div>
    </div>
  );
}
