import { Card } from '@shop/ui';
import { UserAvatar } from '../../components/UserAvatar';
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
    <div className="w-full">
      <Card className="mb-4 p-4">
        <div className="flex flex-row items-center gap-4">
          <UserAvatar
            firstName={profile?.firstName}
            lastName={profile?.lastName}
            size="lg"
            className="flex-shrink-0"
          />

          <div className="flex-1 min-w-0 break-words">
            <h1 className="text-lg font-bold text-gray-900 mb-1 break-words">
              {profile?.firstName && profile?.lastName
                ? `${profile.firstName} ${profile.lastName}`
                : profile?.firstName
                  ? profile.firstName
                  : profile?.lastName
                    ? profile.lastName
                    : t('profile.myProfile')}
            </h1>
            {profile?.email && (
              <p className="text-sm font-bold text-gray-900 mb-1 break-words">{profile.email}</p>
            )}
            {profile?.phone && <p className="text-sm text-gray-500 break-words">{profile.phone}</p>}
          </div>
        </div>
      </Card>

      <nav
        className="rounded-xl border border-gray-200 bg-white p-2"
        aria-label={t('common.menu.title')}
      >
        <div className="flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex min-w-min flex-nowrap gap-2">
            {tabs.map((tab) => {
              const isDanger = tab.variant === 'danger';
              const isActive = activeTab === tab.id;
              const inactivePill =
                isDanger && !isActive
                  ? 'border border-red-100 bg-white text-red-700 hover:bg-red-50 hover:text-red-900'
                  : 'border border-transparent bg-gray-50 text-gray-700 hover:bg-gray-100 hover:text-gray-900';
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onTabChange(tab.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-marco-yellow text-[#050505] dark:text-[#050505]'
                      : inactivePill
                  }`}
                >
                  <span
                    className={`flex-shrink-0 ${
                      isActive ? 'text-[#050505] dark:text-[#050505]' : isDanger ? 'text-red-600' : 'text-gray-500'
                    }`}
                  >
                    {tab.icon}
                  </span>
                  <span className="whitespace-nowrap">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
}
