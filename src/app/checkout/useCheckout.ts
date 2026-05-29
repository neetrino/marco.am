import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { getStoredCurrency } from '../../lib/currency';
import { getStoredLanguage } from '../../lib/language';
import { useAuth } from '../../lib/auth/AuthContext';
import { useTranslation } from '../../lib/i18n-client';
import { usePaymentMethods } from './utils/payment-methods';
import { useCheckoutSchema } from './utils/validation-schema';
import { useCheckoutTotals } from './hooks/useCheckoutTotals';
import { useCheckoutPromo } from './hooks/useCheckoutPromo';
import { useCart } from './hooks/useCart';
import { useUserProfile } from './hooks/useUserProfile';
import { useOrderSubmission } from './hooks/useOrderSubmission';
import { useOrderSummary } from './hooks/useOrderSummary';
import { isCourierShipping } from '../../lib/constants/shipping-method';
import { getPickupBranches } from '../../lib/constants/pickup-branches';
import { apiClient } from '../../lib/api-client';
import { logger } from '../../lib/utils/logger';
import type { CheckoutFormData } from './types';

type DeliveryLocationsResponse = {
  cities: string[];
};

export function useCheckout() {
  const { isLoggedIn, isLoading } = useAuth();
  const { t, lang } = useTranslation();
  const [error, setError] = useState<string | null>(null);
  const [currency, setCurrency] = useState(getStoredCurrency());
  const [_language, setLanguage] = useState(getStoredLanguage());
  const [logoErrors, setLogoErrors] = useState<Record<string, boolean>>({});
  const [showShippingModal, setShowShippingModal] = useState(false);
  const [deliveryCities, setDeliveryCities] = useState<string[]>([]);
  const [loadingDeliveryCities, setLoadingDeliveryCities] = useState(false);

  const paymentMethods = usePaymentMethods();
  const checkoutSchema = useCheckoutSchema();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    setError: setFormFieldError,
    clearErrors,
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      notes: '',
      shippingMethod: 'courier',
      paymentMethod: 'cash',
      shippingAddress: '',
      shippingCity: '',
      pickupBranchId: '',
    },
  });

  const paymentMethod = watch('paymentMethod');
  const shippingMethod = watch('shippingMethod');
  const shippingCity = watch('shippingCity');
  const pickupBranchId = watch('pickupBranchId');
  const customerEmail = watch('email');
  const pickupBranches = getPickupBranches(lang);

  const { cart, loading, fetchCart } = useCart(isLoggedIn, isLoading);
  const { appliedCouponCode, applyPromo, clearPromo } = useCheckoutPromo({
    isLoggedIn,
    cart,
    shippingMethod,
    shippingCity,
    customerEmail,
    onCartRefresh: fetchCart,
  });
  const { checkoutTotals, loadingCheckoutTotals, checkoutTotalsStale } = useCheckoutTotals(
    cart,
    isLoggedIn,
    shippingMethod,
    shippingCity,
    appliedCouponCode,
    customerEmail
  );
  useUserProfile(isLoggedIn, isLoading, setValue);

  useEffect(() => {
    let active = true;

    const fetchDeliveryCities = async () => {
      setLoadingDeliveryCities(true);
      try {
        const response = await apiClient.get<DeliveryLocationsResponse>('/api/v1/delivery/locations');
        if (!active) {
          return;
        }
        setDeliveryCities(Array.isArray(response.cities) ? response.cities : []);
      } catch (err: unknown) {
        if (!active) {
          return;
        }
        logger.warn('Failed to fetch checkout delivery cities', { error: err });
        setDeliveryCities([]);
      } finally {
        if (active) {
          setLoadingDeliveryCities(false);
        }
      }
    };

    void fetchDeliveryCities();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const normalizedCity = shippingCity?.trim();
    if (!normalizedCity || deliveryCities.length === 0) {
      return;
    }
    const cityExists = deliveryCities.some(
      (city) => city.toLowerCase() === normalizedCity.toLowerCase()
    );
    if (!cityExists) {
      setValue('shippingCity', '', { shouldValidate: true, shouldDirty: true });
    }
  }, [deliveryCities, shippingCity, setValue]);

  const { submitOrder } = useOrderSubmission({
    cart,
    isLoggedIn,
    checkoutTotals,
    appliedCouponCode,
    setError,
    clearFieldErrors: () => clearErrors(),
    setFieldError: (field, message) =>
      setFormFieldError(field, { type: "server", message }),
  });

  const { orderSummary } = useOrderSummary({
    cart,
    checkoutTotals,
    currency,
  });

  useEffect(() => {
    if (isLoading) {
      return;
    }

    fetchCart();

    const handleCurrencyUpdate = () => {
      setCurrency(getStoredCurrency());
    };

    const handleLanguageUpdate = () => {
      setLanguage(getStoredLanguage());
    };

    const handleCurrencyRatesUpdate = () => {
      setCurrency(getStoredCurrency());
    };

    window.addEventListener('currency-updated', handleCurrencyUpdate);
    window.addEventListener('language-updated', handleLanguageUpdate);
    window.addEventListener('currency-rates-updated', handleCurrencyRatesUpdate);

    return () => {
      window.removeEventListener('currency-updated', handleCurrencyUpdate);
      window.removeEventListener('language-updated', handleLanguageUpdate);
      window.removeEventListener('currency-rates-updated', handleCurrencyRatesUpdate);
    };
  }, [isLoggedIn, isLoading, fetchCart]);

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isCourierShipping(shippingMethod)) {
      const formData = watch();
      const hasShippingAddress = formData.shippingAddress && formData.shippingAddress.trim().length > 0;
      const hasShippingCity = formData.shippingCity && formData.shippingCity.trim().length > 0;
      
      if (!hasShippingAddress || !hasShippingCity) {
        setError(t('checkout.errors.fillShippingAddress'));
        const shippingSection = document.querySelector('[data-shipping-section]');
        if (shippingSection) {
          shippingSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
      }
    } else if (shippingMethod === 'pickup') {
      const formData = watch();
      const hasPickupBranch = formData.pickupBranchId && formData.pickupBranchId.trim().length > 0;

      if (!hasPickupBranch) {
        setError(t('checkout.errors.branchRequired'));
        const shippingSection = document.querySelector('[data-shipping-section]');
        if (shippingSection) {
          shippingSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
      }
    }
    
    if (!isLoggedIn) {
      setShowShippingModal(true);
      return;
    }
    
    handleSubmit(submitOrder)(e);
  };

  const onSubmit = (data: CheckoutFormData) => {
    submitOrder(data);
  };

  return {
    // State
    cart,
    loading,
    error,
    setError,
    currency,
    logoErrors,
    setLogoErrors,
    showShippingModal,
    setShowShippingModal,
    deliveryCities,
    loadingDeliveryCities,
    pickupBranches,
    checkoutTotals,
    loadingCheckoutTotals,
    checkoutTotalsStale,
    // Form
    register,
    handleSubmit,
    errors,
    isSubmitting,
    setValue,
    watch,
    // Computed
    paymentMethod,
    shippingMethod,
    shippingCity,
    pickupBranchId,
    paymentMethods,
    orderSummary,
    appliedCouponCode,
    applyPromo,
    clearPromo,
    // Actions
    handlePlaceOrder,
    onSubmit,
    fetchCart,
    // Auth
    isLoggedIn,
  };
}
