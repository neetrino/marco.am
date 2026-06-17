'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import { BrandPlpLink } from '@/components/BrandPlpLink';
import {
  BRANDS_DIRECTORY_CARD_MIN_HEIGHT_PX,
  BRANDS_DIRECTORY_LCP_IMAGE_PRIORITY_COUNT,
} from '@/constants/brands-directory-layout';
import {
  BRANDS_DIRECTORY_CARD_OVERSIZED_MIN_HEIGHT_PX,
  isBrandLogoCellOversizedSlug,
} from '@/lib/brand-logo-cell-oversize';
import type { HomeBrandPartnerPublicItem } from '@/lib/types/home-brand-partners-public';

import { BrandDirectoryLogo } from './BrandDirectoryLogo';

const INITIAL_RENDER_COUNT = 20;
const RENDER_BATCH_SIZE = 20;

function clampVisibleCount(next: number, total: number): number {
  return Math.max(0, Math.min(next, total));
}

export function BrandsDirectoryGridClient({
  brands,
}: {
  readonly brands: readonly HomeBrandPartnerPublicItem[];
}) {
  const total = brands.length;
  const [visibleCount, setVisibleCount] = useState(() =>
    clampVisibleCount(INITIAL_RENDER_COUNT, total),
  );
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // If `brands` changes (locale switch), reset the window.
  const fingerprint = useMemo(() => brands.map((b) => b.id).join(','), [brands]);
  useEffect(() => {
    setVisibleCount(clampVisibleCount(INITIAL_RENDER_COUNT, total));
  }, [fingerprint, total]);

  useEffect(() => {
    if (visibleCount >= total) {
      return;
    }
    const sentinel = sentinelRef.current;
    if (!sentinel) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) {
          return;
        }
        setVisibleCount((prev) => clampVisibleCount(prev + RENDER_BATCH_SIZE, total));
      },
      {
        // Start loading before the user hits the bottom.
        rootMargin: '800px 0px',
        threshold: 0,
      },
    );

    observer.observe(sentinel);
    return () => {
      observer.disconnect();
    };
  }, [total, visibleCount]);

  return (
    <>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {brands.slice(0, visibleCount).map((partner, index) => (
          <BrandPlpLink
            key={partner.id}
            href={partner.href}
            style={{
              minHeight: `${
                isBrandLogoCellOversizedSlug(partner.slug, partner.name)
                  ? BRANDS_DIRECTORY_CARD_OVERSIZED_MIN_HEIGHT_PX
                  : BRANDS_DIRECTORY_CARD_MIN_HEIGHT_PX
              }px`,
            }}
            className="group flex items-center justify-center rounded-2xl border border-marco-border bg-[#ffffff] px-4 py-5 sm:px-5 sm:py-6 transition-colors hover:border-marco-black/30 hover:bg-[#f8f8f8] dark:bg-[#ffffff] dark:hover:bg-[#f8f8f8]"
            aria-label={partner.name}
          >
            <BrandDirectoryLogo
              partner={partner}
              imagePriority={index < BRANDS_DIRECTORY_LCP_IMAGE_PRIORITY_COUNT}
            />
          </BrandPlpLink>
        ))}
      </div>
      {visibleCount < total ? (
        <div
          ref={sentinelRef}
          aria-hidden="true"
          className="h-px w-full"
        />
      ) : null}
    </>
  );
}

