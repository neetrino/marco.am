'use client';

import { useEffect, useRef, useState } from 'react';
import { Heart, Play } from 'lucide-react';

type TapIntent = 'single' | 'double';

export type ReelVideoPlayerProps = {
  reelId: string;
  title: string;
  videoUrl: string;
  poster: string | null;
  isActive: boolean;
  shouldReduceMotion: boolean;
  onDoubleTapLike: (reelId: string) => void;
};

function resolveTapIntent(deltaMs: number): TapIntent {
  return deltaMs < 260 ? 'double' : 'single';
}

export function ReelVideoPlayer({
  reelId,
  title,
  videoUrl,
  poster,
  isActive,
  shouldReduceMotion,
  onDoubleTapLike,
}: ReelVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastTapAtRef = useRef(0);
  const singleTapTimeoutRef = useRef<number | null>(null);
  const [isPausedByUser, setIsPausedByUser] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const [isWaiting, setIsWaiting] = useState(true);
  const [showCenterHeart, setShowCenterHeart] = useState(false);

  useEffect(() => {
    return () => {
      if (singleTapTimeoutRef.current !== null) {
        window.clearTimeout(singleTapTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }
    if (!isActive || isPausedByUser || videoFailed) {
      video.pause();
      setIsPlaying(false);
      return;
    }

    const maybePromise = video.play();
    if (maybePromise === undefined) {
      setIsPlaying(!video.paused);
      return;
    }
    maybePromise
      .then(() => {
        setIsPlaying(true);
      })
      .catch(() => {
        setIsPlaying(false);
      });
  }, [isActive, isPausedByUser, videoFailed, videoUrl]);

  useEffect(() => {
    setIsPausedByUser(false);
    setVideoFailed(false);
    setIsWaiting(true);
  }, [videoUrl]);

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video || !isActive || videoFailed) {
      return;
    }
    if (video.paused) {
      setIsPausedByUser(false);
      void video.play().then(() => {
        setIsPlaying(true);
      });
      return;
    }
    video.pause();
    setIsPausedByUser(true);
    setIsPlaying(false);
  };

  const runDoubleTapLike = () => {
    onDoubleTapLike(reelId);
    setShowCenterHeart(true);
    window.setTimeout(() => {
      setShowCenterHeart(false);
    }, shouldReduceMotion ? 0 : 380);
  };

  const handlePointerUp = () => {
    if (!isActive) {
      return;
    }
    const now = Date.now();
    const intent = resolveTapIntent(now - lastTapAtRef.current);
    lastTapAtRef.current = now;

    if (intent === 'double') {
      if (singleTapTimeoutRef.current !== null) {
        window.clearTimeout(singleTapTimeoutRef.current);
        singleTapTimeoutRef.current = null;
      }
      runDoubleTapLike();
      return;
    }

    singleTapTimeoutRef.current = window.setTimeout(() => {
      togglePlayPause();
      singleTapTimeoutRef.current = null;
    }, 260);
  };

  return (
    <div
      className="absolute inset-0 touch-manipulation"
      onPointerUp={handlePointerUp}
      role="button"
      tabIndex={0}
      aria-label={title}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          togglePlayPause();
        }
      }}
    >
      {videoFailed ? (
        poster ? (
          <img
            src={poster}
            alt={title}
            className="absolute inset-0 h-full w-full object-cover object-center"
            loading={isActive ? 'eager' : 'lazy'}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center px-8 text-center text-sm text-white/80">
            Video is not available.
          </div>
        )
      ) : (
        <video
          ref={videoRef}
          src={videoUrl}
          poster={poster ?? undefined}
          className="absolute inset-0 h-full w-full object-cover object-center"
          loop
          muted
          playsInline
          preload={isActive ? 'auto' : 'metadata'}
          onCanPlay={() => {
            setIsWaiting(false);
          }}
          onWaiting={() => {
            if (isActive) {
              setIsWaiting(true);
            }
          }}
          onPlaying={() => {
            setIsPlaying(true);
            setIsWaiting(false);
          }}
          onPause={() => {
            setIsPlaying(false);
          }}
          onError={() => {
            setVideoFailed(true);
            setIsPlaying(false);
            setIsWaiting(false);
          }}
        />
      )}
      {showCenterHeart ? (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
          <Heart
            className="h-20 w-20 fill-marco-yellow/90 text-marco-yellow drop-shadow-[0_10px_28px_rgba(0,0,0,0.45)] animate-pulse motion-reduce:animate-none"
            aria-hidden
          />
        </div>
      ) : null}
      {!videoFailed && isWaiting && isActive ? (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-black/15">
          <span className="h-9 w-9 animate-spin rounded-full border-2 border-white/35 border-t-white motion-reduce:animate-none" />
        </div>
      ) : null}
      {!videoFailed && isActive && !isPlaying ? (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
          <span className="rounded-full border border-white/40 bg-black/35 p-4 backdrop-blur-sm">
            <Play className="h-7 w-7 fill-white text-white" aria-hidden />
          </span>
        </div>
      ) : null}
    </div>
  );
}
