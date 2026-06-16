import type { RefObject } from 'react';
import { useEffect, useRef } from 'react';
import type { ShopGridProduct } from '@/app/products/shop-grid-product';
import type { LanguageCode } from '@/lib/language';
import { getQueryClient } from '@/lib/query/get-query-client';
import { syncShopListingProductsToPdpCache } from '@/lib/shop-products-plp-pdp-sync';

const PLP_VIEWPORT_OBSERVER_ROOT_MARGIN = '120px 0px';

/**
 * Seeds PDP navigation cache only for cards that enter (or neared) the viewport.
 * Uses a MutationObserver so progressive grid paint can attach new slug nodes.
 */
export function usePlpViewportPdpSync(
  containerRef: RefObject<HTMLElement | null>,
  products: readonly ShopGridProduct[],
  language: LanguageCode,
  enabled: boolean,
): void {
  const productsBySlugRef = useRef<Map<string, ShopGridProduct>>(new Map());
  const syncedSlugsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const bySlug = new Map<string, ShopGridProduct>();
    for (const product of products) {
      if (product.slug) {
        bySlug.set(product.slug, product);
      }
    }
    productsBySlugRef.current = bySlug;
    syncedSlugsRef.current.clear();
  }, [products]);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') {
      return;
    }
    const root = containerRef.current;
    if (!root) {
      return;
    }

    const flushVisible = (slugs: Iterable<string>) => {
      const rows: ShopGridProduct[] = [];
      for (const slug of slugs) {
        if (syncedSlugsRef.current.has(slug)) {
          continue;
        }
        const row = productsBySlugRef.current.get(slug);
        if (!row) {
          continue;
        }
        syncedSlugsRef.current.add(slug);
        rows.push(row);
      }
      if (rows.length === 0) {
        return;
      }
      syncShopListingProductsToPdpCache(getQueryClient(), rows, language);
    };

    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        const visibleSlugs: string[] = [];
        for (const entry of entries) {
          if (!entry.isIntersecting) {
            continue;
          }
          const slug = entry.target.getAttribute('data-plp-slug');
          if (slug) {
            visibleSlugs.push(slug);
          }
        }
        if (visibleSlugs.length > 0) {
          flushVisible(visibleSlugs);
        }
      },
      { root: null, rootMargin: PLP_VIEWPORT_OBSERVER_ROOT_MARGIN, threshold: 0.01 },
    );

    const observedNodes = new WeakSet<Element>();

    const observeSlugNodes = () => {
      root.querySelectorAll('[data-plp-slug]').forEach((node) => {
        if (observedNodes.has(node)) {
          return;
        }
        observedNodes.add(node);
        intersectionObserver.observe(node);
      });
    };

    observeSlugNodes();

    const mutationObserver = new MutationObserver(() => {
      observeSlugNodes();
    });
    mutationObserver.observe(root, { childList: true, subtree: true });

    return () => {
      intersectionObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [containerRef, enabled, language, products]);
}
