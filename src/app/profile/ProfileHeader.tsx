import { Card } from '@shop/ui';
import Image from 'next/image';
import type { UserProfile } from './types';

interface ProfileHeaderProps {
  profile: UserProfile | null;
  t: (key: string) => string;
}

export function ProfileHeader({ profile, t }: ProfileHeaderProps) {
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
