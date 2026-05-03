'use client';

import { useEffect, useMemo, useState } from 'react';

import { resolveBrandStaticLogo } from '@/lib/brand-static-logo-assets';

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
 * Brand row for product cards: DB `logoUrl`, else bundled asset from `slug`, else name text.
 */
export function ProductCardBrandMark({
  name,
  slug,
  logoUrl,
  textClassName,
  logoBoxClassName,
}: ProductCardBrandMarkProps) {
  const candidates = useMemo(() => {
    const out: string[] = [];
    const remote = logoUrl?.trim();
    if (remote) {
      out.push(remote);
    }
    const staticLogo = resolveBrandStaticLogo(slug);
    if (staticLogo?.src && !out.includes(staticLogo.src)) {
      out.push(staticLogo.src);
    }
    return out;
  }, [logoUrl, slug]);

  const [candidateIndex, setCandidateIndex] = useState(0);

  useEffect(() => {
    setCandidateIndex(0);
  }, [slug, logoUrl]);

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
