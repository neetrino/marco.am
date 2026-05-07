import { useAuth } from '../../lib/auth/AuthContext';
import { Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { ProfileTab, ProfileTabConfig } from './types';

interface ProfileSidebarNavProps {
  tabs: ProfileTabConfig[];
  activeTab: ProfileTab;
  onTabChange: (tab: ProfileTab) => void;
  t: (key: string) => string;
}

export function ProfileSidebarNav({ tabs, activeTab, onTabChange, t }: ProfileSidebarNavProps) {
  const { logout } = useAuth();
  const router = useRouter();

  return (
    <div className="flex w-full flex-col gap-2">
      <nav className="rounded-2xl border border-slate-200 bg-white/80 p-2 lg:p-2" aria-label={t('common.menu.title')}>
        <div className="mb-1.5 rounded-xl border border-slate-200/80 bg-slate-50/80 p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] lg:hidden">
          <button
            type="button"
            onClick={() => router.push('/')}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-base font-medium text-slate-700 transition hover:bg-white"
          >
            <svg className="h-5 w-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10.5l9-7 9 7M5.5 9.5V20h13V9.5" />
            </svg>
            <span className="flex-1">Home</span>
            <svg className="h-4 w-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m9 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <div className="mb-2 border-b border-slate-200/80 lg:hidden" />

        <div className="mb-2">
          <button
            type="button"
            onClick={() => onTabChange('password')}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-base font-medium text-slate-700 transition hover:bg-slate-100"
          >
            <Settings className="h-5 w-5 text-slate-500" strokeWidth={2} aria-hidden />
            <span className="flex-1">Settings</span>
            <svg className="h-4 w-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m9 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col gap-1.5">
          {tabs.map((tab) => {
            const isDanger = tab.variant === 'danger';
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-base font-medium transition lg:gap-3 lg:px-3 lg:py-3 lg:text-base ${
                  isActive
                    ? 'bg-[#fff4bf] text-[#7a5a00]'
                    : isDanger
                      ? 'text-red-600 hover:bg-red-50'
                      : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className={isActive ? 'text-[#8c6500]' : isDanger ? 'text-red-600' : 'text-slate-500'}>
                  {tab.icon}
                </span>
                <span className="flex-1">{tab.label}</span>
                <svg
                  className={`h-4 w-4 ${isActive ? 'text-[#8c6500]' : isDanger ? 'text-red-400' : 'text-slate-400'}`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="m9 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            );
          })}
        </div>
      </nav>

      <button
        type="button"
        onClick={logout}
        className="flex w-full items-center gap-3 rounded-xl border border-red-100 bg-white px-3 py-2.5 text-left text-base font-medium text-red-600 transition hover:bg-red-50 lg:gap-3 lg:px-4 lg:py-3 lg:text-base"
      >
        <svg className="h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 6v12a2 2 0 002 2h8" />
        </svg>
        <span>{t('common.navigation.logout')}</span>
      </button>
    </div>
  );
}
