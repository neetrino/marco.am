'use client';

import { useEffect, useMemo, useState } from 'react';

import { buildBrandLogoCandidateSrcs } from '@/lib/brand-static-logo-assets';

export type ProductCardBrandMarkProps = {
  name: string;
  slug: string;
  logoUrl: string | null | undefined;
  /** Shown when no usable image exists or every candidate fails to load. */
  textClassName: string;
  /** Fixed box for the logo (e.g. `h-5 w-[88px]`). */
  logoBoxClassName: string;
};

/**
 * Brand row for product cards: bundled asset when slug is unknown but name matches (e.g. CSV
 * `import-*` + `LG`), else `logoUrl` then bundled from slug/name; otherwise brand name text.
 */
export function ProductCardBrandMark({
  name,
  slug,
  logoUrl,
  textClassName,
  logoBoxClassName,
}: ProductCardBrandMarkProps) {
  const candidates = useMemo(
    () => buildBrandLogoCandidateSrcs(logoUrl, slug, name),
    [logoUrl, slug, name],
  );

  const [candidateIndex, setCandidateIndex] = useState(0);

  useEffect(() => {
    setCandidateIndex(0);
  }, [slug, logoUrl, name]);

  if (candidates.length === 0 || candidateIndex >= candidates.length) {
    return (
      <p className={`truncate ${textClassName}`}>
        {name.trim() ? name : '—'}
      </p>
    );
  }

  const src = candidates[candidateIndex];

  return (
    <div
      className={`relative flex shrink-0 items-center justify-start overflow-hidden ${logoBoxClassName}`}
    >
      <img
        src={src}
        alt={name.trim() || 'Brand'}
        className="max-h-full max-w-full object-contain object-left"
        loading="lazy"
        decoding="async"
        onError={() => {
          setCandidateIndex((i) => i + 1);
        }}
      />
    </div>
  );
}
