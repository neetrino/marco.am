'use client';

import { useEffect, useState } from 'react';

const MAX_MD_MEDIA_QUERY = '(max-width: 767px)';

/**
 * Client-only: `true` when viewport matches Tailwind `max-md`.
 */
export function useIsMaxMd(): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(MAX_MD_MEDIA_QUERY);
    const sync = () => {
      setMatches(media.matches);
    };
    sync();
    media.addEventListener('change', sync);
    return () => {
      media.removeEventListener('change', sync);
    };
  }, []);

  return matches;
}
