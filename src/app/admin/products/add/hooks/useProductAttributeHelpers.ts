/**
 * Hook for product attribute helper functions
 */

import { useMemo } from 'react';
import type { Attribute } from '../types';
import { logger } from "@/lib/utils/logger";

interface UseProductAttributeHelpersProps {
  attributes: Attribute[];
}

export function useProductAttributeHelpers({ attributes }: UseProductAttributeHelpersProps) {
  const colorAttribute = useMemo(() => {
    if (!attributes || attributes.length === 0) {
      return undefined;
    }
    const colorAttr = attributes.find((attr) => attr.key === 'color');
    if (!colorAttr) {
      logger.devLog('⚠️ [ADMIN] Color attribute not found. Available attributes:', attributes.map(a => ({ key: a.key, name: a.name })));
    } else {
      logger.devLog('✅ [ADMIN] Color attribute found:', { id: colorAttr.id, key: colorAttr.key, valuesCount: colorAttr.values?.length || 0 });
    }
    return colorAttr;
  }, [attributes]);

  const sizeAttribute = useMemo(() => {
    if (!attributes || attributes.length === 0) {
      return undefined;
    }
    const sizeAttr = attributes.find((attr) => attr.key === 'size');
    if (!sizeAttr) {
      logger.devLog('⚠️ [ADMIN] Size attribute not found. Available attributes:', attributes.map(a => ({ key: a.key, name: a.name })));
    } else {
      logger.devLog('✅ [ADMIN] Size attribute found:', { id: sizeAttr.id, key: sizeAttr.key, valuesCount: sizeAttr.values?.length || 0 });
    }
    return sizeAttr;
  }, [attributes]);

  const getColorAttribute = () => colorAttribute;
  const getSizeAttribute = () => sizeAttribute;

  return {
    colorAttribute,
    sizeAttribute,
    getColorAttribute,
    getSizeAttribute,
  };
}

