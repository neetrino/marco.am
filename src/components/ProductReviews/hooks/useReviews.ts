'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../../lib/api-client';
import type { Review } from '../utils';
import { logger } from "@/lib/utils/logger";
import type {
  ProductReviewsAggregate,
  ProductReviewsListResponse,
} from '@/lib/types/product-reviews';

const EMPTY_AGGREGATE: ProductReviewsAggregate = {
  averageRating: 0,
  reviewCount: 0,
  distribution: [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: 0,
    percentage: 0,
  })),
};

/**
 * Hook for fetching and managing reviews
 */
export function useReviews(productId?: string, productSlug?: string) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [aggregate, setAggregate] = useState<ProductReviewsAggregate>(EMPTY_AGGREGATE);
  const [loading, setLoading] = useState(true);

  const loadReviews = useCallback(async () => {
    try {
      const identifier = productSlug || productId;
      if (!identifier) {
        logger.devLog('⚠️ [PRODUCT REVIEWS] No product identifier provided');
        setReviews([]);
        setAggregate(EMPTY_AGGREGATE);
        setLoading(false);
        return;
      }

      logger.devLog('📝 [PRODUCT REVIEWS] Loading reviews for product:', identifier);
      setLoading(true);
      const data = await apiClient.get<ProductReviewsListResponse>(
        `/api/v1/products/${identifier}/reviews`
      );
      logger.devLog('✅ [PRODUCT REVIEWS] Reviews loaded:', data?.reviews?.length ?? 0);
      setReviews(data.reviews ?? []);
      setAggregate(data.aggregate ?? EMPTY_AGGREGATE);
    } catch (error: unknown) {
      logger.devLog('❌ [PRODUCT REVIEWS] Error loading reviews:', error);
      const err = error as { status?: number };
      if (err.status !== 404) {
        logger.devLog('Failed to load reviews:', error);
      }
      setReviews([]);
      setAggregate(EMPTY_AGGREGATE);
    } finally {
      setLoading(false);
    }
  }, [productId, productSlug]);

  useEffect(() => {
    void loadReviews();
  }, [loadReviews]);

  useEffect(() => {
    const handleReviewUpdate = () => {
      void loadReviews();
    };
    if (typeof window === 'undefined') {
      return;
    }
    window.addEventListener('review-updated', handleReviewUpdate);
    return () => window.removeEventListener('review-updated', handleReviewUpdate);
  }, [loadReviews]);

  return {
    reviews,
    aggregate,
    loading,
    setReviews,
    loadReviews,
  };
}




