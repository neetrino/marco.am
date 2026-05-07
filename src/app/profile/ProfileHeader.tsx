import { Card } from '@shop/ui';
import Image from 'next/image';
import type { UserProfile, ProfileTab } from './types';

interface ProfileHeaderProps {
  profile: UserProfile | null;
  onTabChange: (tab: ProfileTab) => void;
  t: (key: string) => string;
}

export function ProfileHeader({ profile, onTabChange, t }: ProfileHeaderProps) {
  const displayName =
    profile?.firstName && profile?.lastName
      ? `${profile.firstName} ${profile.lastName}`
      : profile?.firstName
        ? profile.firstName
        : profile?.lastName
          ? profile.lastName
          : t('profile.myProfile');

  return (
    <div className="flex w-full flex-col gap-3">
      <Card className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-[#f6f7f7] p-3.5 shadow-[0_18px_50px_rgba(15,23,42,0.10)] lg:p-6">
        <div className="mb-5 hidden items-center justify-between px-1 lg:flex">
          <button
            type="button"
            onClick={() => onTabChange('dashboard')}
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-700 transition hover:bg-slate-200/70"
            aria-label={t('profile.tabs.dashboard')}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-slate-900 lg:text-[2rem] lg:leading-9">{t('profile.myProfile')}</h1>
          <div className="h-9 w-9" aria-hidden />
        </div>

        <div className="mb-2.5 flex items-center gap-3.5">
          <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-full border border-slate-200 bg-gradient-to-br from-slate-100 to-slate-300 lg:h-24 lg:w-24">
            <Image
              src="/assets/profile/user-profile.png"
              alt="User profile avatar"
              fill
              sizes="64px"
              className="object-cover scale-[1.40]"
              priority
            />
          </div>

          <div className="min-w-0 flex-1 break-words">
            <h2 className="mb-0.5 break-words text-xl font-semibold leading-6 text-slate-900 lg:text-2xl lg:leading-7">{displayName}</h2>
            {profile?.email && <p className="mb-2 break-words text-sm text-slate-700 lg:mb-3 lg:text-base">{profile.email}</p>}
          </div>
        </div>

      </Card>
    </div>
  );
}
