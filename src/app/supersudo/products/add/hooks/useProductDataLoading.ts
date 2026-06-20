import { useEffect, useRef } from 'react';
import { apiClient } from '@/lib/api-client';
import { CURRENCIES, type CurrencyCode } from '@/lib/currency';
import { getStoredLanguage } from '@/lib/language';
import type { Brand, Category, Attribute } from '../types';
import { logger } from '@/lib/utils/logger';
import { findAttributeBySemanticKey } from '@/lib/attribute-keys';

interface UseProductDataLoadingProps {
  loadCatalogReference: boolean;
  loadPricingReference: boolean;
  setBrands: (brands: Brand[]) => void;
  setCategories: (categories: Category[]) => void;
  setAttributes: (attributes: Attribute[]) => void;
  setDefaultCurrency: (currency: CurrencyCode) => void;
  attributesDropdownOpen: boolean;
  setAttributesDropdownOpen: (open: boolean) => void;
  attributesDropdownRef: React.RefObject<HTMLDivElement | null>;
}

export function useProductDataLoading({
  loadCatalogReference,
  loadPricingReference,
  setBrands,
  setCategories,
  setAttributes,
  setDefaultCurrency,
  attributesDropdownOpen,
  setAttributesDropdownOpen,
  attributesDropdownRef,
}: UseProductDataLoadingProps) {
  const catalogLoadedRef = useRef(false);
  const pricingLoadedRef = useRef(false);
  const attributesLoadedRef = useRef(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (attributesDropdownRef.current && !attributesDropdownRef.current.contains(event.target as Node)) {
        setAttributesDropdownOpen(false);
      }
    };

    if (attributesDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [attributesDropdownOpen, attributesDropdownRef, setAttributesDropdownOpen]);

  useEffect(() => {
    if (!loadPricingReference || pricingLoadedRef.current) {
      return;
    }

    pricingLoadedRef.current = true;

    const loadDefaultCurrency = async () => {
      try {
        const settingsRes = await apiClient.get<{ defaultCurrency?: string }>('/api/v1/supersudo/settings');
        const currency = (settingsRes.defaultCurrency || 'AMD') as CurrencyCode;
        if (currency in CURRENCIES) {
          setDefaultCurrency(currency);
          logger.devLog('✅ [ADMIN] Default currency loaded:', currency);
        }
      } catch (err) {
        console.error('❌ [ADMIN] Error loading default currency:', err);
        setDefaultCurrency('AMD');
      }
    };

    void loadDefaultCurrency();
  }, [loadPricingReference, setDefaultCurrency]);

  useEffect(() => {
    if (!loadCatalogReference || catalogLoadedRef.current) {
      return;
    }

    catalogLoadedRef.current = true;

    const fetchCatalogData = async () => {
      try {
        logger.devLog('📥 [ADMIN] Fetching brands and categories...');
        const activeLocale = getStoredLanguage();
        const [brandsRes, categoriesRes] = await Promise.all([
          apiClient.get<{ data: Brand[] }>('/api/v1/supersudo/brands'),
          apiClient.get<{ data: Category[] }>('/api/v1/supersudo/categories', {
            params: { lang: activeLocale },
          }),
        ]);
        setBrands(brandsRes.data || []);
        setCategories(categoriesRes.data || []);
      } catch (err: unknown) {
        console.error('❌ [ADMIN] Error fetching catalog data:', err);
      }
    };

    void fetchCatalogData();
  }, [loadCatalogReference, setBrands, setCategories]);

  useEffect(() => {
    if (!loadPricingReference || attributesLoadedRef.current) {
      return;
    }

    attributesLoadedRef.current = true;

    const fetchAttributes = async () => {
      try {
        logger.devLog('📥 [ADMIN] Fetching attributes...');
        const attributesRes = await apiClient.get<{ data: Attribute[] }>('/api/v1/supersudo/attributes');
        setAttributes(attributesRes.data || []);
        if (attributesRes.data && attributesRes.data.length > 0) {
          const colorAttr = findAttributeBySemanticKey(attributesRes.data, 'color');
          const sizeAttr = findAttributeBySemanticKey(attributesRes.data, 'size');
          if (!colorAttr) {
            console.warn('⚠️ [ADMIN] Color attribute not found in loaded attributes!');
          }
          if (!sizeAttr) {
            console.warn('⚠️ [ADMIN] Size attribute not found in loaded attributes!');
          }
        }
      } catch (err: unknown) {
        console.error('❌ [ADMIN] Error fetching attributes:', err);
      }
    };

    void fetchAttributes();
  }, [loadPricingReference, setAttributes]);
}
