'use client';

import { useMemo } from 'react';

import { ReelsPageGrid } from '@/components/reels/ReelsPageGrid';
import { StaticPageLoadingSkeleton } from '@/components/navigation/StaticPageLoadingSkeleton';
import { getStoredLanguage } from '@/lib/language';
import { readReelsPageCache } from '@/lib/reels-page-client-cache';

/**
 * Suspense fallback for `/reels` — paints a warmed session cache instantly
 * during client navigations instead of a blank grid area.
 */
export function ReelsPageCacheFallback() {
  const language = getStoredLanguage();
  const cached = useMemo(() => readReelsPageCache(language), [language]);

  if (!cached || cached.items.length === 0) {
    return <StaticPageLoadingSkeleton variant="reels" />;
  }

  return (
    <ReelsPageGrid
      items={cached.items}
      watchCtaLabel={cached.watchCtaLabel}
      language={language}
    />
  );
}
