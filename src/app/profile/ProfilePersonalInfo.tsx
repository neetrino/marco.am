import type { FormEvent } from 'react';
import { Button, Input, Card } from '@shop/ui';
import type { UserProfile } from './types';

interface ProfilePersonalInfoProps {
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  setPersonalInfo: (info: ProfilePersonalInfoProps['personalInfo']) => void;
  savingPersonal: boolean;
  onSave: (e: FormEvent) => void;
  profile: UserProfile | null;
  t: (key: string) => string;
}

export function ProfilePersonalInfo({
  personalInfo,
  setPersonalInfo,
  savingPersonal,
  onSave,
  profile,
  t,
}: ProfilePersonalInfoProps) {
  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">{t('profile.personal.title')}</h2>
      <form onSubmit={onSave} className="space-y-4 max-w-xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label={t('profile.personal.firstName')}
            value={personalInfo.firstName}
            onChange={(e) => setPersonalInfo({ ...personalInfo, firstName: e.target.value })}
            placeholder={t('profile.personal.firstNamePlaceholder')}
            className="!rounded-full !px-5 !py-3"
          />
          <Input
            label={t('profile.personal.lastName')}
            value={personalInfo.lastName}
            onChange={(e) => setPersonalInfo({ ...personalInfo, lastName: e.target.value })}
            placeholder={t('profile.personal.lastNamePlaceholder')}
            className="!rounded-full !px-5 !py-3"
          />
        </div>
        <Input
          label={t('profile.personal.email')}
          type="email"
          value={personalInfo.email}
          onChange={(e) => setPersonalInfo({ ...personalInfo, email: e.target.value })}
          placeholder={t('profile.personal.emailPlaceholder')}
          className="!rounded-full !px-5 !py-3"
        />
        <Input
          label={t('profile.personal.phone')}
          type="tel"
          value={personalInfo.phone}
          onChange={(e) => setPersonalInfo({ ...personalInfo, phone: e.target.value })}
          placeholder={t('profile.personal.phonePlaceholder')}
          className="!rounded-full !px-5 !py-3"
        />
        <div className="flex flex-nowrap items-center justify-center gap-2 pt-4">
          <Button
            type="submit"
            variant="primary"
            disabled={savingPersonal}
            className="whitespace-nowrap !rounded-full !px-4 sm:!px-6 !py-3 !bg-marco-black !text-white !hover:bg-marco-black hover:opacity-90 transition-opacity"
          >
            {savingPersonal ? (
              t('profile.personal.saving')
            ) : (
              <>
                <span className="sm:hidden">{t('profile.personal.saveShort')}</span>
                <span className="hidden sm:inline">{t('profile.personal.save')}</span>
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="whitespace-nowrap !rounded-full !px-4 sm:!px-6 !py-3"
            onClick={() => {
              setPersonalInfo({
                firstName: profile?.firstName || '',
                lastName: profile?.lastName || '',
                email: profile?.email || '',
                phone: profile?.phone || '',
              });
            }}
          >
            {t('profile.personal.cancel')}
          </Button>
        </div>
      </form>
    </Card>
  );
}



