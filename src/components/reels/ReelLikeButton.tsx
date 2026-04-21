'use client';

import { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';

export type ReelLikeButtonProps = {
  ariaLabel: string;
  liked: boolean;
  likesCount: number;
  burstVersion: number;
  disabled: boolean;
  onToggle: () => void;
};

export function ReelLikeButton({
  ariaLabel,
  liked,
  likesCount,
  burstVersion,
  disabled,
  onToggle,
}: ReelLikeButtonProps) {
  const [isBursting, setIsBursting] = useState(false);

  useEffect(() => {
    if (burstVersion <= 0) {
      return;
    }
    setIsBursting(true);
    const timeoutId = window.setTimeout(() => {
      setIsBursting(false);
    }, 380);
    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [burstVersion]);

  return (
    <div className="absolute bottom-[max(5rem,calc(env(safe-area-inset-bottom,0px)+4.5rem))] right-3 z-30 flex flex-col items-center gap-2 md:bottom-8 md:right-4">
      <div className="relative">
        {isBursting ? (
          <Heart
            className="pointer-events-none absolute -inset-3 h-16 w-16 fill-marco-yellow/45 text-marco-yellow/75 animate-ping motion-reduce:animate-none"
            aria-hidden
          />
        ) : null}
        <button
          type="button"
          className="relative flex h-12 w-12 items-center justify-center rounded-full border border-white/30 bg-black/45 text-white shadow-[0_8px_28px_rgba(0,0,0,0.3)] backdrop-blur-sm transition duration-200 hover:bg-black/60 disabled:cursor-not-allowed disabled:opacity-70 motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          aria-pressed={liked}
          aria-label={ariaLabel}
          disabled={disabled}
          onClick={onToggle}
        >
          <Heart
            className={`h-6 w-6 transition-transform duration-200 motion-reduce:transition-none ${
              liked ? 'scale-110 fill-marco-yellow text-marco-yellow' : ''
            }`}
            strokeWidth={2}
            aria-hidden
          />
        </button>
      </div>
      <span className="text-xs font-semibold text-white/95 drop-shadow-[0_1px_6px_rgba(0,0,0,0.45)]">
        {likesCount}
      </span>
    </div>
  );
}
