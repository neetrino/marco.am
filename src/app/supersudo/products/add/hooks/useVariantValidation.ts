import type { Variant } from '../types';
import { t as translateByLocale } from '@/lib/i18n';
import { getStoredLanguage } from '@/lib/language';

interface UseVariantValidationProps {
  productType: 'simple' | 'variable';
  variants: Variant[];
  setLoading: (loading: boolean) => void;
}

export function useVariantValidation({
  productType,
  variants,
  setLoading,
}: UseVariantValidationProps) {
  const mt = (path: string): string => translateByLocale(getStoredLanguage(), path);
  const validateVariants = (): string | null => {
    if (productType === 'variable' && variants.length === 0) {
      setLoading(false);
      return mt('admin.products.add.selectAttributesAndFillVariants');
    }

    if (productType === 'variable') {
      const skuSet = new Set<string>();
      for (const variant of variants) {
        const variantSku = variant.sku ? variant.sku.trim() : '';
        if (!variantSku) {
          continue;
        }

        if (skuSet.has(variantSku)) {
          setLoading(false);
          return mt('admin.products.add.duplicateSku').replace('{sku}', variantSku);
        }
        skuSet.add(variantSku);
      }
    }

    return null;
  };

  return { validateVariants };
}
