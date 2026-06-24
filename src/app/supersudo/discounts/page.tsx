'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslation } from '../../../lib/i18n-client';
import { getStoredLanguage } from '../../../lib/language';
import { DiscountsContent } from './DiscountsContent';
import { useDiscounts } from './useDiscounts';

export default function DiscountsPage() {
  const { t, lang } = useTranslation();
  const activeLocale = lang ?? getStoredLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const [currentPath, setCurrentPath] = useState(pathname || '/supersudo/discounts');

  const discounts = useDiscounts({ activeLocale, t });

  useEffect(() => {
    if (pathname) {
      setCurrentPath(pathname);
    }
  }, [pathname]);

  return (
    <DiscountsContent
      currentPath={currentPath}
      router={router}
      t={t}
      {...discounts}
    />
  );
}
