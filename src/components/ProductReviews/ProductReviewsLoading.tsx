'use client';

/**
 * Loading state component for ProductReviews
 */
export function ProductReviewsLoading() {
  return (
    <div className="page-shell py-12">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
        <div className="space-y-4">
          <div className="h-24 bg-gray-200 rounded"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  );
}




