'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '../../lib/api-client';
import { type LanguageCode } from '../../lib/language';
import { logger } from "@/lib/utils/logger";

interface RelatedProduct {
  id: string;
  slug: string;
  title: string;
  price: number;
  originalPrice?: number | null;
  compareAtPrice: number | null;
  discountPercent?: number | null;
  image: string | null;
  inStock: boolean;
  brand?: {
    id: string;
    name: string;
  } | null;
  categories?: Array<{
    id: string;
    slug: string;
    title: string;
  }>;
  variants?: Array<{
    options?: Array<{
      key: string;
      value: string;
    }>;
  }>;
}

interface UseRelatedProductsProps {
  productSlug: string;
  language: LanguageCode;
}

/**
 * Hook for fetching related products
 */
export function useRelatedProducts({ productSlug, language }: UseRelatedProductsProps) {
  const [products, setProducts] = useState<RelatedProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!productSlug) {
      setProducts([]);
      setLoading(false);
      return;
    }

    const fetchRelatedProducts = async () => {
      try {
        setLoading(true);

        const params: Record<string, string> = {
          limit: "10",
          lang: language,
        };

        const encodedSlug = encodeURIComponent(productSlug.trim());
        const response = await apiClient.get<{
          data: RelatedProduct[];
          meta: { total: number };
        }>(`/api/v1/products/${encodedSlug}/related`, {
          params,
        });

        logger.devLog("[RelatedProducts] Received products:", response.data.length);
        setProducts(response.data.slice(0, 10));
      } catch (error) {
        console.error("[RelatedProducts] Error fetching related products:", error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRelatedProducts();
  }, [productSlug, language]);

  return { products, loading };
}




