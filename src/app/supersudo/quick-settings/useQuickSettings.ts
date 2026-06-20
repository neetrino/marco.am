'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { apiClient, getApiOrErrorMessage } from '@/lib/api-client';
import { logger } from '@/lib/utils/logger';
import type { LanguageCode } from '@/lib/language';
import { ADMIN_CACHE_KEYS, buildProductDiscountsCacheKey } from '@/lib/admin/admin-cache-keys';
import { beginAdminDataFetch } from '@/lib/admin/admin-fetch-helpers';
import {
  fetchAdminQuickSettingsBootstrap,
  mapQuickSettingsBootstrap,
} from '@/lib/admin/admin-bootstrap-client';
import { dedupedAdminRequest } from '@/lib/admin/admin-request-dedup';
import {
  readAdminBrandsCache,
  readAdminCategoriesCache,
  writeAdminBrandsCache,
  writeAdminCategoriesCache,
} from '@/lib/admin/admin-reference-data-cache';
import {
  ADMIN_SESSION_CACHE_TTL_MS,
  readAdminSessionCache,
  writeAdminSessionCache,
} from '@/lib/admin/admin-session-cache';

import type {
  QuickSettingsBrand,
  QuickSettingsCategory,
  QuickSettingsProductRow,
} from './types';

type SettingsPayload = {
  globalDiscount?: number;
  categoryDiscounts?: Record<string, number>;
  brandDiscounts?: Record<string, number>;
};

type ProductDiscountsPayload = { data: QuickSettingsProductRow[] };

type UseQuickSettingsParams = {
  activeLocale: LanguageCode;
  t: (key: string) => string;
};

export function useQuickSettings({ activeLocale, t }: UseQuickSettingsParams) {
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
  const cachedCategories = readAdminCategoriesCache<QuickSettingsCategory>(activeLocale, {
    includeCounts: false,
  });
  const cachedBrands = readAdminBrandsCache<QuickSettingsBrand>();

  const hadSettingsCacheRef = useRef(cachedSettings !== null);
  const hadProductsCacheRef = useRef(cachedProducts !== null);
  const hadCategoriesCacheRef = useRef(cachedCategories !== null);
  const hadBrandsCacheRef = useRef(cachedBrands !== null);

  const [globalDiscount, setGlobalDiscount] = useState<number>(cachedSettings?.globalDiscount ?? 0);
  const [categoryDiscounts, setCategoryDiscounts] = useState<Record<string, number>>(
    cachedSettings?.categoryDiscounts ?? {},
  );
  const [brandDiscounts, setBrandDiscounts] = useState<Record<string, number>>(
    cachedSettings?.brandDiscounts ?? {},
  );
  const [discountLoading, setDiscountLoading] = useState(cachedSettings === null);
  const [discountSaving, setDiscountSaving] = useState(false);

  const [products, setProducts] = useState<QuickSettingsProductRow[]>(cachedProducts?.data ?? []);
  const [productsLoading, setProductsLoading] = useState(cachedProducts === null);
  const [productDiscounts, setProductDiscounts] = useState<Record<string, number>>(() => {
    const rows = cachedProducts?.data ?? [];
    return Object.fromEntries(rows.map((row) => [row.id, row.discountPercent ?? 0]));
  });
  const [savingProductId, setSavingProductId] = useState<string | null>(null);

  const [categories, setCategories] = useState<QuickSettingsCategory[]>(cachedCategories ?? []);
  const [categoriesLoading, setCategoriesLoading] = useState(cachedCategories === null);
  const [categorySaving, setCategorySaving] = useState(false);

  const [brands, setBrands] = useState<QuickSettingsBrand[]>(cachedBrands ?? []);
  const [brandsLoading, setBrandsLoading] = useState(cachedBrands === null);
  const [brandSaving, setBrandSaving] = useState(false);

  const applySettings = useCallback((settings: SettingsPayload) => {
    setGlobalDiscount(settings.globalDiscount ?? 0);
    setCategoryDiscounts(settings.categoryDiscounts ?? {});
    setBrandDiscounts(settings.brandDiscounts ?? {});
  }, []);

  const applyProductRows = useCallback((rows: QuickSettingsProductRow[]) => {
    setProducts(rows);
    setProductDiscounts(
      Object.fromEntries(rows.map((row) => [row.id, row.discountPercent ?? 0])),
    );
  }, []);

  const fetchSettings = useCallback(async (options?: { force?: boolean }) => {
    const cached = readAdminSessionCache<SettingsPayload>(
      ADMIN_CACHE_KEYS.settings,
      ADMIN_SESSION_CACHE_TTL_MS,
    );
    if (!options?.force && cached !== null) {
      applySettings(cached);
      setDiscountLoading(false);
      hadSettingsCacheRef.current = true;
      return;
    }

    try {
      beginAdminDataFetch(hadSettingsCacheRef.current, setDiscountLoading);
      const settings = await dedupedAdminRequest(ADMIN_CACHE_KEYS.settings, () =>
        apiClient.get<SettingsPayload>('/api/v1/supersudo/settings'),
      );
      applySettings(settings);
      writeAdminSessionCache(ADMIN_CACHE_KEYS.settings, settings);
      hadSettingsCacheRef.current = true;
    } catch (err: unknown) {
      logger.error('Quick settings: settings fetch failed', { error: err });
      if (!hadSettingsCacheRef.current) {
        applySettings({});
      }
    } finally {
      setDiscountLoading(false);
    }
  }, [applySettings]);

  const fetchProductDiscounts = useCallback(async (options?: { force?: boolean }) => {
    const cacheKey = buildProductDiscountsCacheKey(activeLocale);
    const cached = readAdminSessionCache<ProductDiscountsPayload>(
      cacheKey,
      ADMIN_SESSION_CACHE_TTL_MS,
    );
    if (!options?.force && cached !== null) {
      applyProductRows(cached.data ?? []);
      setProductsLoading(false);
      hadProductsCacheRef.current = true;
      return;
    }

    try {
      beginAdminDataFetch(hadProductsCacheRef.current, setProductsLoading);
      const response = await dedupedAdminRequest(cacheKey, () =>
        apiClient.get<ProductDiscountsPayload>('/api/v1/supersudo/products/discounts', {
          params: { lang: activeLocale },
        }),
      );
      const rows = response.data ?? [];
      applyProductRows(rows);
      writeAdminSessionCache(cacheKey, { data: rows });
      hadProductsCacheRef.current = true;
    } catch (err: unknown) {
      logger.error('Quick settings: product discounts fetch failed', { error: err });
      if (!hadProductsCacheRef.current) {
        applyProductRows([]);
      }
    } finally {
      setProductsLoading(false);
    }
  }, [activeLocale, applyProductRows]);

  const fetchCategories = useCallback(async (options?: { force?: boolean }) => {
    const cached = readAdminCategoriesCache<QuickSettingsCategory>(activeLocale, {
      includeCounts: false,
    });
    if (!options?.force && cached !== null) {
      setCategories(cached);
      setCategoriesLoading(false);
      hadCategoriesCacheRef.current = true;
      return;
    }

    const requestKey = `categories:${activeLocale}:lite`;
    try {
      beginAdminDataFetch(hadCategoriesCacheRef.current, setCategoriesLoading);
      const response = await dedupedAdminRequest(requestKey, () =>
        apiClient.get<{ data: QuickSettingsCategory[] }>('/api/v1/supersudo/categories', {
          params: { lang: activeLocale, counts: 'false' },
        }),
      );
      const rows = response.data ?? [];
      setCategories(rows);
      writeAdminCategoriesCache(activeLocale, rows, { includeCounts: false });
      hadCategoriesCacheRef.current = true;
    } catch (err: unknown) {
      logger.error('Quick settings: categories fetch failed', { error: err });
      if (!hadCategoriesCacheRef.current) {
        setCategories([]);
      }
    } finally {
      setCategoriesLoading(false);
    }
  }, [activeLocale]);

  const fetchBrands = useCallback(async (options?: { force?: boolean }) => {
    const cached = readAdminBrandsCache<QuickSettingsBrand>();
    if (!options?.force && cached !== null) {
      setBrands(cached);
      setBrandsLoading(false);
      hadBrandsCacheRef.current = true;
      return;
    }

    try {
      beginAdminDataFetch(hadBrandsCacheRef.current, setBrandsLoading);
      const response = await dedupedAdminRequest(ADMIN_CACHE_KEYS.brands, () =>
        apiClient.get<{ data: QuickSettingsBrand[] }>('/api/v1/supersudo/brands'),
      );
      const rows = response.data ?? [];
      setBrands(
        rows.map((brand) => ({
          id: brand.id,
          name: brand.name,
          logoUrl: brand.logoUrl ?? undefined,
        })),
      );
      writeAdminBrandsCache(rows);
      hadBrandsCacheRef.current = true;
    } catch (err: unknown) {
      logger.error('Quick settings: brands fetch failed', { error: err });
      if (!hadBrandsCacheRef.current) {
        setBrands([]);
      }
    } finally {
      setBrandsLoading(false);
    }
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
    const categoriesCached = readAdminCategoriesCache<QuickSettingsCategory>(activeLocale, {
      includeCounts: false,
    });
    const brandsCached = readAdminBrandsCache<QuickSettingsBrand>();

    const needsBootstrap =
      settingsCached === null ||
      productsCached === null ||
      categoriesCached === null ||
      brandsCached === null;

    if (!needsBootstrap) {
      return;
    }

    if (settingsCached === null) {
      setDiscountLoading(true);
    }
    if (productsCached === null) {
      setProductsLoading(true);
    }
    if (categoriesCached === null) {
      setCategoriesLoading(true);
    }
    if (brandsCached === null) {
      setBrandsLoading(true);
    }

    try {
      const bootstrap = await fetchAdminQuickSettingsBootstrap(activeLocale);
      const mapped = mapQuickSettingsBootstrap(bootstrap);
      applySettings(mapped.settings);
      setCategories(mapped.categories);
      setBrands(mapped.brands);
      applyProductRows(mapped.products);
      hadSettingsCacheRef.current = true;
      hadProductsCacheRef.current = true;
      hadCategoriesCacheRef.current = true;
      hadBrandsCacheRef.current = true;
    } catch (err: unknown) {
      logger.error('Quick settings: bootstrap fetch failed', { error: err });
      if (!hadSettingsCacheRef.current) {
        applySettings({});
      }
      if (!hadProductsCacheRef.current) {
        applyProductRows([]);
      }
      if (!hadCategoriesCacheRef.current) {
        setCategories([]);
      }
      if (!hadBrandsCacheRef.current) {
        setBrands([]);
      }
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

  const buildDiscountPayload = () => {
    const filterMap = (map: Record<string, number>) =>
      Object.entries(map).reduce<Record<string, number>>((acc, [id, value]) => {
        if (typeof value === 'number' && value > 0) {
          acc[id] = clampDiscountValue(value);
        }
        return acc;
      }, {});

    return {
      categoryDiscounts: filterMap(categoryDiscounts),
      brandDiscounts: filterMap(brandDiscounts),
    };
  };

  const persistSettings = async () => {
    const discountValue = parseFloat(globalDiscount.toString());
    if (Number.isNaN(discountValue) || discountValue < 0 || discountValue > 100) {
      alert(tRef.current('admin.quickSettings.discountMustBeValid'));
      return false;
    }

    await apiClient.put('/api/v1/supersudo/settings', {
      globalDiscount: discountValue,
      ...buildDiscountPayload(),
    });

    const nextSettings: SettingsPayload = {
      globalDiscount: discountValue,
      ...buildDiscountPayload(),
    };
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
        alert(tRef.current('admin.quickSettings.savedSuccess'));
      }
    } catch (err: unknown) {
      const errorMessage = getApiOrErrorMessage(err, 'Failed to save');
      alert(tRef.current('admin.quickSettings.errorSaving').replace('{message}', errorMessage));
    } finally {
      setDiscountSaving(false);
    }
  };

  const handleCategoryDiscountSave = async () => {
    setCategorySaving(true);
    try {
      const saved = await persistSettings();
      if (saved) {
        alert(tRef.current('admin.quickSettings.savedSuccess'));
      }
    } catch (err: unknown) {
      const errorMessage = getApiOrErrorMessage(err, 'Failed to save');
      alert(tRef.current('admin.quickSettings.errorSaving').replace('{message}', errorMessage));
    } finally {
      setCategorySaving(false);
    }
  };

  const handleBrandDiscountSave = async () => {
    setBrandSaving(true);
    try {
      const saved = await persistSettings();
      if (saved) {
        alert(tRef.current('admin.quickSettings.savedSuccess'));
      }
    } catch (err: unknown) {
      const errorMessage = getApiOrErrorMessage(err, 'Failed to save');
      alert(tRef.current('admin.quickSettings.errorSaving').replace('{message}', errorMessage));
    } finally {
      setBrandSaving(false);
    }
  };

  const handleProductDiscountSave = async (productId: string) => {
    const discountValue = productDiscounts[productId] ?? 0;
    if (Number.isNaN(discountValue) || discountValue < 0 || discountValue > 100) {
      alert(tRef.current('admin.quickSettings.discountMustBeValid'));
      return;
    }

    setSavingProductId(productId);
    try {
      await apiClient.patch(`/api/v1/supersudo/products/${productId}/discount`, {
        discountPercent: discountValue,
      });

      setProducts((prev) =>
        prev.map((row) =>
          row.id === productId ? { ...row, discountPercent: discountValue } : row,
        ),
      );
      setProductDiscounts((prev) => ({ ...prev, [productId]: discountValue }));

      const cacheKey = buildProductDiscountsCacheKey(activeLocale);
      const cached = readAdminSessionCache<ProductDiscountsPayload>(
        cacheKey,
        ADMIN_SESSION_CACHE_TTL_MS,
      );
      if (cached?.data) {
        writeAdminSessionCache(cacheKey, {
          data: cached.data.map((row) =>
            row.id === productId ? { ...row, discountPercent: discountValue } : row,
          ),
        });
      }

      alert(tRef.current('admin.quickSettings.productDiscountSaved'));
    } catch (err: unknown) {
      const errorMessage = getApiOrErrorMessage(err, 'Failed to save');
      alert(tRef.current('admin.quickSettings.errorSavingProduct').replace('{message}', errorMessage));
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
    setCategoryDiscounts((prev) => ({ ...prev, [categoryId]: numericValue }));
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
    setBrandDiscounts((prev) => ({ ...prev, [brandId]: numericValue }));
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

  return {
    globalDiscount,
    setGlobalDiscount,
    discountLoading,
    discountSaving,
    handleDiscountSave,
    categories,
    categoriesLoading,
    categoryDiscounts,
    updateCategoryDiscountValue,
    clearCategoryDiscount,
    handleCategoryDiscountSave,
    categorySaving,
    brands,
    brandsLoading,
    brandDiscounts,
    updateBrandDiscountValue,
    clearBrandDiscount,
    handleBrandDiscountSave,
    brandSaving,
    products,
    productsLoading,
    productDiscounts,
    setProductDiscounts,
    handleProductDiscountSave,
    savingProductId,
  };
}
