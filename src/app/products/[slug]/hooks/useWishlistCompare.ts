import { useState, useEffect, useCallback } from 'react';
import { COMPARE_KEY } from '../types';
import { fetchWishlistProductIds } from '@/lib/wishlist/wishlist-client';
import { getStoredLanguage, type LanguageCode } from '@/lib/language';

interface UseWishlistCompareProps {
  productId: string | null;
}

export function useWishlistCompare({ productId }: UseWishlistCompareProps) {
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [isInCompare, setIsInCompare] = useState(false);
  const [language, setLanguage] = useState<LanguageCode>(() => getStoredLanguage());

  const refreshWishlist = useCallback(async () => {
    if (!productId) {
      setIsInWishlist(false);
      return;
    }
    try {
      const ids = await fetchWishlistProductIds(language);
      setIsInWishlist(ids.includes(productId));
    } catch {
      setIsInWishlist(false);
    }
  }, [productId, language]);

  useEffect(() => {
    const onLang = () => setLanguage(getStoredLanguage());
    window.addEventListener('language-updated', onLang);
    return () => window.removeEventListener('language-updated', onLang);
  }, []);

  useEffect(() => {
    void refreshWishlist();
  }, [refreshWishlist]);

  useEffect(() => {
    const onUpdate = () => {
      void refreshWishlist();
    };
    window.addEventListener('wishlist-updated', onUpdate);
    window.addEventListener('auth-updated', onUpdate);
    return () => {
      window.removeEventListener('wishlist-updated', onUpdate);
      window.removeEventListener('auth-updated', onUpdate);
    };
  }, [refreshWishlist]);

  useEffect(() => {
    if (!productId) return;

    const checkCompare = () => {
      if (typeof window === 'undefined') return;
      try {
        const stored = localStorage.getItem(COMPARE_KEY);
        const compare = stored ? JSON.parse(stored) : [];
        setIsInCompare(compare.includes(productId));
      } catch {
        setIsInCompare(false);
      }
    };

    checkCompare();
    window.addEventListener('compare-updated', checkCompare);
    return () => window.removeEventListener('compare-updated', checkCompare);
  }, [productId]);

  return { isInWishlist, setIsInWishlist, isInCompare, setIsInCompare };
}
