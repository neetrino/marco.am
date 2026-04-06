import { useEffect } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { convertPrice, type CurrencyCode } from '@/lib/currency';
import { cleanImageUrls, separateMainAndVariantImages } from '@/lib/utils/image-utils';
import type {
  ProductData,
  ColorData,
  Variant,
  Attribute,
  AdminProductVariantRow,
  SimpleProductFormData,
} from '../types';
import type { AddProductFormState } from '../utils/productFormDataBuilder';
import type { ProductVariantForConversion } from '@/types/product-variant-for-conversion';
import { useTranslation } from '@/lib/i18n-client';
import { extractColor, extractSize } from '../utils/variantAttributeExtraction';
import {
  createDefaultColorData,
  updateDefaultColorData,
  createColorData,
  updateColorData,
} from '../utils/colorDataBuilder';
import {
  collectVariantImagesFromColors,
  collectVariantImagesFromProductVariants,
} from '../utils/variantImageCollector';
import { hasVariantsWithAttributes } from '../utils/productTypeDetector';
import { buildFormData } from '../utils/productFormDataBuilder';

interface UseProductEditModeProps {
  productId: string | null;
  isLoggedIn: boolean;
  isAdmin: boolean;
  attributes: Attribute[];
  defaultCurrency: CurrencyCode;
  setLoadingProduct: (loading: boolean) => void;
  setFormData: Dispatch<SetStateAction<AddProductFormState>>;
  setUseNewBrand: (use: boolean) => void;
  setUseNewCategory: (use: boolean) => void;
  setNewBrandName: (name: string) => void;
  setNewCategoryName: (name: string) => void;
  setHasVariantsToLoad: (has: boolean) => void;
  setProductType: (type: 'simple' | 'variable') => void;
  setSimpleProductData: Dispatch<SetStateAction<SimpleProductFormData>>;
}

export function useProductEditMode({
  productId,
  isLoggedIn,
  isAdmin,
  attributes,
  defaultCurrency,
  setLoadingProduct,
  setFormData,
  setUseNewBrand,
  setUseNewCategory,
  setNewBrandName,
  setNewCategoryName,
  setHasVariantsToLoad,
  setProductType,
  setSimpleProductData,
}: UseProductEditModeProps) {
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    if (productId && isLoggedIn && isAdmin) {
      const loadProduct = async () => {
        try {
          setLoadingProduct(true);
          console.log('📥 [ADMIN] Loading product for edit:', productId);
          const product = await apiClient.get<ProductData>(`/api/v1/admin/products/${productId}`);

          const colorDataMap = new Map<string, ColorData>();
          let firstPrice = '';
          let firstCompareAtPrice = '';
          let firstSku = '';

          (product.variants || []).forEach((variant: AdminProductVariantRow, index: number) => {
            const variantForForm = variant as unknown as Variant;
            console.log(`🔍 [ADMIN] Processing variant ${index}:`, {
              id: variant.id,
              sku: variant.sku,
              price: variant.price,
              stock: variant.stock,
              color: variant.color,
              size: variant.size,
              options: variant.options,
              imageUrl: variant.imageUrl,
            });

            const color = extractColor(variantForForm);
            const size = extractSize(variantForForm);

            console.log(`📊 [ADMIN] Extracted from variant ${index}:`, { color, size });

            const stockValue =
              variant.stock !== undefined && variant.stock !== null ? String(variant.stock) : '';

            if (!color) {
              const defaultColor = 'default';
              const defaultColorLabel = t('admin.products.add.defaultColor');

              if (!colorDataMap.has(defaultColor)) {
                const colorData = createDefaultColorData(
                  variantForForm,
                  defaultCurrency,
                  defaultColorLabel,
                  size,
                  stockValue
                );
                colorDataMap.set(defaultColor, colorData);
              } else {
                const existingColorData = colorDataMap.get(defaultColor)!;
                updateDefaultColorData(existingColorData, variantForForm, defaultCurrency, size, stockValue);
              }
            } else if (color) {
              if (!colorDataMap.has(color)) {
                const colorData = createColorData(variantForForm, color, attributes, defaultCurrency, size, stockValue);
                colorDataMap.set(color, colorData);
              } else {
                const existingColorData = colorDataMap.get(color)!;
                updateColorData(existingColorData, variantForForm, defaultCurrency, size, stockValue);
              }
            }

            if (index === 0) {
              const firstPriceUSD =
                variant.price !== undefined && variant.price !== null
                  ? typeof variant.price === 'number'
                    ? variant.price
                    : parseFloat(String(variant.price)) || 0
                  : 0;
              const firstCompareAtPriceUSD =
                variant.compareAtPrice !== undefined && variant.compareAtPrice !== null
                  ? typeof variant.compareAtPrice === 'number'
                    ? variant.compareAtPrice
                    : parseFloat(String(variant.compareAtPrice)) || 0
                  : 0;
              firstPrice =
                firstPriceUSD > 0 ? String(convertPrice(firstPriceUSD, 'USD', defaultCurrency)) : '';
              firstCompareAtPrice =
                firstCompareAtPriceUSD > 0
                  ? String(convertPrice(firstCompareAtPriceUSD, 'USD', defaultCurrency))
                  : '';
              firstSku = variant.sku || '';
            }
          });

          const mergedVariant: Variant = {
            id: `variant-${Date.now()}-${Math.random()}`,
            price: firstPrice,
            compareAtPrice: firstCompareAtPrice,
            sku: firstSku,
            colors: Array.from(colorDataMap.values()),
          };

          const variantImagesFromColors = collectVariantImagesFromColors(mergedVariant.colors);
          const variantImagesFromProduct = collectVariantImagesFromProductVariants(
            product.variants || []
          );
          const variantImages = new Set([...variantImagesFromColors, ...variantImagesFromProduct]);

          console.log(`🖼️ [ADMIN] Total variant images collected: ${variantImages.size}`);

          const mediaList = product.media || [];
          console.log('🖼️ [ADMIN] Loading main media images. Total media:', mediaList.length);

          const { main } = separateMainAndVariantImages(
            Array.isArray(mediaList) ? mediaList : [],
            variantImages.size > 0 ? Array.from(variantImages) : []
          );

          const normalizedMedia = cleanImageUrls(main);
          console.log(
            `🖼️ [ADMIN] Main media loaded: ${normalizedMedia.length} images (after separation from ${variantImages.size} variant images)`
          );

          const featuredIndexFromApi = Array.isArray(mediaList)
            ? mediaList.findIndex((item: string | { url?: string; isFeatured?: boolean }) => {
                const url = typeof item === 'string' ? item : item?.url || '';
                if (!url) return false;
                return typeof item === 'object' && item !== null && item.isFeatured === true;
              })
            : -1;

          const mainProductImage =
            product.mainProductImage || (normalizedMedia.length > 0 ? normalizedMedia[0] : '');

          const formData = buildFormData(
            product,
            normalizedMedia,
            featuredIndexFromApi,
            mainProductImage,
            mergedVariant
          );

          setFormData((prev) => ({
            ...prev,
            ...formData,
          }));

          setUseNewBrand(false);
          setUseNewCategory(false);
          setNewBrandName('');
          setNewCategoryName('');

          if (product.variants && product.variants.length > 0) {
            window.__productVariantsToConvert = product.variants as ProductVariantForConversion[];
            setHasVariantsToLoad(true);
          }

          if (product.attributeIds && product.attributeIds.length > 0) {
            window.__productAttributeIds = product.attributeIds;
            console.log('📋 [ADMIN] Product attributeIds loaded:', product.attributeIds);
          }

          const variants = product.variants || [];
          const hasVariants = variants.length > 0;
          const hasVariantsWithAttrs = hasVariantsWithAttributes(variants);

          const firstRow = variants[0];
          console.log('📦 [ADMIN] Product type check:', {
            hasVariants,
            variantsCount: variants.length,
            hasVariantsWithAttributes: hasVariantsWithAttrs,
            firstVariant:
              hasVariants && firstRow
                ? {
                    hasAttributes: !!(
                      firstRow.attributes &&
                      typeof firstRow.attributes === 'object' &&
                      Object.keys(firstRow.attributes).length > 0
                    ),
                    hasOptions: !!(firstRow.options && Array.isArray(firstRow.options) && firstRow.options.length > 0),
                    attributes: firstRow.attributes,
                    optionsCount: firstRow.options?.length || 0,
                  }
                : null,
          });

          if (!hasVariantsWithAttrs) {
            console.log('📦 [ADMIN] Product variants have no attributes, setting productType to "simple"');
            setProductType('simple');

            if (hasVariants && variants.length > 0) {
              const firstVariant = variants[0];
              setSimpleProductData({
                price: firstVariant?.price
                  ? String(
                      convertPrice(
                        typeof firstVariant.price === 'number'
                          ? firstVariant.price
                          : parseFloat(String(firstVariant.price || '0')),
                        'USD',
                        defaultCurrency
                      )
                    )
                  : '',
                compareAtPrice: firstVariant?.compareAtPrice
                  ? String(
                      convertPrice(
                        typeof firstVariant.compareAtPrice === 'number'
                          ? firstVariant.compareAtPrice
                          : parseFloat(String(firstVariant.compareAtPrice || '0')),
                        'USD',
                        defaultCurrency
                      )
                    )
                  : '',
                sku: firstVariant?.sku || '',
                quantity: String(firstVariant?.stock ?? 0),
              });
            } else {
              setSimpleProductData({
                price: '',
                compareAtPrice: '',
                sku: '',
                quantity: '0',
              });
            }
          } else {
            console.log('📦 [ADMIN] Product variants have attributes, keeping productType as "variable"');
            setProductType('variable');
          }

          console.log('✅ [ADMIN] Product loaded for edit');
        } catch (err: unknown) {
          console.error('❌ [ADMIN] Error loading product:', err);
          router.push('/admin/products');
        } finally {
          setLoadingProduct(false);
        }
      };

      loadProduct();
    }
  }, [
    productId,
    isLoggedIn,
    isAdmin,
    router,
    attributes,
    defaultCurrency,
    setLoadingProduct,
    setFormData,
    setUseNewBrand,
    setUseNewCategory,
    setNewBrandName,
    setNewCategoryName,
    setHasVariantsToLoad,
    setProductType,
    setSimpleProductData,
    t,
  ]);
}
