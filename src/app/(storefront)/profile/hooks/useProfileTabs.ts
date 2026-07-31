import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { ProfileTab } from '../types';

const VALID_PROFILE_TABS: ProfileTab[] = [
  'dashboard',
  'orders',
  'personal',
  'addresses',
  'password',
  'deleteAccount',
];

function parseProfileTabParam(raw: string | null): ProfileTab {
  if (raw && VALID_PROFILE_TABS.includes(raw as ProfileTab)) {
    return raw as ProfileTab;
  }
  return 'dashboard';
}

export function useProfileTabs() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<ProfileTab>(() =>
    parseProfileTabParam(searchParams.get('tab'))
  );

  // Update tab from URL query parameter
  useEffect(() => {
    setActiveTab(parseProfileTabParam(searchParams.get('tab')));
  }, [searchParams]);

  const handleTabChange = (tab: ProfileTab) => {
    setActiveTab(tab);
    router.push(`/profile?tab=${tab}`, { scroll: false });
  };

  return {
    activeTab,
    handleTabChange,
  };
}




