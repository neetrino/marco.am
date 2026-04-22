import type { FormEvent } from 'react';
import { Button, Input, Card } from '@shop/ui';

interface ProfilePasswordProps {
  passwordForm: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  };
  setPasswordForm: (form: ProfilePasswordProps['passwordForm']) => void;
  savingPassword: boolean;
  onSave: (e: FormEvent) => void;
  t: (key: string) => string;
}

export function ProfilePassword({
  passwordForm,
  setPasswordForm,
  savingPassword,
  onSave,
  t,
}: ProfilePasswordProps) {
  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">{t('profile.password.title')}</h2>
      <form onSubmit={onSave} className="space-y-4 max-w-xl mx-auto">
        <Input
          label={t('profile.password.currentPassword')}
          type="password"
          value={passwordForm.currentPassword}
          onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
          placeholder={t('profile.password.currentPasswordPlaceholder')}
          className="!rounded-full !px-5 !py-3"
          required
        />
        <Input
          label={t('profile.password.newPassword')}
          type="password"
          value={passwordForm.newPassword}
          onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
          placeholder={t('profile.password.newPasswordPlaceholder')}
          className="!rounded-full !px-5 !py-3"
          required
        />
        <Input
          label={t('profile.password.confirmPassword')}
          type="password"
          value={passwordForm.confirmPassword}
          onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
          placeholder={t('profile.password.confirmPasswordPlaceholder')}
          className="!rounded-full !px-5 !py-3"
          required
        />
        <div className="pt-4 flex justify-center">
          <Button
            type="submit"
            variant="primary"
            disabled={savingPassword}
            className="!rounded-full !px-4 sm:!px-6 !py-3 !bg-marco-black !text-white !hover:bg-marco-black hover:opacity-90 transition-opacity whitespace-nowrap"
          >
            {savingPassword ? (
              t('profile.password.changing')
            ) : (
              <>
                <span className="sm:hidden">{t('profile.password.changeShort')}</span>
                <span className="hidden sm:inline">{t('profile.password.change')}</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
}



