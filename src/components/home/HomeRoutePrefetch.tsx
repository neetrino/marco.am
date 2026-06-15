'use client';

/**
 * Keep home first load free from route prefetches that trigger heavy PLP/Reels data work.
 */
export function HomeRoutePrefetch() {
  return null;
}
