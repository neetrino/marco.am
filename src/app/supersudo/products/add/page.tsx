'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AddProductPageSuspenseFallback } from './components/AddProductPageSuspenseFallback';

function AddProductRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = searchParams.get('id');

  useEffect(() => {
    if (productId) {
      router.replace(`/supersudo/products?edit=${productId}`);
      return;
    }
    router.replace('/supersudo/products?create=1');
  }, [productId, router]);

  return null;
}

export default function AddProductPage() {
  return (
    <Suspense fallback={<AddProductPageSuspenseFallback />}>
      <AddProductRedirect />
    </Suspense>
  );
}
