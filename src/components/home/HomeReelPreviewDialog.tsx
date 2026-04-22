'use client';

import { useEffect, useRef, useState } from 'react';
import { Heart, Pause, Play, Volume2, VolumeX, X } from 'lucide-react';

import { useTranslation } from '../../lib/i18n-client';
import type { PublicReelItem } from '../../lib/schemas/reels-management.schema';

export type HomeReelPreviewDialogProps = {
  item: PublicReelItem | null;
  isOpen: boolean;
  liked: boolean;
  likePending: boolean;
  onToggleLike: () => void;
  onClose: () => void;
};

export function HomeReelPreviewDialog({
  item,
  isOpen,
  liked,
  likePending,
  onToggleLike,
  onClose,
}: HomeReelPreviewDialogProps) {
  const { t } = useTranslation();
  const [isMuted, setIsMuted] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
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
  }, [isOpen, onClose]);

  useEffect(() => {
    setVideoFailed(false);
  }, [item?.id]);

  useEffect(() => {
    setIsMuted(true);
    setIsPaused(false);
  }, [item?.id]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const video = videoRef.current;
    if (!video) {
      return;
    }
    video.muted = isMuted;
    const playNow = () => {
      void video.play().catch(() => {
        // Browser autoplay policies can still block in edge cases.
      });
    };
    requestAnimationFrame(playNow);
    video.addEventListener('loadeddata', playNow);
    video.addEventListener('canplay', playNow);
    return () => {
      video.removeEventListener('loadeddata', playNow);
      video.removeEventListener('canplay', playNow);
    };
  }, [isOpen, item?.id]);

  if (!isOpen || !item) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[220] flex items-center justify-center bg-black/70 p-3 backdrop-blur-xl"
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
      <div className="relative h-[95dvh] w-[min(95vw,30rem)] overflow-hidden rounded-[1.75rem] border border-white/20 bg-black shadow-[0_26px_60px_rgba(0,0,0,0.5)]">
        {!videoFailed ? (
          <video
            ref={videoRef}
            src={item.videoUrl}
            className="absolute inset-0 h-full w-full bg-black object-contain object-center"
            autoPlay
            loop
            muted={isMuted}
            playsInline
            preload="auto"
            onPause={() => setIsPaused(true)}
            onPlay={() => setIsPaused(false)}
            onError={() => setVideoFailed(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm font-medium text-white/75">
            Video is not available.
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
        <button
          type="button"
          onClick={onClose}
          aria-label={t('common.ariaLabels.closeMenu')}
          className="absolute right-2 top-2 z-30 inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/30 bg-black/45 text-white shadow-[0_8px_20px_rgba(0,0,0,0.24)] transition-all duration-200 hover:border-marco-yellow hover:bg-marco-yellow hover:text-marco-black"
        >
          <X className="h-5 w-5" strokeWidth={2} aria-hidden />
        </button>
        <div className="absolute bottom-[max(9.75rem,calc(env(safe-area-inset-bottom,0px)+9rem))] right-3 z-30 md:bottom-[8.75rem] md:right-4">
          <button
            type="button"
            disabled={likePending}
            onClick={onToggleLike}
            className={`group relative flex h-11 w-11 items-center justify-center rounded-2xl border shadow-[0_8px_20px_rgba(0,0,0,0.24)] transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-70 ${
              liked
                ? 'border-marco-yellow/70 bg-marco-yellow/20 text-marco-yellow hover:border-marco-yellow hover:bg-marco-yellow hover:text-marco-black'
                : 'border-white/30 bg-black/45 text-white hover:border-marco-yellow hover:bg-marco-yellow hover:text-marco-black'
            }`}
            aria-label={t('home.reels_feed_like_aria')}
          >
            <Heart
              className={`h-5 w-5 transition-transform duration-200 ${
                liked
                  ? 'fill-marco-yellow text-marco-yellow group-hover:fill-marco-black group-hover:text-marco-black'
                  : ''
              }`}
              aria-hidden
            />
          </button>
        </div>
        <div className="absolute bottom-[max(5rem,calc(env(safe-area-inset-bottom,0px)+4.45rem))] right-3 z-30 flex flex-col items-center gap-2 md:bottom-8 md:right-4">
          <button
            type="button"
            onClick={() => {
              const video = videoRef.current;
              if (!video) {
                return;
              }
              if (video.paused) {
                void video.play();
                return;
              }
              video.pause();
            }}
            className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl border shadow-[0_8px_20px_rgba(0,0,0,0.24)] transition-all duration-200 ${
              isPaused
                ? 'border-marco-yellow/70 bg-marco-yellow/20 text-marco-yellow hover:border-marco-yellow hover:bg-marco-yellow hover:text-marco-black'
                : 'border-white/30 bg-black/45 text-white hover:border-marco-yellow hover:bg-marco-yellow hover:text-marco-black'
            }`}
            aria-label={isPaused ? 'Play video' : 'Pause video'}
          >
            {isPaused ? (
              <Play className="h-5 w-5 transition-transform duration-200" aria-hidden />
            ) : (
              <Pause className="h-5 w-5 transition-transform duration-200" aria-hidden />
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              const video = videoRef.current;
              if (!video) {
                return;
              }
              const nextMuted = !video.muted;
              video.muted = nextMuted;
              setIsMuted(nextMuted);
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
      </div>
    </div>
  );
}
