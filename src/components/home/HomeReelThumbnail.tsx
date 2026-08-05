'use client';

import Image from 'next/image';

import { REEL_VIDEO_FRAME_FRAGMENT } from '@/lib/constants/reels-management';
import { shouldBypassNextImageOptimizer } from '@/lib/utils/should-bypass-next-image-optimizer';
import type { PublicReelItem } from '../../lib/schemas/reels-management.schema';

const THUMBNAIL_CLASS =
  'object-cover object-center transition duration-300 group-hover:scale-105';

type HomeReelThumbnailProps = {
  item: PublicReelItem;
  label: string;
  sizes: string;
};

/**
 * Reels without an uploaded poster fall back to their own video frame,
 * so the circle never shows an unrelated placeholder image.
 */
export function HomeReelThumbnail({ item, label, sizes }: HomeReelThumbnailProps) {
  if (item.poster === null) {
    return (
      <video
        src={`${item.videoUrl}${REEL_VIDEO_FRAME_FRAGMENT}`}
        className={`absolute inset-0 h-full w-full ${THUMBNAIL_CLASS}`}
        muted
        playsInline
        preload="metadata"
        tabIndex={-1}
        aria-label={label}
      />
    );
  }

  return (
    <Image
      src={item.posterUrl}
      alt={label}
      fill
      className={THUMBNAIL_CLASS}
      sizes={sizes}
      loading="lazy"
      unoptimized={shouldBypassNextImageOptimizer(item.posterUrl)}
    />
  );
}
