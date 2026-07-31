'use client';

import { useState, FormEvent, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Input, Card } from '@shop/ui';
import {
  useAuth,
  AUTH_VERIFICATION_TOKEN_KEY,
  AUTH_VERIFICATION_CHANNEL_KEY,
} from '@/lib/auth/AuthContext';
import { useTranslation } from '@/lib/i18n-client';
import { getErrorMessage } from '@/lib/types/errors';
import { logger } from '@/lib/utils/logger';
import { PENDING_WISHLIST_PRODUCT_QUERY_PARAM } from '@/lib/wishlist/wishlist-client';

const RESEND_COOLDOWN_SEC = 60;

function VerifyPageContent() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/';
  const pendingWishlistProductId = searchParams.get(PENDING_WISHLIST_PRODUCT_QUERY_PARAM);

  const { completeVerification, resendVerificationCode, isLoading } = useAuth();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [sessionOk, setSessionOk] = useState<boolean | null>(null);
  const [channel, setChannel] = useState<'email' | 'phone' | null>(null);

  useEffect(() => {
    try {
      const token = sessionStorage.getItem(AUTH_VERIFICATION_TOKEN_KEY);
      const ch = sessionStorage.getItem(AUTH_VERIFICATION_CHANNEL_KEY);
      setSessionOk(!!token);
      if (ch === 'email' || ch === 'phone') {
        setChannel(ch);
      }
      if (!token) {
        router.replace('/login');
      }
    } catch {
      setSessionOk(false);
      router.replace('/login');
    }
  }, [router]);

  useEffect(() => {
    if (cooldown <= 0) {
      return;
    }
    const id = window.setInterval(() => {
      setCooldown((c) => (c <= 1 ? 0 : c - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [cooldown]);

  const subtitle =
    channel === 'phone'
      ? t('login.verify.subtitlePhone')
      : t('login.verify.subtitleEmail');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const trimmed = code.trim();
    if (!/^\d{4,8}$/.test(trimmed)) {
      setError(t('login.verify.errors.codeRequired'));
      return;
    }
    setIsSubmitting(true);
    try {
      await completeVerification(trimmed, redirectTo, pendingWishlistProductId);
      logger.devLog('✅ [VERIFY] Completed, redirected');
    } catch (err: unknown) {
      setError(getErrorMessage(err) || t('login.verify.errors.failed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || isResending) {
      return;
    }
    setError(null);
    setIsResending(true);
    try {
      await resendVerificationCode();
      setCooldown(RESEND_COOLDOWN_SEC);
    } catch (err: unknown) {
      setError(getErrorMessage(err) || t('login.verify.errors.failed'));
    } finally {
      setIsResending(false);
    }
  };

  if (sessionOk === null) {
    return (
      <div className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="p-8">
          <p className="text-gray-600">{t('login.form.submitting')}</p>
        </Card>
      </div>
    );
  }

  if (!sessionOk) {
    return null;
  }

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Card className="p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('login.verify.title')}</h1>
        <p className="text-gray-600 mb-8">{subtitle}</p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
              {t('login.verify.codeLabel')}
            </label>
            <Input
              id="code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              className="w-full"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
              disabled={isSubmitting || isLoading}
              required
            />
          </div>
          <Button
            variant="primary"
            className="w-full"
            type="submit"
            disabled={isSubmitting || isLoading}
          >
            {isSubmitting || isLoading ? t('login.verify.submitting') : t('login.verify.submit')}
          </Button>
        </form>

        <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <button
            type="button"
            className="text-sm text-blue-600 hover:underline disabled:text-gray-400 disabled:no-underline"
            onClick={handleResend}
            disabled={cooldown > 0 || isResending || isLoading}
          >
            {cooldown > 0
              ? `${t('login.verify.resendWait')} ${cooldown}s`
              : t('login.verify.resend')}
          </button>
          <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900">
            {t('login.verify.backToLogin')}
          </Link>
        </div>
      </Card>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-lg mx-auto px-4 py-12">
          <Card className="p-8">
            <p className="text-gray-600">…</p>
          </Card>
        </div>
      }
    >
      <VerifyPageContent />
    </Suspense>
  );
}
