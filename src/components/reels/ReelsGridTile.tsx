'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRef } from 'react';

import { useWhenNearViewport } from '@/components/hooks/use-when-near-viewport';
import { shouldBypassNextImageOptimizer } from '@/lib/utils/should-bypass-next-image-optimizer';

import { REELS_PAGE_PRIORITY_TILE_COUNT } from './reels-page-grid.constants';

type ReelsGridTileProps = {
  index: number;
  href: string;
  posterUrl: string;
  title: string;
  watchCtaLabel: string;
};

/** Single reels grid cell — poster loads when near the viewport. */
export function ReelsGridTile({
  index,
  href,
  posterUrl,
  title,
  watchCtaLabel,
}: ReelsGridTileProps) {
  const tileRef = useRef<HTMLAnchorElement>(null);
  const isPriority = index < REELS_PAGE_PRIORITY_TILE_COUNT;
  const isNearViewport = useWhenNearViewport(tileRef, { rootMargin: '320px' });
  const shouldLoadPoster = isPriority || isNearViewport;

  return (
    <Link
      ref={tileRef}
      role="listitem"
      href={href}
      aria-label={`${title} — ${watchCtaLabel}`}
      className="group relative block aspect-[9/16] w-full overflow-hidden bg-zinc-900 outline-none transition-transform duration-200 hover:scale-[1.015] focus-visible:z-[1] focus-visible:ring-2 focus-visible:ring-marco-black/80 focus-visible:ring-offset-2 focus-visible:ring-offset-white [content-visibility:auto]"
    >
      {shouldLoadPoster ? (
        <Image
          src={posterUrl}
          alt=""
          fill
          className="object-cover object-center transition duration-500 ease-out group-hover:scale-[1.03]"
          sizes="(max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
          priority={isPriority}
          loading={isPriority ? 'eager' : 'lazy'}
          unoptimized={shouldBypassNextImageOptimizer(posterUrl)}
        />
      ) : (
        <div className="absolute inset-0 bg-zinc-800" aria-hidden />
      )}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent opacity-95 transition-opacity duration-300 group-hover:opacity-100"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-[2px] sm:right-2 sm:top-2 sm:h-7 sm:w-7"
        aria-hidden
      >
        <svg
          viewBox="0 0 24 24"
          className="h-3 w-3 translate-x-px sm:h-3.5 sm:w-3.5"
          fill="currentColor"
          aria-hidden
        >
          <path d="M8 5v14l11-7-11-7z" />
        </svg>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent px-1.5 pb-1.5 pt-8 sm:px-2 sm:pb-2 sm:pt-9">
        <p className="line-clamp-2 text-left text-[9px] font-semibold leading-snug tracking-tight text-white drop-shadow-[0_1px_6px_rgba(0,0,0,0.75)] sm:text-[10px]">
          {title}
        </p>
      </div>
    </Link>
  );
}
