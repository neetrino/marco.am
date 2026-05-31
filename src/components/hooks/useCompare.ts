'use client';

import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import {
  addCompareItemClient,
  removeCompareItemClient,
} from '@/lib/compare/compare-client';
import { getErrorHttpStatus } from '@/lib/api-client';
import { showToast } from '@/components/Toast';
import { getStoredLanguage } from '@/lib/language';
import { useTranslation } from '../../lib/i18n-client';

import { useCompareProductIds } from './useCompareProductIds';

function patchCompareIds(
  ids: string[],
  productId: string,
  include: boolean,
): string[] {
  const has = ids.includes(productId);
  if (include && !has) {
    return [...ids, productId];
  }
  if (!include && has) {
    return ids.filter((id) => id !== productId);
  }
  return ids;
}

/**
 * Hook for managing compare state for a product
 * @param productId - The product ID to check/manage
 * @returns Object with compare state and toggle function
 */
export function useCompare(productId: string) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { ids, queryKey } = useCompareProductIds();
  const [isToggling, setIsToggling] = useState(false);
  const isTogglingRef = useRef(false);

  const isInCompare = productId ? ids.includes(productId) : false;

  const toggleCompare = async () => {
    if (!productId) {
      return;
    }
    if (isTogglingRef.current) {
      return;
    }

    const previousValue = isInCompare;
    const nextValue = !previousValue;
    const delta = nextValue ? 1 : -1;
    isTogglingRef.current = true;
    setIsToggling(true);
    queryClient.setQueryData<string[]>(queryKey, (current = []) =>
      patchCompareIds(current, productId, nextValue),
    );
    window.dispatchEvent(
      new CustomEvent('compare-optimistic-updated', {
        detail: { delta },
      }),
    );

    try {
      const language = getStoredLanguage();
      if (nextValue) {
        await addCompareItemClient(productId, language);
      } else {
        await removeCompareItemClient(productId, language);
      }
    } catch (error: unknown) {
      queryClient.setQueryData<string[]>(queryKey, (current = []) =>
        patchCompareIds(current, productId, previousValue),
      );
      window.dispatchEvent(
        new CustomEvent('compare-optimistic-updated', {
          detail: { delta: -delta },
        }),
      );
      if (nextValue && getErrorHttpStatus(error) === 422) {
        showToast(t('common.alerts.compareMaxReached'), 'warning', 2800);
      }
    } finally {
      isTogglingRef.current = false;
      setIsToggling(false);
    }
  };

  return { isInCompare, toggleCompare, isToggling };
}
