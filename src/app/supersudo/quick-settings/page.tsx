'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslation } from '../../../lib/i18n-client';
import { getStoredLanguage } from '../../../lib/language';
import { QuickSettingsContent } from './QuickSettingsContent';
import { useQuickSettings } from './useQuickSettings';

export default function QuickSettingsPage() {
  const { t, lang } = useTranslation();
  const activeLocale = lang ?? getStoredLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const [currentPath, setCurrentPath] = useState(pathname || '/supersudo/quick-settings');

  const quickSettings = useQuickSettings({ activeLocale, t });

  useEffect(() => {
    if (pathname) {
      setCurrentPath(pathname);
    }
  }, [pathname]);

  return (
    <QuickSettingsContent
      currentPath={currentPath}
      router={router}
      t={t}
      {...quickSettings}
    />
  );
}
