'use client';

import { MessageCircle } from 'lucide-react';
import { useTranslation } from '@/lib/i18n-client';

export function HomeChatFab() {
  const { t } = useTranslation();

  return (
    <a
      href="/contact"
      className="fixed bottom-6 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#ffca03] text-[#101010] shadow-lg transition-transform hover:scale-105 md:bottom-8 md:right-8"
      aria-label={t('home.chat_fab_aria')}
    >
      <MessageCircle className="h-7 w-7" strokeWidth={2} />
    </a>
  );
}
