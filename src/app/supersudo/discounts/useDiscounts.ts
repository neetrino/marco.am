'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { apiClient, getApiOrErrorMessage } from '@/lib/api-client';
import { logger } from '@/lib/utils/logger';
import type { LanguageCode } from '@/lib/language';
import { ADMIN_CACHE_KEYS, buildProductDiscountsCacheKey } from '@/lib/admin/admin-cache-keys';
import {
  fetchAdminDiscountsBootstrap,
  mapDiscountsBootstrap,
} from '@/lib/admin/admin-bootstrap-client';
import {
  readAdminBrandsCache,
  readAdminCategoriesCache,
} from '@/lib/admin/admin-reference-data-cache';
import {
  ADMIN_SESSION_CACHE_TTL_MS,
  readAdminSessionCache,
  writeAdminSessionCache,
} from '@/lib/admin/admin-session-cache';
import { parseDiscountMap, serializeDiscountMap, type DiscountMap } from '@/lib/discount/discount-expiry';
import type { DiscountControlValue } from '@/components/admin/DiscountControl';

import {
  dedupeDiscountProductRows,
  type DiscountsBrand,
  type DiscountsCategory,
  type DiscountsProductRow,
} from './types';

function rowToDiscountValue(row: DiscountsProductRow): DiscountControlValue {
  const type = row.discountType ?? 'NONE';
  return {
    type,
    value: type === 'NONE' ? null : row.discountValue ?? null,
    expiresAt: row.discountExpiresAt ?? null,
  };
}

type SettingsPayload = {
  globalDiscount?: number;
  globalDiscountExpiresAt?: string | null;
  categoryDiscounts?: DiscountMap;
  brandDiscounts?: DiscountMap;
};

type ProductDiscountsPayload = { data: DiscountsProductRow[] };

type UseDiscountsParams = {
  activeLocale: LanguageCode;
  t: (key: string) => string;
};

export function useDiscounts({ activeLocale, t }: UseDiscountsParams) {
  const tRef = useRef(t);
  tRef.current = t;

  const cachedSettings = readAdminSessionCache<SettingsPayload>(
    ADMIN_CACHE_KEYS.settings,
    ADMIN_SESSION_CACHE_TTL_MS,
  );
  const productDiscountsCacheKey = buildProductDiscountsCacheKey(activeLocale);
  const cachedProducts = readAdminSessionCache<ProductDiscountsPayload>(
    productDiscountsCacheKey,
    ADMIN_SESSION_CACHE_TTL_MS,
  );
  const cachedCategories = readAdminCategoriesCache<DiscountsCategory>(activeLocale, {
    includeCounts: false,
  });
  const cachedBrands = readAdminBrandsCache<DiscountsBrand>();

  const [globalDiscount, setGlobalDiscount] = useState<number>(cachedSettings?.globalDiscount ?? 0);
  const [globalDiscountExpiresAt, setGlobalDiscountExpiresAt] = useState<string | null>(
    cachedSettings?.globalDiscountExpiresAt ?? null,
  );
  const [categoryDiscounts, setCategoryDiscounts] = useState<DiscountMap>(
    cachedSettings?.categoryDiscounts ?? {},
  );
  const [brandDiscounts, setBrandDiscounts] = useState<DiscountMap>(
    cachedSettings?.brandDiscounts ?? {},
  );
  const [discountLoading, setDiscountLoading] = useState(cachedSettings === null);
  const [discountSaving, setDiscountSaving] = useState(false);

  const [products, setProducts] = useState<DiscountsProductRow[]>(
    dedupeDiscountProductRows(cachedProducts?.data ?? []),
  );
  const [productsLoading, setProductsLoading] = useState(cachedProducts === null);
  const [productDiscounts, setProductDiscounts] = useState<Record<string, DiscountControlValue>>(() => {
    const rows = dedupeDiscountProductRows(cachedProducts?.data ?? []);
    return Object.fromEntries(rows.map((row) => [row.id, rowToDiscountValue(row)]));
  });
  const [savingProductId, setSavingProductId] = useState<string | null>(null);

  const [categories, setCategories] = useState<DiscountsCategory[]>(cachedCategories ?? []);
  const [categoriesLoading, setCategoriesLoading] = useState(cachedCategories === null);
  const [categorySaving, setCategorySaving] = useState(false);

  const [brands, setBrands] = useState<DiscountsBrand[]>(cachedBrands ?? []);
  const [brandsLoading, setBrandsLoading] = useState(cachedBrands === null);
  const [brandSaving, setBrandSaving] = useState(false);

  const applySettings = useCallback((settings: SettingsPayload) => {
    setGlobalDiscount(settings.globalDiscount ?? 0);
    setGlobalDiscountExpiresAt(settings.globalDiscountExpiresAt ?? null);
    setCategoryDiscounts(settings.categoryDiscounts ?? {});
    setBrandDiscounts(settings.brandDiscounts ?? {});
  }, []);

  const applyProductRows = useCallback((rows: DiscountsProductRow[]) => {
    const uniqueRows = dedupeDiscountProductRows(rows);
    setProducts(uniqueRows);
    setProductDiscounts(
      Object.fromEntries(uniqueRows.map((row) => [row.id, rowToDiscountValue(row)])),
    );
  }, []);

  const loadInitialPayload = useCallback(async () => {
    const settingsCached = readAdminSessionCache<SettingsPayload>(
      ADMIN_CACHE_KEYS.settings,
      ADMIN_SESSION_CACHE_TTL_MS,
    );
    const productsCached = readAdminSessionCache<ProductDiscountsPayload>(
      productDiscountsCacheKey,
      ADMIN_SESSION_CACHE_TTL_MS,
    );
    const categoriesCached = readAdminCategoriesCache<DiscountsCategory>(activeLocale, {
      includeCounts: false,
    });
    const brandsCached = readAdminBrandsCache<DiscountsBrand>();

    if (settingsCached) {
      applySettings(settingsCached);
      setDiscountLoading(false);
    }
    if (productsCached) {
      applyProductRows(productsCached.data ?? []);
      setProductsLoading(false);
    }
    if (categoriesCached) {
      setCategories(categoriesCached);
      setCategoriesLoading(false);
    }
    if (brandsCached) {
      setBrands(brandsCached);
      setBrandsLoading(false);
    }

    if (settingsCached && productsCached && categoriesCached && brandsCached) {
      return;
    }

    try {
      const bootstrap = await fetchAdminDiscountsBootstrap(activeLocale);
      const mapped = mapDiscountsBootstrap(bootstrap);
      applySettings({
        globalDiscount: mapped.settings.globalDiscount,
        globalDiscountExpiresAt: mapped.settings.globalDiscountExpiresAt ?? null,
        categoryDiscounts: parseDiscountMap(mapped.settings.categoryDiscounts),
        brandDiscounts: parseDiscountMap(mapped.settings.brandDiscounts),
      });
      applyProductRows(mapped.products);
      setCategories(mapped.categories);
      setBrands(mapped.brands);
    } catch (err: unknown) {
      logger.error('Failed to load discounts bootstrap', err);
    } finally {
      setDiscountLoading(false);
      setProductsLoading(false);
      setCategoriesLoading(false);
      setBrandsLoading(false);
    }
  }, [
    activeLocale,
    applyProductRows,
    applySettings,
    productDiscountsCacheKey,
  ]);

  useEffect(() => {
    void loadInitialPayload();
  }, [loadInitialPayload]);

  const clampDiscountValue = (value: number) => {
    if (Number.isNaN(value)) {
      return 0;
    }
    return Math.min(100, Math.max(0, Math.round(value * 100) / 100));
  };

  const persistSettings = async () => {
    const discountValue = parseFloat(globalDiscount.toString());
    if (Number.isNaN(discountValue) || discountValue < 0 || discountValue > 100) {
      alert(tRef.current('admin.discounts.discountMustBeValid'));
      return false;
    }

    const payload = {
      globalDiscount: discountValue,
      globalDiscountExpiresAt,
      categoryDiscounts: serializeDiscountMap(categoryDiscounts),
      brandDiscounts: serializeDiscountMap(brandDiscounts),
    };

    await apiClient.put('/api/v1/supersudo/settings', payload);

    const nextSettings: SettingsPayload = payload;
    applySettings(nextSettings);
    const existing =
      readAdminSessionCache<SettingsPayload>(ADMIN_CACHE_KEYS.settings, ADMIN_SESSION_CACHE_TTL_MS) ??
      {};
    writeAdminSessionCache(ADMIN_CACHE_KEYS.settings, { ...existing, ...nextSettings });
    return true;
  };

  const handleDiscountSave = async () => {
    setDiscountSaving(true);
    try {
      const saved = await persistSettings();
      if (saved) {
        alert(tRef.current('admin.discounts.savedSuccess'));
      }
    } catch (err: unknown) {
      const errorMessage = getApiOrErrorMessage(err, 'Failed to save');
      alert(tRef.current('admin.discounts.errorSaving').replace('{message}', errorMessage));
    } finally {
      setDiscountSaving(false);
    }
  };

  const handleCategoryDiscountSave = async () => {
    setCategorySaving(true);
    try {
      const saved = await persistSettings();
      if (saved) {
        alert(tRef.current('admin.discounts.savedSuccess'));
      }
    } catch (err: unknown) {
      const errorMessage = getApiOrErrorMessage(err, 'Failed to save');
      alert(tRef.current('admin.discounts.errorSaving').replace('{message}', errorMessage));
    } finally {
      setCategorySaving(false);
    }
  };

  const handleBrandDiscountSave = async () => {
    setBrandSaving(true);
    try {
      const saved = await persistSettings();
      if (saved) {
        alert(tRef.current('admin.discounts.savedSuccess'));
      }
    } catch (err: unknown) {
      const errorMessage = getApiOrErrorMessage(err, 'Failed to save');
      alert(tRef.current('admin.discounts.errorSaving').replace('{message}', errorMessage));
    } finally {
      setBrandSaving(false);
    }
  };

  const handleProductDiscountSave = async (productId: string) => {
    const current = productDiscounts[productId] ?? { type: 'NONE', value: null, expiresAt: null };
    const isInvalidPercent =
      current.type === 'PERCENT' &&
      (current.value === null || current.value < 0 || current.value > 100);
    const isInvalidAmount =
      current.type === 'AMOUNT' && (current.value === null || current.value <= 0);
    if (isInvalidPercent || isInvalidAmount) {
      alert(tRef.current('admin.discounts.discountMustBeValid'));
      return;
    }

    setSavingProductId(productId);
    try {
      const nextRow = {
        discountType: current.type,
        discountValue: current.type === 'NONE' ? null : current.value,
        discountExpiresAt: current.expiresAt,
      };
      await apiClient.patch(`/api/v1/supersudo/products/${productId}/discount`, nextRow);

      setProducts((prev) =>
        prev.map((row) => (row.id === productId ? { ...row, ...nextRow } : row)),
      );

      const cacheKey = buildProductDiscountsCacheKey(activeLocale);
      const cached = readAdminSessionCache<ProductDiscountsPayload>(
        cacheKey,
        ADMIN_SESSION_CACHE_TTL_MS,
      );
      if (cached?.data) {
        writeAdminSessionCache(cacheKey, {
          data: cached.data.map((row) => (row.id === productId ? { ...row, ...nextRow } : row)),
        });
      }

      alert(tRef.current('admin.discounts.productDiscountSaved'));
    } catch (err: unknown) {
      const errorMessage = getApiOrErrorMessage(err, 'Failed to save');
      alert(tRef.current('admin.discounts.errorSavingProduct').replace('{message}', errorMessage));
    } finally {
      setSavingProductId(null);
    }
  };

  const updateCategoryDiscountValue = (categoryId: string, value: string) => {
    if (value === '') {
      setCategoryDiscounts((prev) => {
        const updated = { ...prev };
        delete updated[categoryId];
        return updated;
      });
      return;
    }
    const numericValue = clampDiscountValue(parseFloat(value));
    setCategoryDiscounts((prev) => ({
      ...prev,
      [categoryId]: {
        percent: numericValue,
        expiresAt: prev[categoryId]?.expiresAt ?? null,
      },
    }));
  };

  const updateCategoryDiscountExpires = (categoryId: string, expiresAt: string | null) => {
    setCategoryDiscounts((prev) => {
      const current = prev[categoryId];
      if (!current) {
        return prev;
      }
      return {
        ...prev,
        [categoryId]: { ...current, expiresAt },
      };
    });
  };

  const updateBrandDiscountValue = (brandId: string, value: string) => {
    if (value === '') {
      setBrandDiscounts((prev) => {
        const updated = { ...prev };
        delete updated[brandId];
        return updated;
      });
      return;
    }
    const numericValue = clampDiscountValue(parseFloat(value));
    setBrandDiscounts((prev) => ({
      ...prev,
      [brandId]: {
        percent: numericValue,
        expiresAt: prev[brandId]?.expiresAt ?? null,
      },
    }));
  };

  const updateBrandDiscountExpires = (brandId: string, expiresAt: string | null) => {
    setBrandDiscounts((prev) => {
      const current = prev[brandId];
      if (!current) {
        return prev;
      }
      return {
        ...prev,
        [brandId]: { ...current, expiresAt },
      };
    });
  };

  const clearCategoryDiscount = (categoryId: string) => {
    setCategoryDiscounts((prev) => {
      const updated = { ...prev };
      delete updated[categoryId];
      return updated;
    });
  };

  const clearBrandDiscount = (brandId: string) => {
    setBrandDiscounts((prev) => {
      const updated = { ...prev };
      delete updated[brandId];
      return updated;
    });
  };

  const setProductDiscount = (productId: string, value: DiscountControlValue) => {
    setProductDiscounts((prev) => ({ ...prev, [productId]: value }));
  };

  return {
    globalDiscount,
    setGlobalDiscount,
    globalDiscountExpiresAt,
    setGlobalDiscountExpiresAt,
    discountLoading,
    discountSaving,
    handleDiscountSave,
    categories,
    categoriesLoading,
    categoryDiscounts,
    updateCategoryDiscountValue,
    updateCategoryDiscountExpires,
    clearCategoryDiscount,
    handleCategoryDiscountSave,
    categorySaving,
    brands,
    brandsLoading,
    brandDiscounts,
    updateBrandDiscountValue,
    updateBrandDiscountExpires,
    clearBrandDiscount,
    handleBrandDiscountSave,
    brandSaving,
    products,
    productsLoading,
    productDiscounts,
    setProductDiscount,
    handleProductDiscountSave,
    savingProductId,
  };
}
