'use client';

import { useState } from 'react';
import { Button, Card } from '@shop/ui';
import { apiClient, ApiError, getClientErrorDetail } from '../../lib/api-client';
import { useAuth } from '../../lib/auth/AuthContext';

interface ProfileDeleteAccountProps {
  t: (key: string) => string;
}

export function ProfileDeleteAccount({ t }: ProfileDeleteAccountProps) {
  const { logout } = useAuth();
  const [confirmed, setConfirmed] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!confirmed || deleting) {
      return;
    }
    setError(null);
    setDeleting(true);
    try {
      await apiClient.delete<{ success: boolean }>('/api/v1/users/account');
      logout();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(getClientErrorDetail(err) ?? t('profile.deleteAccount.failed'));
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(t('profile.deleteAccount.failed'));
      }
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card className="border border-red-200 p-6">
      <h2 className="mb-2 text-center text-xl font-semibold text-gray-900">
        {t('profile.deleteAccount.title')}
      </h2>
      <p className="mb-4 text-center text-sm text-gray-600">{t('profile.deleteAccount.description')}</p>
      <ul className="mb-6 list-disc space-y-1 pl-5 text-sm text-gray-700">
        <li>{t('profile.deleteAccount.pointOrders')}</li>
        <li>{t('profile.deleteAccount.pointLogin')}</li>
        <li>{t('profile.deleteAccount.pointData')}</li>
      </ul>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <label className="mb-6 flex cursor-pointer items-start gap-3 text-sm text-gray-800">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
        />
        <span>{t('profile.deleteAccount.confirmCheckbox')}</span>
      </label>

      <div className="flex justify-center">
        <Button
          type="button"
          variant="primary"
          disabled={!confirmed || deleting}
          onClick={() => void handleDelete()}
          className="!rounded-full !bg-red-600 !px-6 !py-3 !text-white hover:!bg-red-700 disabled:!opacity-50"
        >
          {deleting ? t('profile.deleteAccount.deleting') : t('profile.deleteAccount.submit')}
        </Button>
      </div>
    </Card>
  );
}
