'use client';

import { REEL_VIDEO_FRAME_FRAGMENT } from '@/lib/constants/reels-management';
import { toDomSafeImgSrcString, toSafeImgAttributeSrc } from '@/lib/utils/image-utils';

const THUMBNAIL_CLASS =
  'h-28 w-20 rounded-xl border border-gray-200 bg-slate-100 object-cover shadow-inner';

type ReelListThumbnailProps = {
  posterUrl: string | null;
  videoUrl: string;
};

/** Shows the uploaded poster, or the reel's own opening frame when none exists. */
export function ReelListThumbnail({ posterUrl, videoUrl }: ReelListThumbnailProps) {
  const safePosterUrl = toSafeImgAttributeSrc(posterUrl ?? '');
  if (safePosterUrl) {
    return <img src={toDomSafeImgSrcString(safePosterUrl)} alt="" className={THUMBNAIL_CLASS} />;
  }

  return (
    <video
      src={`${videoUrl}${REEL_VIDEO_FRAME_FRAGMENT}`}
      className={THUMBNAIL_CLASS}
      muted
      playsInline
      preload="metadata"
      tabIndex={-1}
    />
  );
}
