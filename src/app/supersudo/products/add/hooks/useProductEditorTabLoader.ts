'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { useTranslation } from '@/lib/i18n-client';
import type { ProductEditorSection } from '../product-editor-tabs';
import type { CurrencyCode } from '@/lib/currency';
import type { Product } from '../../types';
import {
  PRODUCT_EDITOR_DEFAULT_TAB,
  type ProductEditorTabId,
} from '../product-editor-tabs';
import type { ProductData, Attribute } from '../types';
import type { AddProductFormState } from '../utils/productFormDataBuilder';
import {
  applyGeneralSectionFromListProduct,
  applyProductEditorSection,
} from '../utils/product-editor-section-apply';
import { logger } from '@/lib/utils/logger';

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
  setUseNewBrand: (use: boolean) => void;
  setUseNewCategory: (use: boolean) => void;
  setNewBrandName: (name: string) => void;
  setNewCategoryName: (name: string) => void;
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
  setUseNewBrand,
  setUseNewCategory,
  setNewBrandName,
  setNewCategoryName,
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
  const generalBackgroundStartedRef = useRef(false);

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

  useEffect(() => {
    if (!open) {
      generalSeededRef.current = false;
      generalBackgroundStartedRef.current = false;
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

  const loadSection = useCallback(
    async (section: ProductEditorSection, options?: LoadSectionOptions) => {
      if (!productId || !isLoggedIn || !isAdmin) {
        markTabLoaded(section);
        return;
      }

      if (inFlightRef.current.has(section)) {
        return;
      }

      inFlightRef.current.add(section);
      if (!options?.silent) {
        setLoadingTab(section);
      }

      try {
        logger.devLog('📥 [ADMIN] Loading product section:', { productId, section, silent: options?.silent });
        const product = await apiClient.get<ProductData>(
          `/api/v1/supersudo/products/${productId}`,
          { params: { section } },
        );

        applyProductEditorSection(section, product, {
          setFormData,
          setUseNewBrand,
          setUseNewCategory,
          setNewBrandName,
          setNewCategoryName,
          setHasVariantsToLoad,
          setProductType,
          setSimpleProductData,
          defaultCurrency,
          defaultColorLabel: t('admin.products.add.defaultColor'),
          attributes,
        });

        markTabLoaded(section);
        logger.devLog('✅ [ADMIN] Product section loaded:', section);
      } catch (err: unknown) {
        console.error('❌ [ADMIN] Error loading product section:', err);
        if (!options?.silent) {
          onLoadError();
        }
      } finally {
        inFlightRef.current.delete(section);
        if (!options?.silent) {
          setLoadingTab((current) => (current === section ? null : current));
        }
      }
    },
    [
      productId,
      isLoggedIn,
      isAdmin,
      setFormData,
      setUseNewBrand,
      setUseNewCategory,
      setNewBrandName,
      setNewCategoryName,
      setHasVariantsToLoad,
      setProductType,
      setSimpleProductData,
      defaultCurrency,
      attributes,
      markTabLoaded,
      onLoadError,
      t,
    ],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    if (!productId) {
      markTabLoaded(PRODUCT_EDITOR_DEFAULT_TAB);
      return;
    }

    if (listProduct) {
      if (!generalBackgroundStartedRef.current) {
        generalBackgroundStartedRef.current = true;
        void loadSection(PRODUCT_EDITOR_DEFAULT_TAB, { silent: true });
      }
      return;
    }

    if (!loadedTabs.has(PRODUCT_EDITOR_DEFAULT_TAB)) {
      void loadSection(PRODUCT_EDITOR_DEFAULT_TAB);
    }
  }, [open, productId, listProduct, loadSection, markTabLoaded]);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (!productId) {
      markTabLoaded(activeTab);
      return;
    }

    if (loadedTabs.has(activeTab)) {
      setVisitedTabs((prev) => (prev.has(activeTab) ? prev : new Set(prev).add(activeTab)));
      return;
    }

    void loadSection(activeTab);
  }, [activeTab, open, productId, loadedTabs, loadSection, markTabLoaded]);

  return {
    visitedTabs,
    loadingTab,
  };
}
