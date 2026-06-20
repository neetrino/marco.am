'use client';

import Image from 'next/image';
import { processImageUrl, toDomSafeImgSrcString } from '@/lib/utils/image-utils';

const THUMB_SIZE_PX = 40;

interface AdminProductListImageProps {
  src: string;
  alt: string;
}

export function AdminProductListImage({ src, alt }: AdminProductListImageProps) {
  const processed = processImageUrl(src);
  if (!processed || processed.startsWith('data:')) {
    return null;
  }

  const safeSrc = toDomSafeImgSrcString(processed);

  return (
    <Image
      src={safeSrc}
      alt={alt}
      width={THUMB_SIZE_PX}
      height={THUMB_SIZE_PX}
      className="h-10 w-10 shrink-0 rounded-lg border border-slate-200 object-cover shadow-sm"
      sizes={`${THUMB_SIZE_PX}px`}
      loading="lazy"
      decoding="async"
    />
  );
}

export function AdminProductListImagePlaceholder() {
  return (
    <div
      className="h-10 w-10 shrink-0 rounded-lg border border-slate-200 bg-slate-100 shadow-sm"
      aria-hidden
    />
  );
}
