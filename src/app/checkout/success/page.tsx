import { Suspense } from 'react';
import { OrderSuccessContent } from './OrderSuccessContent';

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="page-shell py-10 sm:py-14">
          <div className="mx-auto h-40 max-w-xl animate-pulse rounded-2xl bg-marco-gray" />
        </div>
      }
    >
      <OrderSuccessContent />
    </Suspense>
  );
}
