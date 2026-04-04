'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../../lib/i18n-client';
import { useAuth } from '../../lib/auth/AuthContext';
import { apiClient } from '../../lib/api-client';

interface Reel {
  id: string;
  videoUrl: string;
  thumbnailUrl?: string | null;
  caption?: string | null;
  likesCount: number;
  userLiked?: boolean;
}

export default function ReelsPage() {
  const { t } = useTranslation();
  const { isLoggedIn } = useAuth();
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const [liking, setLiking] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});

  useEffect(() => {
    fetch('/api/v1/reels')
      .then((res) => res.json())
      .then((json: { data?: Reel[] }) => {
        setReels(json.data ?? []);
      })
      .catch(() => setReels([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const el = videoRefs.current[reels[currentIndex]?.id];
    if (!el) return;
    el.play().catch(() => {});
    return () => {
      el.pause();
    };
  }, [currentIndex, reels]);

  const handleWheel = (e: React.WheelEvent) => {
    if (reels.length <= 1) return;
    if (e.deltaY > 0 && currentIndex < reels.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else if (e.deltaY < 0 && currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    }
  };

  const handleLike = async (reelId: string) => {
    if (!isLoggedIn) return;
    if (liking.has(reelId)) return;
    setLiking((prev) => new Set(prev).add(reelId));
    try {
      const res = await apiClient.post<{ likesCount: number; userLiked: boolean }>(
        `/api/v1/reels/${reelId}/like`
      );
      setReels((prev) =>
        prev.map((r) =>
          r.id === reelId
            ? { ...r, likesCount: res.likesCount ?? r.likesCount, userLiked: res.userLiked ?? !r.userLiked }
            : r
        )
      );
    } finally {
      setLiking((prev) => {
        const next = new Set(prev);
        next.delete(reelId);
        return next;
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <p className="text-white">{t('common.messages.loading') || 'Loading...'}</p>
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <p className="text-white">{t('common.reels.empty')}</p>
      </div>
    );
  }

  const reel = reels[currentIndex];

  return (
    <div
      ref={containerRef}
      className="h-screen w-full max-w-md mx-auto bg-black overflow-hidden flex flex-col"
      onWheel={handleWheel}
      style={{ touchAction: 'pan-y' }}
    >
      <div className="flex-1 relative flex items-center justify-center min-h-0">
        {reels.map((r, index) => (
          <div
            key={r.id}
            className="absolute inset-0 flex items-center justify-center"
            style={{
              visibility: index === currentIndex ? 'visible' : 'hidden',
              zIndex: index === currentIndex ? 1 : 0,
            }}
          >
            <video
              ref={(el) => {
                videoRefs.current[r.id] = el;
              }}
              src={r.videoUrl}
              poster={r.thumbnailUrl ?? undefined}
              muted={muted}
              loop
              playsInline
              className="max-h-full max-w-full object-contain w-full h-full"
              onClick={(e) => {
                const v = e.currentTarget;
                if (v.paused) v.play();
                else v.pause();
              }}
            />
          </div>
        ))}
      </div>

      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-10">
        <button
          type="button"
          onClick={() => setMuted((m) => !m)}
          className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70"
          aria-label={muted ? 'Unmute' : 'Mute'}
        >
          {muted ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
          )}
        </button>
        <button
          type="button"
          onClick={() => reel && handleLike(reel.id)}
          disabled={!isLoggedIn || liking.has(reel.id)}
          className="flex flex-col items-center gap-0.5 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 disabled:opacity-50"
        >
          <svg
            className="w-8 h-8"
            fill={reel?.userLiked ? 'currentColor' : 'none'}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <span className="text-xs">{reel?.likesCount ?? 0}</span>
        </button>
      </div>

      {reel?.caption && (
        <div className="absolute bottom-4 left-4 right-14 z-10 text-white text-sm bg-black/40 p-2 rounded">
          {reel.caption}
        </div>
      )}

      {reels.length > 1 && (
        <div className="flex justify-center gap-1 py-2">
          {reels.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCurrentIndex(i)}
              className={`h-1 rounded-full transition-all ${
                i === currentIndex ? 'w-6 bg-white' : 'w-1 bg-white/50'
              }`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
