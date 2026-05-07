import { Card } from '@shop/ui';
import Image from 'next/image';
import type { UserProfile, ProfileTab, ProfileTabConfig } from './types';

interface ProfileHeaderProps {
  profile: UserProfile | null;
  tabs: ProfileTabConfig[];
  activeTab: ProfileTab;
  onTabChange: (tab: ProfileTab) => void;
  t: (key: string) => string;
}

export function ProfileHeader({ profile, tabs, activeTab, onTabChange, t }: ProfileHeaderProps) {
  return (
    <div className="flex w-full flex-col gap-4">
      <Card className="p-4">
        <div className="flex flex-row items-center gap-4">
          <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-full border border-slate-200 bg-gradient-to-br from-slate-100 to-slate-300">
            <Image
              src="/assets/profile/user-profile.png"
              alt="User profile avatar"
              fill
              sizes="96px"
              className="object-cover scale-[1.40]"
              priority
            />
          </div>

          <div className="min-w-0 flex-1 break-words">
            <h1 className="mb-1 break-words text-lg font-bold text-gray-900">
              {profile?.firstName && profile?.lastName
                ? `${profile.firstName} ${profile.lastName}`
                : profile?.firstName
                  ? profile.firstName
                  : profile?.lastName
                    ? profile.lastName
                    : t('profile.myProfile')}
            </h1>
            {profile?.email && (
              <p className="mb-1 break-words text-sm font-bold text-gray-900">{profile.email}</p>
            )}
            {profile?.phone && <p className="break-words text-sm text-gray-500">{profile.phone}</p>}
          </div>
        </div>
      </Card>

      <nav
        className="rounded-xl border border-gray-200 bg-white p-2 shadow-[0_8px_24px_rgba(16,16,16,0.04)]"
        aria-label={t('common.menu.title')}
      >
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-1 lg:gap-1">
          {tabs.map((tab) => {
            const isDanger = tab.variant === 'danger';
            const isActive = activeTab === tab.id;
            const inactiveRow =
              isDanger && !isActive
                ? 'border border-red-100 bg-white text-red-700 hover:bg-red-50 hover:text-red-900'
                : 'border border-transparent bg-gray-50 text-gray-700 hover:bg-gray-100 hover:text-gray-900';
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex w-full min-h-16 flex-col items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-center text-xs font-semibold transition-all duration-200 lg:min-h-0 lg:flex-row lg:items-center lg:justify-start lg:gap-3 lg:px-3 lg:py-2.5 lg:text-left lg:text-sm ${
                  isActive ? 'bg-marco-yellow text-[#050505] shadow-sm dark:text-[#050505]' : inactiveRow
                }`}
              >
                <span
                  className={`flex-shrink-0 ${
                    isActive ? 'text-[#050505] dark:text-[#050505]' : isDanger ? 'text-red-600' : 'text-gray-500'
                  }`}
                >
                  {tab.icon}
                </span>
                <span className="min-w-0 max-w-full break-words leading-snug lg:flex-1 lg:text-left">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
