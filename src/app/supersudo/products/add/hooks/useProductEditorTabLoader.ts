'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from '@/lib/i18n-client';
import type { ProductEditorSection } from '../product-editor-tabs';
import type { CurrencyCode } from '@/lib/currency';
import type { Product } from '../../types';
import {
  PRODUCT_EDITOR_DEFAULT_TAB,
  type ProductEditorTabId,
} from '../product-editor-tabs';
import type { Attribute } from '../types';
import type { AddProductFormState } from '../utils/productFormDataBuilder';
import {
  applyGeneralSectionFromListProduct,
  applyProductEditorSection,
} from '../utils/product-editor-section-apply';
import {
  fetchProductEditorSection,
  readProductEditorSectionCache,
  warmProductEditorReferenceData,
} from '@/lib/admin/product-editor-section-cache';
import { logger } from '@/lib/utils/logger';

const BACKGROUND_SECTIONS: ProductEditorSection[] = ['description', 'catalog', 'media'];

function deferAfterPaint(callback: () => void): void {
  if (typeof window === 'undefined') {
    callback();
    return;
  }
  requestAnimationFrame(() => {
    requestAnimationFrame(callback);
  });
}

function scheduleIdleWork(callback: () => void): void {
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    window.requestIdleCallback(callback, { timeout: 2500 });
  } else {
    window.setTimeout(callback, 400);
  }
}

interface UseProductEditorTabLoaderParams {
  open: boolean;
  productId: string | null;
  listProduct: Product | null;
  isLoggedIn: boolean;
  isAdmin: boolean;
  activeTab: ProductEditorTabId;
  defaultCurrency: CurrencyCode;
  attributes: Attribute[];
  setFormData: (updater: (prev: AddProductFormState) => AddProductFormState) => void;
  setHasVariantsToLoad: (has: boolean) => void;
  setProductType: (type: 'simple' | 'variable') => void;
  setSimpleProductData: (data: {
    price: string;
    compareAtPrice: string;
    sku: string;
    quantity: string;
  }) => void;
  onLoadError: () => void;
}

interface LoadSectionOptions {
  silent?: boolean;
  force?: boolean;
}

export function useProductEditorTabLoader({
  open,
  productId,
  listProduct,
  isLoggedIn,
  isAdmin,
  activeTab,
  defaultCurrency,
  attributes,
  setFormData,
  setHasVariantsToLoad,
  setProductType,
  setSimpleProductData,
  onLoadError,
}: UseProductEditorTabLoaderParams) {
  const { t } = useTranslation();
  const [loadedTabs, setLoadedTabs] = useState<Set<ProductEditorTabId>>(new Set());
  const [visitedTabs, setVisitedTabs] = useState<Set<ProductEditorTabId>>(
    () => new Set([PRODUCT_EDITOR_DEFAULT_TAB]),
  );
  const [loadingTab, setLoadingTab] = useState<ProductEditorTabId | null>(null);
  const inFlightRef = useRef<Set<ProductEditorTabId>>(new Set());
  const generalSeededRef = useRef(false);
  const prefetchStartedRef = useRef<string | null>(null);
  const listProductRef = useRef(listProduct);
  listProductRef.current = listProduct;

  const markTabLoaded = useCallback((tabId: ProductEditorTabId) => {
    setLoadedTabs((prev) => {
      if (prev.has(tabId)) {
        return prev;
      }
      return new Set(prev).add(tabId);
    });
    setVisitedTabs((prev) => {
      if (prev.has(tabId)) {
        return prev;
      }
      return new Set(prev).add(tabId);
    });
  }, []);

  const visitTab = useCallback((tabId: ProductEditorTabId) => {
    setVisitedTabs((prev) => {
      if (prev.has(tabId)) {
        return prev;
      }
      return new Set(prev).add(tabId);
    });
  }, []);

  const applyHandlers = useCallback(
    () => ({
      setFormData,
      setHasVariantsToLoad,
      setProductType,
      setSimpleProductData,
      defaultCurrency,
      defaultColorLabel: t('admin.products.add.defaultColor'),
      attributes,
    }),
    [
      setFormData,
      setHasVariantsToLoad,
      setProductType,
      setSimpleProductData,
      defaultCurrency,
      attributes,
      t,
    ],
  );

  useEffect(() => {
    if (!open) {
      generalSeededRef.current = false;
      prefetchStartedRef.current = null;
      inFlightRef.current.clear();
      setLoadedTabs(new Set());
      setVisitedTabs(new Set([PRODUCT_EDITOR_DEFAULT_TAB]));
      setLoadingTab(null);
    }
  }, [open]);

  useLayoutEffect(() => {
    if (!open || !productId || !listProduct || generalSeededRef.current) {
      return;
    }

    generalSeededRef.current = true;
    applyGeneralSectionFromListProduct(listProduct, setFormData);
    markTabLoaded(PRODUCT_EDITOR_DEFAULT_TAB);
  }, [open, productId, listProduct, setFormData, markTabLoaded]);

  useLayoutEffect(() => {
    if (!open || !productId) {
      return;
    }

    const cachedGeneral = readProductEditorSectionCache(productId, PRODUCT_EDITOR_DEFAULT_TAB);
    if (cachedGeneral === null) {
      return;
    }

    applyProductEditorSection(PRODUCT_EDITOR_DEFAULT_TAB, cachedGeneral, applyHandlers());
    markTabLoaded(PRODUCT_EDITOR_DEFAULT_TAB);
  }, [open, productId, applyHandlers, markTabLoaded]);

  const loadSection = useCallback(
    async (section: ProductEditorSection, options?: LoadSectionOptions) => {
      if (!productId || !isLoggedIn || !isAdmin) {
        markTabLoaded(section);
        return;
      }

      if (inFlightRef.current.has(section)) {
        return;
      }

      const cached = !options?.force ? readProductEditorSectionCache(productId, section) : null;
      const hasListSeed =
        section === PRODUCT_EDITOR_DEFAULT_TAB && listProductRef.current !== null;
      const showSpinner = !options?.silent && cached === null && !hasListSeed;

      if (cached !== null) {
        applyProductEditorSection(section, cached, applyHandlers());
        markTabLoaded(section);
      }

      inFlightRef.current.add(section);
      if (showSpinner) {
        setLoadingTab(section);
      }

      try {
        logger.devLog('📥 [ADMIN] Loading product section:', {
          productId,
          section,
          silent: options?.silent,
          fromCache: cached !== null,
        });

        const product = await fetchProductEditorSection(productId, section, {
          force: options?.force,
        });

        applyProductEditorSection(section, product, applyHandlers());
        markTabLoaded(section);
        logger.devLog('✅ [ADMIN] Product section loaded:', section);
      } catch (err: unknown) {
        console.error('❌ [ADMIN] Error loading product section:', err);
        if (!options?.silent) {
          onLoadError();
        }
      } finally {
        inFlightRef.current.delete(section);
        if (showSpinner) {
          setLoadingTab((current) => (current === section ? null : current));
        }
      }
    },
    [productId, isLoggedIn, isAdmin, applyHandlers, markTabLoaded, onLoadError],
  );

  const loadBackgroundSections = useCallback(() => {
    let index = 0;

    const loadNext = (): void => {
      if (index >= BACKGROUND_SECTIONS.length) {
        window.setTimeout(() => {
          void loadSection('pricing', { silent: true });
        }, 150);
        return;
      }

      const section = BACKGROUND_SECTIONS[index];
      index += 1;
      void loadSection(section, { silent: true }).finally(() => {
        scheduleIdleWork(loadNext);
      });
    };

    scheduleIdleWork(loadNext);
  }, [loadSection]);

  useEffect(() => {
    if (!open || !productId || !isLoggedIn || !isAdmin) {
      return;
    }

    if (prefetchStartedRef.current === productId) {
      return;
    }
    prefetchStartedRef.current = productId;

    deferAfterPaint(() => {
      warmProductEditorReferenceData();
      void loadSection(PRODUCT_EDITOR_DEFAULT_TAB, { silent: true }).finally(() => {
        loadBackgroundSections();
      });
    });
  }, [open, productId, isLoggedIn, isAdmin, loadSection, loadBackgroundSections]);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (!productId) {
      markTabLoaded(PRODUCT_EDITOR_DEFAULT_TAB);
      return;
    }

    if (loadedTabs.has(activeTab)) {
      return;
    }

    const cached = readProductEditorSectionCache(productId, activeTab);
    if (cached !== null) {
      applyProductEditorSection(activeTab, cached, applyHandlers());
      markTabLoaded(activeTab);
      return;
    }

    void loadSection(activeTab);
  }, [activeTab, open, productId, loadedTabs, loadSection, markTabLoaded, applyHandlers]);

  return {
    visitedTabs,
    loadingTab,
    visitTab,
  };
}
