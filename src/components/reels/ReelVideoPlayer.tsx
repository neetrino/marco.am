'use client';

import { useEffect, useRef, useState } from 'react';
import { Heart, Pause, Play, Volume2, VolumeX } from 'lucide-react';

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
  void poster;
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastTapAtRef = useRef(0);
  const singleTapTimeoutRef = useRef<number | null>(null);
  const [isPausedByUser, setIsPausedByUser] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [videoFailed, setVideoFailed] = useState(false);
  const [_isWaiting, setIsWaiting] = useState(true);
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
    setIsMuted(true);
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

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video || videoFailed) {
      return;
    }
    const nextMuted = !video.muted;
    video.muted = nextMuted;
    setIsMuted(nextMuted);
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
        <div className="absolute inset-0 flex items-center justify-center px-8 text-center text-sm text-white/80">
          Video is not available.
        </div>
      ) : (
        <video
          ref={videoRef}
          src={videoUrl}
          className="absolute inset-0 h-full w-full bg-black object-contain object-center"
          loop
          muted={isMuted}
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
      {!videoFailed ? (
        <div className="absolute bottom-[max(5rem,calc(env(safe-area-inset-bottom,0px)+4.45rem))] right-3 z-30 flex flex-col items-center gap-2 md:bottom-8 md:right-4">
          <button
            type="button"
            onPointerUp={(event) => {
              event.stopPropagation();
            }}
            onClick={(event) => {
              event.stopPropagation();
              togglePlayPause();
            }}
            className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl border shadow-[0_8px_20px_rgba(0,0,0,0.24)] transition-all duration-200 ${
              isPlaying
                ? 'border-white/30 bg-black/45 text-white hover:border-marco-yellow hover:bg-marco-yellow hover:text-marco-black'
                : 'border-marco-yellow/70 bg-marco-yellow/20 text-marco-yellow hover:border-marco-yellow hover:bg-marco-yellow hover:text-marco-black'
            }`}
            aria-label={isPlaying ? 'Pause video' : 'Play video'}
          >
            {isPlaying ? (
              <Pause className="h-5 w-5 transition-transform duration-200" aria-hidden />
            ) : (
              <Play className="h-5 w-5 transition-transform duration-200" aria-hidden />
            )}
          </button>
          <button
            type="button"
            onPointerUp={(event) => {
              event.stopPropagation();
            }}
            onClick={(event) => {
              event.stopPropagation();
              toggleMute();
            }}
            className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl border shadow-[0_8px_20px_rgba(0,0,0,0.24)] transition-all duration-200 ${
              isMuted
                ? 'border-marco-yellow/70 bg-marco-yellow/20 text-marco-yellow hover:border-marco-yellow hover:bg-marco-yellow hover:text-marco-black'
                : 'border-white/30 bg-black/45 text-white hover:border-marco-yellow hover:bg-marco-yellow hover:text-marco-black'
            }`}
            aria-label={isMuted ? 'Unmute video' : 'Mute video'}
          >
            {isMuted ? (
              <VolumeX className="h-5 w-5 transition-transform duration-200" aria-hidden />
            ) : (
              <Volume2 className="h-5 w-5 transition-transform duration-200" aria-hidden />
            )}
          </button>
        </div>
      ) : null}
      {showCenterHeart ? (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
          <Heart
            className="h-20 w-20 fill-marco-yellow/90 text-marco-yellow drop-shadow-[0_10px_28px_rgba(0,0,0,0.45)] animate-pulse motion-reduce:animate-none"
            aria-hidden
          />
        </div>
      ) : null}
    </div>
  );
}
