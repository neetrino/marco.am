import { useState, useRef } from 'react';
import type { Brand, Category, Attribute, Variant, ProductLabel, GeneratedVariant } from '../types';
import type { Product } from '../../types';
import type { CurrencyCode } from '@/lib/currency';
import type { ProductClass } from '@/lib/constants/product-class';
import type { ProductDescriptionEntry } from '@/lib/products/product-description';

export function useProductFormState(listProduct: Product | null = null) {
  const [loading, setLoading] = useState(false);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [formData, setFormData] = useState(() => ({
    title: listProduct?.title ?? '',
    slug: listProduct?.slug ?? '',
    subtitleHtml: '',
    description: [] as ProductDescriptionEntry[],
    productClass: listProduct?.productClass ?? ('retail' as ProductClass),
    brandIds: [] as string[],
    primaryCategoryId: '',
    categoryIds: [] as string[],
    published: listProduct?.published ?? false,
    featured: listProduct?.featured ?? false,
    imageUrls: [] as string[],
    featuredImageIndex: 0,
    mainProductImage: '' as string,
    variants: [] as Variant[],
    labels: [] as ProductLabel[],
    warrantyYears: null as number | null,
  }));
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const variantImageInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const attributesDropdownRef = useRef<HTMLDivElement | null>(null);
  const [attributesDropdownOpen, setAttributesDropdownOpen] = useState(false);
  const [colorImageTarget, setColorImageTarget] = useState<{ variantId: string; colorValue: string } | null>(null);
  const [imageUploadLoading, setImageUploadLoading] = useState(false);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const [newColorName, setNewColorName] = useState('');
  const [newSizeName, setNewSizeName] = useState('');
  const [addingColor, setAddingColor] = useState(false);
  const [addingSize, setAddingSize] = useState(false);
  const [colorMessage, setColorMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [sizeMessage, setSizeMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [defaultCurrency, setDefaultCurrency] = useState<CurrencyCode>('AMD');
  const [productType, setProductType] = useState<'simple' | 'variable'>('simple');
  const [simpleProductData, setSimpleProductData] = useState({
    price: '',
    compareAtPrice: '',
    sku: '',
    quantity: '',
    variantId: '',
  });
  const [selectedAttributesForVariants, setSelectedAttributesForVariants] = useState<Set<string>>(new Set());
  const [selectedAttributeValueIds, setSelectedAttributeValueIds] = useState<Record<string, string[]>>({});
  const [openValueModal, setOpenValueModal] = useState<{ variantId: string; attributeId: string } | null>(null);
  const [generatedVariants, setGeneratedVariants] = useState<GeneratedVariant[]>([]);
  const [hasVariantsToLoad, setHasVariantsToLoad] = useState(false);

  return {
    // Loading states
    loading,
    setLoading,
    // Data states
    brands,
    setBrands,
    categories,
    setCategories,
    attributes,
    setAttributes,
    // Form data
    formData,
    setFormData,
    // UI states
    attributesDropdownOpen,
    setAttributesDropdownOpen,
    // Refs
    fileInputRef,
    variantImageInputRefs,
    attributesDropdownRef,
    // Image states
    colorImageTarget,
    setColorImageTarget,
    imageUploadLoading,
    setImageUploadLoading,
    imageUploadError,
    setImageUploadError,
    // Color/Size management
    newColorName,
    setNewColorName,
    newSizeName,
    setNewSizeName,
    addingColor,
    setAddingColor,
    addingSize,
    setAddingSize,
    colorMessage,
    setColorMessage,
    sizeMessage,
    setSizeMessage,
    // Currency and product type
    defaultCurrency,
    setDefaultCurrency,
    productType,
    setProductType,
    simpleProductData,
    setSimpleProductData,
    // Variant builder states
    selectedAttributesForVariants,
    setSelectedAttributesForVariants,
    selectedAttributeValueIds,
    setSelectedAttributeValueIds,
    openValueModal,
    setOpenValueModal,
    generatedVariants,
    setGeneratedVariants,
    hasVariantsToLoad,
    setHasVariantsToLoad,
  };
}

