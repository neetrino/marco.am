'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import type { LanguageCode } from '../lib/language';
import { Footer } from './Footer';
import { Header } from './Header';
import { MobileBottomNav } from './MobileBottomNav';

interface AppChromeProps {
  children: ReactNode;
  initialLanguage?: LanguageCode;
}

const PROFILE_PATH = '/profile';
const SUPER_SUDO_PATH = '/supersudo';
const REELS_PATH = '/reels';
const REELS_WATCH_PATH = '/reels/watch';

export function AppChrome({ children, initialLanguage }: AppChromeProps) {
  const pathname = usePathname();
  const isSupersudoRoute = pathname?.startsWith(SUPER_SUDO_PATH) ?? false;
  const isProfileRoute = pathname === PROFILE_PATH;
  const isReelsRoute = pathname?.startsWith(REELS_PATH) ?? false;
  const hideMobileHeaderFooterForProfile = isProfileRoute && !isSupersudoRoute;
  const showMobileBottomNav = !isSupersudoRoute;
  const mainPaddingClass =
    showMobileBottomNav && !isProfileRoute ? 'pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] lg:pb-0' : '';
  const mainBackgroundClass =
    pathname?.startsWith(REELS_WATCH_PATH) ?? false ? 'bg-black' : '';

  const headerNode = <Header initialLanguage={initialLanguage} />;
  const footerNode = (
    <div className="hidden lg:block">
      <Footer />
    </div>
  );

  return (
    <>
      {hideMobileHeaderFooterForProfile ? <div className="hidden lg:block">{headerNode}</div> : headerNode}
      <main className={`${mainPaddingClass} ${mainBackgroundClass}`.trim()}>
        {children}
      </main>
      {footerNode}
      {showMobileBottomNav && <MobileBottomNav />}
    </>
  );
}
