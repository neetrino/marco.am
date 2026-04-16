import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { Inter } from 'next/font/google';
import './globals.css';
import { ClientProviders } from '../components/ClientProviders';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Breadcrumb } from '../components/Breadcrumb';
import { MobileBottomNav } from '../components/MobileBottomNav';
import { MOBILE_NAV_LAYOUT_PADDING_BOTTOM } from '../components/mobile-bottom-nav.constants';
import { LANGUAGE_PREFERENCE_KEY, parseLanguageFromServer } from '../lib/language';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Shop - Professional E-commerce',
  description: 'Modern e-commerce platform',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const initialLanguage = parseLanguageFromServer(
    cookieStore.get(LANGUAGE_PREFERENCE_KEY)?.value,
  );

  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} bg-white text-gray-900 antialiased min-h-full`}>
        <Suspense fallback={null}>
          <ClientProviders>
            <div
              className="flex min-h-screen flex-col max-lg:[padding-bottom:var(--mobile-nav-pb)] lg:pb-0"
              style={
                {
                  ['--mobile-nav-pb' as string]: MOBILE_NAV_LAYOUT_PADDING_BOTTOM,
                } as React.CSSProperties
              }
            >
              <Header initialLanguage={initialLanguage} />
              <Breadcrumb />
              <main className="flex-1 w-full">
                {children}
              </main>
              <div className="hidden md:block">
                <Footer />
              </div>
              <MobileBottomNav />
            </div>
          </ClientProviders>
        </Suspense>
      </body>
    </html>
  );
}

