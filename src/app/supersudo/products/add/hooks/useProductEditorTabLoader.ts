'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { useTranslation } from '@/lib/i18n-client';
import type { ProductEditorSection } from '@/lib/admin/product-editor-section';
import type { CurrencyCode } from '@/lib/currency';
import {
  PRODUCT_EDITOR_DEFAULT_TAB,
  type ProductEditorTabId,
} from '../product-editor-tabs';
import type { ProductData, Attribute } from '../types';
import type { AddProductFormState } from '../utils/productFormDataBuilder';
import { applyProductEditorSection } from '../utils/product-editor-section-apply';
import { logger } from '@/lib/utils/logger';

interface UseProductEditorTabLoaderParams {
  open: boolean;
  productId: string | null;
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

export function useProductEditorTabLoader({
  open,
  productId,
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

  const markTabLoaded = useCallback((tabId: ProductEditorTabId) => {
    setLoadedTabs((prev) => new Set(prev).add(tabId));
    setVisitedTabs((prev) => new Set(prev).add(tabId));
  }, []);

  const loadSection = useCallback(
    async (section: ProductEditorSection) => {
      if (!productId || !isLoggedIn || !isAdmin) {
        markTabLoaded(section);
        return;
      }

      if (inFlightRef.current.has(section)) {
        return;
      }

      inFlightRef.current.add(section);
      setLoadingTab(section);

      try {
        logger.devLog('📥 [ADMIN] Loading product section:', { productId, section });
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
        onLoadError();
      } finally {
        inFlightRef.current.delete(section);
        setLoadingTab((current) => (current === section ? null : current));
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

    if (!loadedTabs.has(PRODUCT_EDITOR_DEFAULT_TAB)) {
      void loadSection(PRODUCT_EDITOR_DEFAULT_TAB);
    }
  }, [open, productId, loadedTabs, loadSection, markTabLoaded]);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (!productId) {
      markTabLoaded(activeTab);
      return;
    }

    if (loadedTabs.has(activeTab)) {
      setVisitedTabs((prev) => new Set(prev).add(activeTab));
      return;
    }

    void loadSection(activeTab);
  }, [activeTab, open, productId, loadedTabs, loadSection, markTabLoaded]);

  return {
    loadedTabs,
    visitedTabs,
    loadingTab,
  };
}
