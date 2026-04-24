'use client';

import { Button } from '@shop/ui';
import { useTranslation } from '../../lib/i18n-client';
import { ReviewItem } from './ReviewItem';
import type { Review } from './utils';

interface ReviewListProps {
  reviews: Review[];
  currentUserId?: string;
  showForm: boolean;
  onEditReview: (review: Review) => void;
  onShowForm: () => void;
  onLoginRequired: () => void;
}

/**
 * Reviews list component
 */
export function ReviewList({
  reviews,
  currentUserId,
  showForm,
  onEditReview,
  onShowForm,
  onLoginRequired: _onLoginRequired,
}: ReviewListProps) {
  const { t } = useTranslation();

  if (reviews.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-4">
          {t('common.reviews.noReviews')}
        </p>
        {!showForm && (
          <Button
            variant="primary"
            onClick={onShowForm}
            className="h-11 !rounded-[9999px] px-6 text-sm font-bold dark:!text-[#050505]"
          >
            {t('common.reviews.writeReview')}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {reviews.map((review) => (
        <ReviewItem
          key={review.id}
          review={review}
          currentUserId={currentUserId}
          onEdit={onEditReview}
        />
      ))}
    </div>
  );
}




