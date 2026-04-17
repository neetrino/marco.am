'use client';

import { Button } from '@shop/ui';
import { useAuth } from '../lib/auth/AuthContext';
import { useTranslation } from '../lib/i18n-client';
import { useReviewForm } from './ProductReviews/hooks/useReviewForm';
import { ReviewSummary } from './ProductReviews/ReviewSummary';
import { ReviewForm } from './ProductReviews/ReviewForm';
import { ReviewList } from './ProductReviews/ReviewList';
import { ProductReviewsLoading } from './ProductReviews/ProductReviewsLoading';
import type { Review } from './ProductReviews/utils';
import type { ProductReviewsAggregate } from '@/lib/types/product-reviews';

interface ProductReviewsProps {
  productId?: string;
  productSlug?: string;
  reviews: Review[];
  aggregate: ProductReviewsAggregate;
  loading: boolean;
  loadReviews: () => void | Promise<void>;
}

export function ProductReviews({
  productId,
  productSlug,
  reviews,
  aggregate,
  loading,
  loadReviews,
}: ProductReviewsProps) {
  const { isLoggedIn, user } = useAuth();
  const { t } = useTranslation();

  const {
    showForm,
    setShowForm,
    rating,
    setRating,
    hoveredRating,
    setHoveredRating,
    comment,
    setComment,
    policyAccepted,
    setPolicyAccepted,
    resetReviewPolicy,
    submitting,
    editingReviewId,
    handleEditReview,
    handleCancelEdit,
    handleSubmit,
    handleUpdateReview,
  } = useReviewForm({
    productId,
    productSlug,
    reviews,
    onReviewUpdated: () => {
      void loadReviews();
    },
  });

  // Get user's review if exists (reserved for future UI)
  const _userReview = user ? reviews.find(r => r.userId === user.id) : null;

  if (loading) {
    return <ProductReviewsLoading />;
  }

  const handleShowForm = () => {
    if (!isLoggedIn) {
      alert(t('common.reviews.loginRequired'));
      return;
    }
    resetReviewPolicy();
    setShowForm(true);
  };

  const handleLoginRequired = () => {
    alert(t('common.reviews.loginRequired'));
  };

  return (
    <div className="page-shell py-12 border-t border-gray-200">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          {t('common.reviews.title')}
        </h2>

        {/* Rating Summary */}
        <ReviewSummary reviews={reviews} aggregate={aggregate} />

        {/* Write Review Button */}
        {!showForm && (
          <Button
            variant="primary"
            onClick={handleShowForm}
            className="mb-8"
          >
            {t('common.reviews.writeReview')}
          </Button>
        )}

        {/* Review Form */}
        {showForm && (
          <ReviewForm
            rating={rating}
            hoveredRating={hoveredRating}
            comment={comment}
            submitting={submitting}
            editingReviewId={editingReviewId}
            policyAccepted={policyAccepted}
            onPolicyChange={setPolicyAccepted}
            onRatingChange={setRating}
            onHover={setHoveredRating}
            onCommentChange={setComment}
            onSubmit={editingReviewId ? handleUpdateReview : handleSubmit}
            onCancel={editingReviewId ? handleCancelEdit : () => {
              setShowForm(false);
              setRating(0);
              setComment('');
              resetReviewPolicy();
            }}
          />
        )}
      </div>

      {/* Reviews List */}
      <ReviewList
        reviews={reviews}
        currentUserId={user?.id}
        showForm={showForm}
        onEditReview={handleEditReview}
        onShowForm={handleShowForm}
        onLoginRequired={handleLoginRequired}
      />
    </div>
  );
}


