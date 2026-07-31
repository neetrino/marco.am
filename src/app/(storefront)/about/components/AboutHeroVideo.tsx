'use client';

import Image from 'next/image';
import { Play } from 'lucide-react';
import { useState } from 'react';

type AboutHeroVideoProps = {
  readonly videoId: string;
  readonly title: string;
};

const YOUTUBE_EMBED_ORIGIN = 'https://www.youtube.com';
const YOUTUBE_THUMBNAIL_HOST = 'https://img.youtube.com';

function buildYouTubeEmbedUrl(videoId: string, autoplay: boolean): string {
  const params = new URLSearchParams({ rel: '0' });
  if (autoplay) {
    params.set('autoplay', '1');
  }
  return `${YOUTUBE_EMBED_ORIGIN}/embed/${videoId}?${params.toString()}`;
}

function buildYouTubeThumbnailUrl(videoId: string, quality: 'max' | 'mq'): string {
  const fileName = quality === 'max' ? 'maxresdefault.jpg' : 'mqdefault.jpg';
  return `${YOUTUBE_THUMBNAIL_HOST}/vi/${videoId}/${fileName}`;
}

/**
 * Branded YouTube hero embed for the About page — yellow play button, iframe loads on click.
 */
export function AboutHeroVideo({ videoId, title }: AboutHeroVideoProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [thumbnailUrl, setThumbnailUrl] = useState(() =>
    buildYouTubeThumbnailUrl(videoId, 'max'),
  );

  return (
    <div className="relative w-full">
      <div className="relative overflow-hidden rounded-2xl border border-marco-border/90 bg-white shadow-[0_20px_50px_rgba(16,16,16,0.1)] ring-1 ring-black/5">
        <div className="relative aspect-video w-full min-h-[14rem] sm:min-h-[16rem] lg:min-h-[18rem]">
          {isPlaying ? (
            <iframe
              title={title}
              src={buildYouTubeEmbedUrl(videoId, true)}
              className="h-full w-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          ) : (
            <>
              <Image
                src={thumbnailUrl}
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 960px"
                priority
                loading="eager"
                fetchPriority="high"
                unoptimized
                onError={() => {
                  setThumbnailUrl(buildYouTubeThumbnailUrl(videoId, 'mq'));
                }}
              />

              <button
                type="button"
                onClick={() => setIsPlaying(true)}
                className="absolute inset-0 flex items-center justify-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-marco-yellow"
                aria-label={`Play video: ${title}`}
              >
                <span className="inline-flex h-[3.25rem] w-[4.75rem] items-center justify-center rounded-2xl bg-marco-yellow shadow-[0_10px_28px_rgba(255,202,3,0.5)] transition-transform duration-300 hover:scale-105 hover:brightness-105">
                  <Play
                    className="ml-1 h-7 w-7 fill-marco-black text-marco-black"
                    aria-hidden
                  />
                </span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
