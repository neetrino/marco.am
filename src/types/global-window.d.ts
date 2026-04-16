import type { ProductVariantForConversion } from './product-variant-for-conversion';

declare global {
  interface Window {
    __productVariantsToConvert?: ProductVariantForConversion[];
    __productAttributeIds?: string[];
  }
}

export {};
