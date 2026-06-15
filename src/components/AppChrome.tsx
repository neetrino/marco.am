'use client';

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import type { LanguageCode } from '../lib/language';
import { Header } from './Header';
import { MobileBottomNav } from './MobileBottomNav';
import { GlobalRoutePrefetch } from './navigation/GlobalRoutePrefetch';
import { RouteNavigationIndicator } from './navigation/RouteNavigationIndicator';

interface AppChromeProps {
  children: ReactNode;
  initialLanguage?: LanguageCode;
}

const PROFILE_PATH = '/profile';
const SUPER_SUDO_PATH = '/supersudo';
const REELS_WATCH_PATH = '/reels/watch';
const DesktopFooter = dynamic(
  () => import('./Footer').then((mod) => mod.Footer),
  { ssr: false },
);

export function AppChrome({ children, initialLanguage }: AppChromeProps) {
  const pathname = usePathname() ?? '';
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const stablePathname = isHydrated ? pathname : '';
  const isSupersudoRoute = stablePathname.startsWith(SUPER_SUDO_PATH);
  const isProfileRoute = stablePathname === PROFILE_PATH;
  const hideMobileHeaderFooterForProfile = isProfileRoute && !isSupersudoRoute;
  const showMobileBottomNav = !isSupersudoRoute;
  const mainPaddingClass =
    showMobileBottomNav && !isProfileRoute
      ? 'pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] min-[744px]:pb-0'
      : '';
  const mainBackgroundClass =
    stablePathname.startsWith(REELS_WATCH_PATH) ? 'bg-black' : '';
  const footerNode = (
    <div className="hidden lg:block">
      <DesktopFooter />
    </div>
  );

  return (
    <>
      {hideMobileHeaderFooterForProfile ? (
        <div className="hidden lg:block">
          <Header initialLanguage={initialLanguage} />
        </div>
      ) : (
        <Header initialLanguage={initialLanguage} />
      )}
      <main className={`${mainPaddingClass} ${mainBackgroundClass}`.trim()}>
        {children}
      </main>
      {footerNode}
      <GlobalRoutePrefetch />
      <RouteNavigationIndicator />
      {showMobileBottomNav && <MobileBottomNav />}
    </>
  );
}
