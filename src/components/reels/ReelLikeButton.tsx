'use client';

import { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';

export type ReelLikeButtonProps = {
  ariaLabel: string;
  liked: boolean;
  burstVersion: number;
  disabled: boolean;
  onToggle: () => void;
};

export function ReelLikeButton({
  ariaLabel,
  liked,
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
    <div className="absolute bottom-[max(11.25rem,calc(env(safe-area-inset-bottom,0px)+10.75rem))] right-3 z-30 md:bottom-[14.5rem] md:right-4">
      <div className="relative">
        {isBursting ? (
          <Heart
            className="pointer-events-none absolute -inset-3 h-16 w-16 fill-marco-yellow/45 text-marco-yellow/75 animate-ping motion-reduce:animate-none"
            aria-hidden
          />
        ) : null}
        <button
          type="button"
          className={`group relative flex h-11 w-11 items-center justify-center rounded-2xl border shadow-[0_8px_20px_rgba(0,0,0,0.24)] transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-70 motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
            liked
              ? 'border-marco-yellow/70 bg-marco-yellow/20 text-marco-yellow hover:border-marco-yellow hover:bg-marco-yellow hover:text-marco-black'
              : 'border-white/30 bg-black/45 text-white hover:border-marco-yellow hover:bg-marco-yellow hover:text-marco-black'
          }`}
          aria-pressed={liked}
          aria-label={ariaLabel}
          disabled={disabled}
          onClick={onToggle}
        >
          <Heart
            className={`h-5 w-5 transition-transform duration-200 motion-reduce:transition-none ${
              liked
                ? 'fill-marco-yellow text-marco-yellow group-hover:fill-marco-black group-hover:text-marco-black'
                : ''
            }`}
            strokeWidth={2}
            aria-hidden
          />
        </button>
      </div>
    </div>
  );
}
